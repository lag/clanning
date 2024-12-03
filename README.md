# clann.ing

A FastAPI-based service that tracks and retrieves historical player data for my Clash of Clans accounts. This API allows you to:

- Fetch current player data using tags or aliases
- View historical changes in player progression
- Track resource, building, and clan changes over time

You can view my version of the site at [clann.ing](https://clann.ing). This has my accounts being tracked.

## This project is currently in very early development.

File formats may change at any time and support for updating old files is not guaranteed outside of historical data from Clash of ClansAPI calls.
Also, very little error handling and vulnerability testing has been done. Use at your own risk.

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

6. Open another window and download images needed for the site using the [Clash of Clans Wiki](https://clashofclans.fandom.com/wiki/Clash_of_Clans_Wiki). This may take a while.

```bash
python download_images.py
```

7. In that other window, run the web server.

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
│   └── {player tag}/             # Player directory
│       └── {hash}.json           # Player data snapshot
├── manualhistory/                # Historical manual data
│   └── {player tag}.json         # Manual data input file
└── site/
    ├── server.py                 # Used to launch the FastAPI app
    ├── app.py                    # FastAPI app
    ├── templates/                # Jinja2 templates
    │   └── components/           # Component templates
    │       └── chart.html        # Chart component template
    │   ├── base.html             # Base template for all pages
    │   ├── index.html            # Simple landing page
    │   ├── player.html           # Player page
    │   └── players.html          # Player list page
    └── static/                   # Static files
    │   ├── data/...              # JSON data files for site (buildings, storages, etc.)
    │   └── images/...            # Images (buildings, heroes, troops, etc.)
    └── utils/                    # Utilities for site
        └── fastdeepdiff.py       # Fast deep difference functions
```
