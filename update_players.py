# Standard library
import asyncio
import hashlib
import os
import time
from typing import Dict, Any
from urllib.parse import quote_plus

# Third-party
import httpx
import orjson
from dotenv import load_dotenv
from zstd import compress

load_dotenv()

API_KEY = os.getenv('API_TOKEN')
DEFAULT_SLEEP_INTERVAL = 60  # seconds
API_BASE_URL = 'https://api.clashofclans.com/v1'

DEFAULT_CACHE_TIMERS = {'miss': 60}

CHECK_TIMERS = {}
LAST_UPDATES = {}

def setup_directories(players: list[str]) -> None:
    """Ensure all required directories exist."""
    os.makedirs('history', exist_ok=True)
    for player in players:
        os.makedirs(f'history/{player}', exist_ok=True)

async def get_api(client: httpx.AsyncClient, player: str) -> Dict[str, Any]:
    """Fetch player and clan data from the API."""
    player_data = {'time': time.time()}
    
    try:
        response = await client.get(
            f'{API_BASE_URL}/players/{quote_plus(player)}',
            headers={'Authorization': f'Bearer {API_KEY}'}
        )
        response.raise_for_status()
        player_data['player'] = response.json()

        if 'clan' in player_data['player']:
            clan_response = await client.get(
                f'{API_BASE_URL}/clans/{quote_plus(player_data["player"]["clan"]["tag"])}',
                headers={'Authorization': f'Bearer {API_KEY}'}
            )
            clan_response.raise_for_status()
            del player_data['player']['clan']
            player_data['clan'] = clan_response.json()
        
        try:
            timer = int(response.headers['cache-control'].split('max-age=')[1]) # seconds
            CHECK_TIMERS[player] = int(time.time()) + timer + 1 # add a small amount to prevent accidental cache hit
        except Exception as e:
            print('error attempting to parse max-age:', e)
            CHECK_TIMERS[player] = DEFAULT_SLEEP_INTERVAL
            
        return player_data

    except httpx.HTTPStatusError as e:
        player_data['error'] = str(e.response.text)
        return player_data
    except Exception as e:
        player_data['error'] = str(e)
        return player_data

def format_countdown(player: str, seconds_left: int) -> str:
    """Format the countdown time into a progress bar with time remaining."""
    total_width = 42
    minutes, seconds = divmod(max(0, seconds_left), 60)
    time_str = f"{int(minutes):02d}:{int(seconds):02d}"
    
    percentage = max(0, min(1, seconds_left / DEFAULT_SLEEP_INTERVAL))
    filled_width = int(total_width * (1 - percentage))
    bar = "█" * filled_width + "░" * (total_width - filled_width)
    
    # Get last update time from memory
    last_update = LAST_UPDATES.get(player)
    if last_update:
        time_diff = int(time.time() - last_update)
        days, remainder = divmod(time_diff, 86400)
        hours, remainder = divmod(remainder, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        last_update_str = ''
        if days: last_update_str += f'{days}d'
        if hours: last_update_str += f'{hours}h'
        if minutes: last_update_str += f'{minutes}m'
        if seconds or not last_update_str: last_update_str += f'{seconds}s'
    else:
        last_update_str = 'never'
    
    return f"│ {player}: {bar} {time_str} (last: {last_update_str})"

async def main(players: list[str]) -> None:
    setup_directories(players)

    header_lines = 1
    total_lines = len(players) + 2 + header_lines

    # Print initial newlines to create space for our display
    print('\n' * total_lines)
    # Move cursor up to the created space
    print(f"\033[{total_lines}A", end='', flush=True)
    
    async with httpx.AsyncClient() as client:
        while True:

            print('\033[2K[ Update Players | https://clann.ing | https://github.com/lag/clanning ]')
            # Clear entire display area first
            print('\033[2K', end='')  # Clear current line
            print('┌' + '─' * 78 + '┐')
            
            for player in players:

                if player in CHECK_TIMERS and int(time.time()) < CHECK_TIMERS[player]:
                    seconds_left = CHECK_TIMERS[player] - int(time.time())
                    progress = format_countdown(player, seconds_left)
                    print('\033[2K' + progress)
                    continue

                player_data = await get_api(client, player)

                CHECK_TIMERS[player] = int(time.time()) + DEFAULT_CACHE_TIMERS['miss']
                progress = format_countdown(player, DEFAULT_CACHE_TIMERS['miss'])
                print('\033[2K', end='')  # Clear line first
                print(progress)

                if 'player' in player_data:
                    dumped = orjson.dumps(player_data['player'])
                    player_data_hash = hashlib.md5(dumped).hexdigest()
                    
                    #print('│ Checked:', player, player_data_hash)
                    
                    filepath = f'history/{player}/{player_data_hash}.json'
                    if not os.path.exists(filepath):
                        with open(filepath, 'wb') as f:
                            f.write(compress(orjson.dumps(player_data)))
                        LAST_UPDATES[player] = time.time()
                
                # Update status files
                status_file = 'last_error.txt' if 'error' in player_data else 'last_update.txt'
                with open(status_file, 'w') as f:
                    f.write(str(time.time()))

            print('\033[2K' + '└' + '─' * 78 + '┘')

            if any(player in CHECK_TIMERS and int(time.time()) < CHECK_TIMERS[player] for player in players):
                # Move cursor up to overwrite everything
                print(f"\033[{total_lines}A", end='', flush=True)
        
            await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        with open('players.json', 'rb') as f:
            players = orjson.loads(f.read())
        asyncio.run(main(list(players.keys())))
    except KeyboardInterrupt:
        total_lines = len(players) + 2 + 1
        print(f"\033[{total_lines}B", end='')
        print("\nGoodbye!")
