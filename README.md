# clann.ing

A FastAPI-based service that tracks and retrieves historical player data for my Clash of Clans accounts. This API allows you to:

- Fetch current player data using tags or aliases
- View historical changes in player progression
- Track resource, building, and clan changes over time

## Overview

The API maintains a historical record of player snapshots, allowing users to see how accounts have evolved over time. Each snapshot captures the complete state of a player's account, including:

- Player information
- Clan membership
- Buildings and levels

A manual process is also used to collect other progress data, such as building levels and resource counts.

Data is compressed and stored efficiently in a filesystem-based data store, with endpoints providing both current state and historical differences between snapshots.

## Installation

### Prerequisites
- Python 3.10 or higher
- pip (Python package installer)

### Setup

1. Clone the repository

```bash
git clone https://github.com/lag/clanning.git
cd clanning
```

2. Create and activate a virtual environment (recommended) -- Instructions below are for Linux

```bash
python -m venv venv
source venv/bin/activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Set environment variables with your Clash of Clans API token (and other information if needed -- see .env.example)

5. Run update_players.py to fetch player data from the API repeatedly in the background.

```bash
python update_players.py
```

6. In another window, run the web server.

### Running the Web Server

Start the development server:

```bash
cd site
python server.py
```

- API documentation: `/docs`
- Alternative docs: `/redoc`

### Project Structure

```
clanning/
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables (see .env.example)
├── players.json                  # Player aliases and metadata
├── update_players.py             # Script to continuously fetch player data from the API
├── last_error.txt                # Timestamp of last error (for debugging)
├── last_update.txt               # Timestamp of last update (for debugging)
├── history/                      # Historical player data
│   └── {player}/                 # Player directory
│       └── {hash}.json           # Player data snapshot
├── manualhistory/                # Historical manual data
│   └── {player}/                 # Player directory
│       └── {hash}.json           # Player data snapshot
└── site/
    ├── server.py                 # Used to launch the FastAPI app
    ├── app.py                    # FastAPI app
    └── templates/                # Jinja2 templates
        └── index.html            # Simple landing page
```
