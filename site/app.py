# Standard library
import os
from pathlib import Path

# Third-party
import orjson
import starlette
from zstd import decompress
from deepdiff import DeepDiff
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title="clann.ing API",
    description="API for tracking and retrieving player history data",
    version="0.0.1"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
templates = Jinja2Templates(directory="templates")

with open('../players.json', 'rb') as f:
    PLAYER_DATA = orjson.loads(f.read())
PLAYER_ALIASES = {}
PLAYER_ALIASES = {
    alias: player
    for player in PLAYER_DATA
    for alias in PLAYER_DATA[player]['aliases']
}

class InvalidPathError(Exception):pass

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

@app.get('/api/player/{player}')
async def player(player: str) -> JSONResponse:
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
    try:
        if player[0] != '#' and player in PLAYER_ALIASES:
            player = PLAYER_ALIASES[player]
        if player not in PLAYER_ALIASES.values():
                return JSONResponse(
                    content={"error": "Player not found", "player": player},
                    status_code=404
                )
        
        player_path = get_safe_path(player, 'history')
            
        most_recent_data = None
        files = os.listdir(player_path)

        if not files:
            return JSONResponse(
                content={"error": "No data found for player", "player": player},
                status_code=404
            )

        for file in files:
            with open(player_path / file, 'rb') as f:
                data = orjson.loads(decompress(f.read()))
                if most_recent_data is None or data['time'] > most_recent_data['time']:
                    most_recent_data = data

        return JSONResponse(content=most_recent_data)

    except InvalidPathError as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=400
        )
    except Exception as e:
        return JSONResponse(
            content={"error": "Internal server error", "details": str(e)},
            status_code=500
        )

@app.get('/api/player/{player}/history')
async def player_history(player: str) -> JSONResponse:
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

    try:
        if player[0] != '#' and player in PLAYER_ALIASES:
            player = PLAYER_ALIASES[player]
        if player not in PLAYER_ALIASES.values():
            return JSONResponse(
                content={"error": "Player not found", "player": player},
                status_code=404
            )

        player_path = get_safe_path(player)
        files = os.listdir(player_path)

        if not files:
            return JSONResponse(
                content={"error": "No history found for player", "player": player},
                status_code=404
            )

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
            return JSONResponse(
                content={"error": "Failed to load player history", "player": player},
                status_code=500
            )

        last_timestamp = None
        diffs = {}
        for timestamp in sorted(history.keys()):
            if last_timestamp is not None:
                try:
                    diff = DeepDiff(
                        history[last_timestamp],
                        history[timestamp],
                        ignore_order=True,
                        report_repetition=False
                    )
                    
                    # Convert to dict and handle special types
                    diff_dict = diff.to_dict()

                    if 'dictionary_item_removed' in diff: # Convert removed items to list -- weirdly breaks stuff
                        diff_dict['dictionary_item_removed'] = [str(item) for item in diff['dictionary_item_removed']]
                    
                    # Clean the diff dictionary to ensure JSON serialization
                    def clean_diff_value(v):
                        if hasattr(v, 'to_dict'):
                            return v.to_dict()
                        if isinstance(v, (set, frozenset)):
                            return list(v)
                        return v

                    # Clean up any non-serializable objects
                    cleaned_diff = {}
                    for k, v in diff_dict.items():
                        if isinstance(v, dict):
                            cleaned_diff[k] = {
                                sk: clean_diff_value(sv)
                                for sk, sv in v.items()
                            }
                        else:
                            cleaned_diff[k] = clean_diff_value(v)
                    
                    diffs[str(timestamp)] = cleaned_diff
                    
                except Exception as e:
                    print(f"Error computing diff at {timestamp}: {str(e)}")
                    diffs[str(timestamp)] = {"error": f"Failed to compute diff: {str(e)}"}
            last_timestamp = timestamp

        return JSONResponse(content=diffs)

    except InvalidPathError as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=400
        )
    except Exception as e:
        return JSONResponse(
            content={"error": "Internal server error", "details": str(e)},
            status_code=500
        )

@app.get("/", include_in_schema=False)
async def root(request: Request) -> starlette.templating._TemplateResponse:
    return templates.TemplateResponse("index.html", {"request": request})
