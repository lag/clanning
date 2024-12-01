# Standard library
import math
import os
from pathlib import Path
from datetime import datetime

# Third-party
from fastapi.staticfiles import StaticFiles
import orjson
import starlette
from zstd import decompress
from utils.fastdeepdiff import fast_deep_diff, clean_dictionary
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title="clann.ing API",
    description="API for tracking and retrieving player history data",
    version="0.0.2"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
    compresslevel=9,
)

METRICS = {
    'player.townHallLevel': None,
    'player.trophies': None,
    'player.bestTrophies': None,
    'player.expLevel': None,
    'player.multiplayerWins': 'Conqueror',
    'player.goldStolen': 'Gold Grab',
    'player.elixirStolen': 'Elixir Escapade',
    'player.obstaclesRemoved': 'Nice and Tidy'
}

# Load data files once at startup
def load_data_files():
    try:
        with open('../players.json', 'rb') as f:
            player_data = orjson.loads(f.read())
        
        # Create aliases mapping
        player_aliases = {
            alias: player
            for player in player_data
            for alias in player_data[player]['aliases']
        }
        
        # Load building and storage data
        with open('static/data/buildings.json', 'rb') as f:
            building_data = orjson.loads(f.read())
        with open('static/data/storages.json', 'rb') as f:
            storage_data = orjson.loads(f.read())
            
        return player_data, player_aliases, building_data, storage_data
    except Exception as e:
        print(f"Error loading data files: {e}")
        raise

PLAYER_DATA, PLAYER_ALIASES, GLOBAL_BUILDING_DATA, GLOBAL_STORAGE_DATA = load_data_files()

def timeago(timestamp):
    now = datetime.now()
    try:
        if isinstance(timestamp, (int, float)):
            if timestamp > 1e10:  # If timestamp is in milliseconds
                timestamp = timestamp / 1000
            timestamp = datetime.fromtimestamp(timestamp)
        elif isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        diff = now - timestamp
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return f'{seconds} second{"s" if seconds != 1 else ""} ago'
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f'{minutes} minute{"s" if minutes != 1 else ""} ago'
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f'{hours} hour{"s" if hours != 1 else ""} ago'
        elif seconds < 2592000:  # 30 days
            days = int(seconds / 86400)
            return f'{days} day{"s" if days != 1 else ""} ago'
        else:
            months = int(seconds / 2592000)
            return f'{months} month{"s" if months != 1 else ""} ago'
    except Exception as e:
        print(f"Error in timeago filter: {e}")  # For debugging
        return timestamp  # Return original timestamp if parsing fails
    
templates = Jinja2Templates(directory="templates")
templates.env.filters["timeago"] = timeago

class InvalidPathError(Exception):pass

def normalize_player_tag(player: str) -> str:
    """Normalize player tag by adding # if missing"""
    if player[0] != '#' and f"#{player}" in PLAYER_DATA:
        return f"#{player}"
    return player

def get_player_tag(player: str) -> str:
    """Get canonical player tag from player input"""
    player = normalize_player_tag(player)
    
    if player in PLAYER_ALIASES:
        return PLAYER_ALIASES[player]
    return player

def get_safe_path(player_tag: str, base_dir: str = "history") -> Path:
    """
    Safely resolve and validate file paths to prevent directory traversal attacks.
    """
    if not player_tag or not isinstance(player_tag, str):
        raise InvalidPathError("Invalid player tag")
    
    # Use relative path from current directory
    base_path = Path(f"../{base_dir}").resolve(strict=True)
    
    cleaned_tag = ''.join(c for c in player_tag if c.isalnum() or c in '#-_')
    
    try:
        player_path = (base_path / cleaned_tag).resolve(strict=True)
        
        if not str(player_path).startswith(str(base_path)):
            raise InvalidPathError("Path traversal detected")
            
        return player_path
        
    except FileNotFoundError:
        raise InvalidPathError("Directory not found")
    except RuntimeError:
        raise InvalidPathError("Path resolution failed")
    except Exception as e:
        raise InvalidPathError(f"Unexpected error in path validation: {str(e)}")

async def _get_player(player: str) -> tuple[dict, int]:
    """Internal function that returns player data and status code"""
    try:
        player = get_player_tag(player)
        if player not in PLAYER_ALIASES.values() and f'#{player}' not in PLAYER_ALIASES.values():
            return {"error": "Player not found", "player": player}, 404
        
        player_path = get_safe_path(player, 'history')
            
        most_recent_data = None
        files = []
        for file in os.listdir(player_path):
            file_path = player_path / file
            try:
                mtime = os.path.getmtime(file_path)
                files.append((file, mtime))
            except OSError as e:
                print(f"Error getting mtime for {file}: {e}")
                continue

        if not files:
            return {"error": "No data found for player", "player": player}, 404
        
        files.sort(key=lambda x: x[1], reverse=True)
        
        with open(player_path / files[0][0], 'rb') as f:
            data = orjson.loads(decompress(f.read()))
            if most_recent_data is None or data['time'] > most_recent_data['time']:
                most_recent_data = data

        return most_recent_data, 200

    except InvalidPathError as e:
        return {"error": str(e)}, 400
    except Exception as e:
        return {"error": "Internal server error", "details": str(e)}, 500
    
async def _get_player_history(player: str) -> tuple[dict, int]:
    """Internal function that returns player history and status code"""
    try:
        player = get_player_tag(player)
        if player not in PLAYER_ALIASES.values() and f'#{player}' not in PLAYER_ALIASES.values():
            return {"error": "Player not found", "player": player}, 404

        player_path = get_safe_path(player)
        files = os.listdir(player_path)

        if not files:
            return {"error": "No history found for player", "player": player}, 404

        history = {}
        for file in files:
            try:
                with open(player_path / file, 'rb') as f:
                    data = orjson.loads(decompress(f.read()))
                    history[data['time']] = data
            except Exception as e:
                print(f"Error reading file {file}: {str(e)}")
                continue

        if not history:
            return {"error": "Failed to load player history", "player": player}, 500

        last_timestamp = None
        diffs = {}

        for timestamp in sorted(history.keys()):
            if last_timestamp is not None:
                try:
                    diff = fast_deep_diff(
                        history[last_timestamp],
                        history[timestamp]
                    )
                    diffs[str(timestamp)] = clean_dictionary(diff)
                except Exception as e:
                    print(f"Error computing diff at {timestamp}: {str(e)}")
                    diffs[str(timestamp)] = {"error": str(e)}
            last_timestamp = timestamp

        return diffs, 200

    except InvalidPathError as e:
        return {"error": str(e)}, 400
    except Exception as e:
        return {"error": "Internal server error", "details": str(e)}, 500
    
async def _get_player_buildings(player: str) -> tuple[dict, int]:
    """Internal function that returns player buildings and status code"""
    player = get_player_tag(player)
    if player not in PLAYER_ALIASES.values() and f'#{player}' not in PLAYER_ALIASES.values():
        return {"error": "Player not found", "player": player}, 404
    
    list_priorities = [
        'Town Hall',
        'Clan Castle',
        'Cannon',
        'Archer Tower',
        'Wizard Tower',
        'Air Defense',
        'Mortar',
        'Hidden Tesla',
        'X-Bow',
        'Inferno Tower',
        'Air Sweeper',
        'Eagle Artillery',
        'Bomb Tower',
        'Scattershot',
        "Builder's Hut",
        "B.O.B's Hut",
        "Elixir Collector",
        "Elixir Storage",
        "Gold Mine",
        "Gold Storage",
        'Dark Elixir Drill',
        'Dark Elixir Storage',
        "Army Camp",
        "Barracks",
        "Laboratory",
        'Spell Factory',
        'Dark Barracks',
        'Dark Spell Factory',
        'Workshop',
        'Pet House',
        'Blacksmith',
        'Hero Hall',
        "Bomb",
        'Spring Trap',
        'Giant Bomb',
        'Air Bomb',
        'Seeking Air Mine',
        'Skeleton Trap',
        'Tornado Trap',
    ]

    if os.path.exists(f'../manual_history/{player}.json'):
        buildings = {}
        audit = []
        buildings_log = []
        resources_log = []

        with open(f'../manual_history/{player}.json', 'rb') as f:
            history = orjson.loads(f.read())
            for timestamp in history:
                if 'buildings' in history[timestamp]:
                    for building in history[timestamp]['buildings']:
                        if building['id'] in buildings:
                            buildings_log.append({**building, 'time': int(timestamp)})

                            if buildings[building['id']]['level'] >= building['level']:
                                audit.append(f"{timestamp} | Upgraded: {buildings[building['id']]['name']} to Level {building['level']} (id #{building['id']})")
                            if buildings[building['id']]['name'] != building['name']:
                                audit.append(f"{timestamp} | Renamed: {buildings[building['id']]['name']} to {building['name']} (id #{building['id']})")
                        buildings[building['id']] = building
                if 'resources' in history[timestamp]:
                    resources_log.append({**history[timestamp]['resources'], 'time': int(timestamp)})

        buildings_list = list(buildings.values())
        buildings_list.sort(
            key=lambda x: (
                list_priorities.index(x['name']) if x['name'] in list_priorities else len(list_priorities),
                x['name'],
                x.get('level', 0)
            )
        )

        buildings_log.reverse()

        response = {
            'audit': audit,
            'logs': {
                'upgrades': buildings_log,
                'resources': resources_log
            },
            'buildings': buildings_list
        }
                
        return response, 200
    else:
        return {"error": "No manual history found for player", "player": player}, 404

@app.get('/api/player/{player}')
async def get_player(player: str) -> JSONResponse:
    """
    Get the most recent data for a specific player.

    Parameters
    ----------
    player : str
        The player tag or alias (e.g., '#GL8LOPC80' or 'free')

    Returns
    -------
    Dict
        The most recent player data including:
        - Player information
        - Clan information (if in clan)
        - Resources
        - Buildings

    Raises
    ------
    HTTPException
        404: If player is not found
        400: If path validation fails
        500: If internal error occurs
    """
    data, status_code = await _get_player(player)
    return JSONResponse(content=data, status_code=status_code)

@app.get('/api/player/{player}/history')
async def get_player_history(player: str) -> JSONResponse:
    """
    Get the historical changes/differences for a specific player over time.

    Parameters
    ----------
    player : str
        The player tag or alias (e.g., '#GL8LOPC80' or 'free')

    Returns
    -------
    Dict
        A dictionary of timestamps mapping to differences between consecutive snapshots:
        - Keys are timestamps
        - Values are DeepDiff results comparing the current snapshot to the previous one

    Raises
    ------
    HTTPException
        404: If player is not found
        500: If path validation fails
    """

    data, status_code = await _get_player_history(player)
    return JSONResponse(content=data, status_code=status_code)
    
@app.get('/api/player/{player}/buildings')
async def get_player_buildings(player: str) -> JSONResponse:

    data, status_code = await _get_player_buildings(player)
    return JSONResponse(content=data, status_code=status_code)

@app.get("/player/{player}", include_in_schema=False)
async def player_page(player: str, request: Request) -> starlette.templating._TemplateResponse:
    player_data, status_code = await _get_player(player)
    if status_code != 200:
        return {"error": f"Error getting player data: {status_code}: {player_data}"}

    history_data, status_code = await _get_player_history(player)
    if status_code != 200:
        return {"error": f"Error getting player history: {status_code}: {history_data}"}
    
    # Initialize history graphs
    history_graphs = {metric: {'x': [], 'y': []} for metric in METRICS}

    # Process history data
    for timestamp, data in history_data.items():
        history_time = math.floor(float(timestamp))

        # Handle direct value changes
        if 'values_changed' in data:
            for metric in METRICS:
                if metric in data['values_changed']:
                    history_graphs[metric]['x'].append(history_time)
                    history_graphs[metric]['y'].append(data['values_changed'][metric]['new_value'])
        
        # Handle achievement-based metrics
        if 'changed' in data and 'player.achievements' in data['changed']:
            for achievement in data['changed']['player.achievements']:
                achievement_name = achievement['name']
                for metric, achievement_map in METRICS.items():
                    if achievement_map == achievement_name:
                        history_graphs[metric]['x'].append(history_time)
                        history_graphs[metric]['y'].append(achievement['new']['value'])

    buildings_data, status_code = await _get_player_buildings(player)
    if status_code != 200:
        return {"error": f"Error getting player buildings: {status_code}: {buildings_data}"}

    return templates.TemplateResponse(
        "player.html", 
        {
            "request": player_data,
            "player_data": player_data,
            "history_data": history_data,
            "history_graphs": history_graphs,
            "buildings_data": buildings_data,
            "GLOBAL_BUILDING_DATA": GLOBAL_BUILDING_DATA,
            "GLOBAL_STORAGE_DATA": GLOBAL_STORAGE_DATA
        }
    )

@app.get("/players", include_in_schema=False)
async def players_page(request: Request) -> starlette.templating._TemplateResponse:
    players = list(PLAYER_DATA.keys())
    for i, player in enumerate(players):
        if player[0] == '#':
            players[i] = player[1:]
    return templates.TemplateResponse("players.html", {"request": request, "players": players})

@app.get("/", include_in_schema=False)
async def root(request: Request) -> starlette.templating._TemplateResponse:
    return templates.TemplateResponse("index.html", {"request": request})

app.mount("/static", StaticFiles(directory="static"), name="static")
