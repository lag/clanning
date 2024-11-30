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
SLEEP_INTERVAL = 60  # seconds
API_BASE_URL = 'https://api.clashofclans.com/v1'

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
            
        return player_data

    except httpx.HTTPStatusError as e:
        player_data['error'] = str(e.response.text)
        return player_data
    except Exception as e:
        player_data['error'] = str(e)
        return player_data

async def main(players: list[str]) -> None:
    setup_directories(players)
    
    async with httpx.AsyncClient() as client:
        while True:
            print('┌──────────────────────────────────────────────────────')
            
            for player in players:
                player_data = await get_api(client, player)

                if 'player' in player_data:
                    dumped = orjson.dumps(player_data['player'])
                    player_data_hash = hashlib.md5(dumped).hexdigest()
                    
                    print('│ Checked:', player, player_data_hash)
                    
                    filepath = f'history/{player}/{player_data_hash}.json'
                    if not os.path.exists(filepath):
                        with open(filepath, 'wb') as f:
                            f.write(compress(orjson.dumps(player_data)))
                        print('└─ Wrote:', player, player_data_hash)
                
                # Update status files
                status_file = 'last_error.txt' if 'error' in player_data else 'last_update.txt'
                with open(status_file, 'w') as f:
                    f.write(str(time.time()))
            
            await asyncio.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    try:
        with open('players.json', 'rb') as f:
            players = orjson.loads(f.read())
        asyncio.run(main(list(players.keys())))
    except KeyboardInterrupt:
        print("\nGoodbye!")
