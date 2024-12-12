document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggleNoteBuilder");
  const modal = document.getElementById("noteBuilderModal");
  const initialOffset = toggleBtn.offsetTop;
  let isVisible = false;

  // Handle scroll behavior
  window.addEventListener("scroll", function () {
    if (window.pageYOffset > initialOffset) {
      toggleBtn.classList.add("fixed");
      modal.classList.add("fixed");
    } else {
      toggleBtn.classList.remove("fixed");
      modal.classList.remove("fixed");
    }
  });

  // Handle modal toggle
  toggleBtn.addEventListener("click", function () {
    isVisible = !isVisible;
    modal.style.display = isVisible ? "block" : "none";
    if (isVisible) {
      modal.classList.add("visible");
    } else {
      modal.classList.remove("visible");
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("wallDistributionChart");
  if (!ctx) return;

  const wallData =
    window.appData.buildingsData.walls_count[window.appData.requestedVillage];
  const total = Object.values(wallData).reduce((a, b) => a + b, 0);

  // Wall colors mapping
  const wallColors = {
    home: {
      1: "rgb(187, 182, 176)",
      2: "rgb(191, 190, 189)",
      3: "rgb(181, 179, 178)",
      4: "rgb(157, 155, 152)",
      5: "rgb(168, 158, 139)",
      6: "rgb(192, 179, 189)",
      7: "rgb(162, 157, 165)",
      8: "rgb(162, 161, 161)",
      9: "rgb(148, 148, 149)",
      10: "rgb(170, 169, 167)",
      11: "rgb(164, 152, 142)",
      12: "rgb(72, 66, 59)",
      13: "rgb(48, 56, 66)",
      14: "rgb(30, 34, 41)",
      15: "rgb(37, 28, 18)",
      16: "rgb(122, 120, 125)",
      17: "rgb(127, 100, 71)",
      18: "rgb(86, 83, 66)",
    },
    builder: {
      1: "rgb(30, 21, 12)",
      2: "rgb(48, 35, 24)",
      3: "rgb(41, 31, 21)",
      4: "rgb(34, 35, 37)",
      5: "rgb(33, 31, 33)",
      6: "rgb(44, 38, 37)",
      7: "rgb(43, 33, 31)",
      8: "rgb(34, 34, 43)",
      9: "rgb(72, 67, 72)",
      10: "rgb(68, 60, 61)",
    },
  };

  const currentVillage = window.appData.requestedVillage;
  const villageColors = wallColors[currentVillage];

  const datasets = Object.entries(wallData).map(([level, count]) => ({
    label: `Level ${level}`,
    data: [(count / total) * 100],
    backgroundColor: villageColors[level],
  }));

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: [""],
      datasets: datasets,
    },
    options: {
      animation: {
        duration: 0,
      },
      hover: {
        animationDuration: 0,
      },
      responsiveAnimationDuration: 0,
      indexAxis: "y",
      stacked: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const level = context.dataset.label.split(" ")[1];
              return `Level ${level}: ${context.parsed.x.toFixed(1)}% (${
                wallData[level]
              } walls)`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          display: false,
          grid: {
            display: false,
          },
        },
        y: {
          stacked: true,
          display: false,
          grid: {
            display: false,
          },
        },
      },
      maintainAspectRatio: false,
      responsive: true,
      layout: {
        padding: 0,
      },
    },
  });
});

// Constants and State Management
// =============================

const STORAGE_TYPES = {
  home: {
    GOLD: "Gold Storage",
    ELIXIR: "Elixir Storage",
    DARK_ELIXIR: "Dark Elixir Storage",
    TOWN_HALL: "Town Hall",
  },
  builder: {
    BUILDER_HALL: "Builder Hall",
  },
};

const buildingsByVillage = {
  home: [
    // Building Groups
    // Town & Defense
    "Town Hall",
    "Clan Castle",
    // Defenses
    "Cannon",
    "Archer Tower",
    "Wizard Tower",
    "Air Defense",
    "Mortar",
    "Hidden Tesla",
    "X-Bow",
    "Inferno Tower",
    "Air Sweeper",
    "Eagle Artillery",
    "Bomb Tower",
    "Scattershot",
    // Resource Buildings
    "Builder's Hut",
    "B.O.B's Hut",
    "Elixir Collector",
    "Elixir Storage",
    "Gold Mine",
    "Gold Storage",
    "Dark Elixir Drill",
    "Dark Elixir Storage",
    // Army Buildings
    "Army Camp",
    "Barracks",
    "Laboratory",
    "Spell Factory",
    "Dark Barracks",
    "Dark Spell Factory",
    "Workshop",
    "Pet House",
    "Blacksmith",
    "Hero Hall",
    // Traps
    "Bomb",
    "Spring Trap",
    "Giant Bomb",
    "Air Bomb",
    "Seeking Air Mine",
    "Skeleton Trap",
    "Tornado Trap",
  ],
  builder: [
    // Main Buildings
    "Builder Hall",
    "B.O.B Control",
    "O.T.T.O's Outpost",
    "Clock Tower",
    // Defenses
    "Double Cannon",
    "Hidden Tesla",
    "Cannon",
    "Archer Tower",
    "Firecrackers",
    "Crusher",
    "Guard Post",
    "Air Bombs",
    "Giant Cannon",
    "Multi Mortar",
    "Roaster",
    "Lava Launcher",
    "Mega Tesla",
    "X-Bow",
    // Resources
    "Elixir Collector",
    "Elixir Storage",
    "Gold Mine",
    "Gold Storage",
    "Gem Mine",
    // Army & Support
    "Builder Barracks",
    "Army Camp",
    "Star Laboratory",
    "Battle Machine",
    "Battle Copter",
    "Reinforcement Camp",
    // Traps
    "Spring Trap",
    "Push Trap",
    "Mine",
    "Mega Mine",
  ],
};

// Application State
const state = {
  note: {
    buildings: [],
    notes: [],
    resources: {
      home: {},
      builder: {},
      gems: 0,
    },
  },
  resources: {
    home: {
      gold: 0,
      elixir: 0,
      dark_elixir: 0,
    },
    builder: {
      gold: 0,
      elixir: 0,
    },
    gems: 0,
  },
};

// Initialize current_buildings with data from Jinja
const current_buildings = window.appData.buildingsData.buildings || [];

// Initialize storages with data from Jinja
const storages = window.appData.GLOBAL_STORAGE_DATA || {};

// Time Formatting Functions
// =======================

function formatTime(seconds) {
  if (seconds <= 0) return "Complete";

  const timeUnits = [
    { unit: "d", value: Math.floor(seconds / (24 * 3600)) },
    { unit: "h", value: Math.floor((seconds % (24 * 3600)) / 3600) },
    { unit: "m", value: Math.floor((seconds % 3600) / 60) },
    { unit: "s", value: seconds % 60 },
  ];

  return timeUnits
    .filter(({ value }) => value > 0)
    .map(({ value, unit }) => `${value}${unit}`)
    .join("");
}

function gemsToTime(gems) {
  const TIME_RANGES = [60, 3600, 86400, 604800]; // minute, hour, day, week
  const GEM_COSTS = [1, 20, 260, 1000];

  if (gems <= 0) return 0;

  gems += 1;

  if (gems <= GEM_COSTS[1]) {
    return calculateTimeInRange(
      gems,
      GEM_COSTS[0],
      GEM_COSTS[1],
      TIME_RANGES[0],
      TIME_RANGES[1]
    );
  } else if (gems <= GEM_COSTS[2]) {
    return calculateTimeInRange(
      gems,
      GEM_COSTS[1],
      GEM_COSTS[2],
      TIME_RANGES[1],
      TIME_RANGES[2]
    );
  } else {
    return calculateTimeInRange(
      gems,
      GEM_COSTS[2],
      GEM_COSTS[3],
      TIME_RANGES[2],
      TIME_RANGES[3]
    );
  }
}

function calculateTimeInRange(gems, minGems, maxGems, minTime, maxTime) {
  return (
    Math.ceil(
      (gems - minGems) * ((maxTime - minTime) / (maxGems - minGems)) + minTime
    ) - 1
  );
}

// Building Search
// =============

document
  .getElementById("buildingSearch")
  .addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const buildings = document
      .getElementById("buildingsGrid")
      .getElementsByClassName("building-card");

    Array.from(buildings).forEach((building) => {
      const buildingName = building
        .querySelector(".building-name")
        .textContent.toLowerCase();
      if (buildingName.includes(searchTerm)) {
        building.style.display = "flex";
      } else {
        building.style.display = "none";
      }
    });
  });

// Resource Management
// =================

function updateResource(type, village, value) {
  if (type === "gems") {
    state.resources.gems = parseInt(value) || 0;
    if (!state.note.resources) {
      state.note.resources = {};
    }
    if (state.resources.gems > 0) {
      state.note.resources.gems = state.resources.gems;
    } else {
      delete state.note.resources.gems;
    }
  } else {
    state.resources[village][type] = parseInt(value) || 0;
    computeStorages(village);
  }
  updateNote();
}

function computeStorages(village = "home") {
  let storageBuildings = {
    goldStorages: [],
    elixirStorages: [],
    darkElixirStorages: [],
    townHalls: [],
  };

  // Collect storage buildings
  current_buildings.forEach((building) => {
    if (building.village !== village) return;

    if (village === "home") {
      if (building.name === STORAGE_TYPES[village].GOLD) {
        storageBuildings.goldStorages.push({
          id: building.id,
          level: building.level,
        });
      } else if (building.name === STORAGE_TYPES[village].ELIXIR) {
        storageBuildings.elixirStorages.push({
          id: building.id,
          level: building.level,
        });
      } else if (building.name === STORAGE_TYPES[village].DARK_ELIXIR) {
        storageBuildings.darkElixirStorages.push({
          id: building.id,
          level: building.level,
        });
      } else if (building.name === STORAGE_TYPES[village].TOWN_HALL) {
        storageBuildings.townHalls.push({
          id: building.id,
          level: building.level,
        });
      }
    } else if (village === "builder") {
      if (building.name === STORAGE_TYPES[village].BUILDER_HALL) {
        storageBuildings.townHalls.push({
          id: building.id,
          level: building.level,
        });
      } else if (building.name === "Gold Storage") {
        storageBuildings.goldStorages.push({
          id: building.id,
          level: building.level,
        });
      } else if (building.name === "Elixir Storage") {
        storageBuildings.elixirStorages.push({
          id: building.id,
          level: building.level,
        });
      }
    }
  });

  // Apply pending upgrades
  if (state.note.buildings.length) {
    updatePendingStorageUpgrades(storageBuildings, village);
  }

  // Calculate and update capacities
  const capacities = calculateStorageCapacities(storageBuildings, village);
  updateNoteResources(capacities, village);
}

function updatePendingStorageUpgrades(storageBuildings, village) {
  state.note.buildings.forEach((upgrade) => {
    if (village === "home") {
      [
        {
          type: STORAGE_TYPES[village].GOLD,
          array: storageBuildings.goldStorages,
        },
        {
          type: STORAGE_TYPES[village].ELIXIR,
          array: storageBuildings.elixirStorages,
        },
        {
          type: STORAGE_TYPES[village].DARK_ELIXIR,
          array: storageBuildings.darkElixirStorages,
        },
        {
          type: STORAGE_TYPES[village].TOWN_HALL,
          array: storageBuildings.townHalls,
        },
      ].forEach(({ type, array }) => {
        const index = array.findIndex((s) => s.id === upgrade.id);
        if (index !== -1) {
          array[index].level = upgrade.level;
        }
      });
    } else if (
      village === "builder" &&
      upgrade.name === STORAGE_TYPES[village].BUILDER_HALL
    ) {
      const index = storageBuildings.townHalls.findIndex(
        (s) => s.id === upgrade.id
      );
      if (index !== -1) {
        storageBuildings.townHalls[index].level = upgrade.level;
      }
    }
  });
}

function calculateStorageCapacities(storageBuildings, village) {
  const capacities = {
    gold: 0,
    elixir: 0,
  };

  if (village === "home") {
    capacities.dark_elixir = 0;

    // Add storage capacities
    storageBuildings.goldStorages.forEach((storage) => {
      capacities.gold += storages[village].gold_storage[storage.level].g;
    });
    storageBuildings.elixirStorages.forEach((storage) => {
      capacities.elixir += storages[village].elixir_storage[storage.level].e;
    });
    storageBuildings.darkElixirStorages.forEach((storage) => {
      capacities.dark_elixir +=
        storages[village].dark_elixir_storage[storage.level].de;
    });

    // Add town hall capacities
    if (storageBuildings.townHalls.length) {
      const level = storageBuildings.townHalls[0].level;
      const townHallStorage = storages[village].town_hall[level];
      Object.assign(capacities, {
        gold: capacities.gold + townHallStorage.g,
        elixir: capacities.elixir + townHallStorage.e,
        dark_elixir: capacities.dark_elixir + townHallStorage.de,
      });
    }
  } else if (village === "builder") {
    // Add builder base storage capacities
    storageBuildings.goldStorages.forEach((storage) => {
      capacities.gold += storages[village].gold_storage[storage.level].g;
    });
    storageBuildings.elixirStorages.forEach((storage) => {
      capacities.elixir += storages[village].elixir_storage[storage.level].e;
    });

    // Add Builder Hall capacities
    if (storageBuildings.townHalls.length) {
      const level = storageBuildings.townHalls[0].level;
      const builderHallStorage = storages["builder"].builder_hall[level];
      capacities.gold += builderHallStorage.g;
      capacities.elixir += builderHallStorage.e;
    }
  }

  return capacities;
}

function updateNoteResources(capacities, village) {
  if (!state.note.resources) {
    state.note.resources = { gems: state.resources.gems };
  }

  const resourceData = {};
  let hasResources = false;

  // Add resources with capacities
  Object.entries(capacities).forEach(([resource, maxCapacity]) => {
    if (maxCapacity > 0) {
      const current = state.resources[village][resource];
      if (current > 0) {
        resourceData[resource] = {
          current: current,
          max: maxCapacity,
        };
        hasResources = true;
      }
    }
  });

  // Update state
  if (hasResources) {
    state.note.resources[village] = resourceData;
  } else {
    delete state.note.resources[village];
  }

  if (state.resources.gems > 0) {
    state.note.resources.gems = state.resources.gems;
  } else {
    delete state.note.resources.gems;
  }

  if (Object.keys(state.note.resources).length === 0) {
    delete state.note.resources;
  }
}

// Building Management
// ===================

function addNewBuilding() {
  const modal = document.getElementById("newBuildingModal");
  modal.style.display = "block";

  const buildingSelect = document.getElementById("buildingName");
  buildingSelect.innerHTML = "";

  buildingsByVillage[window.appData.requestedVillage].forEach((building) => {
    const option = document.createElement("option");
    option.value = building;
    option.textContent = building;
    buildingSelect.appendChild(option);
  });

  const form = document.getElementById("newBuildingForm");
  form.onsubmit = (e) => {
    e.preventDefault();

    const name = buildingSelect.value;
    const level = parseInt(document.getElementById("buildingLevel").value);

    const existingIds = [
      ...current_buildings
        .filter((b) => b.village === window.appData.requestedVillage)
        .map((b) => b.id),
      ...state.note.notes
        .filter((n) => n.id && n.village === window.appData.requestedVillage)
        .map((n) => n.id),
    ];
    const id = existingIds.length ? Math.max(...existingIds) + 1 : 1;

    // Create the note
    const noteText = {
      village: window.appData.requestedVillage,
      type: "building",
      name: name,
      id: id,
      level: level,
      new: true,
    };

    // Add to notes array
    if (!state.note.notes) {
      state.note.notes = [];
    }
    state.note.notes.push(noteText);

    // Add to UI and show the notes section
    const newBuildingsList = document.getElementById("newBuildingNotesList");
    const notesContainer = document.getElementById("newBuildingNotes");
    if (newBuildingsList) {
      notesContainer.style.display = "block"; // Show the container
      const buildingDiv = document.createElement("div");
      buildingDiv.className = "new-building-note";

      // Create the new building note with updated styling
      buildingDiv.innerHTML = `
                <img src="/static/images/${noteText.village}/buildings/${name
                  .toLowerCase()
                  .replace(/ /g, "_")
                  .replace(/'/g, "")
                  .replace(/\./g, "")}/1.png" 
                     alt="${name}" 
                     class="note-image">
                <div class="note-text">
                    <span class="building-title">${name}</span>
                    <span class="building-level">Level ${level}</span>
                    <span class="building-id">#${id}</span>
                </div>
                <button onclick="deleteNewBuildingNote('building', '${name}', ${id}, this)" 
                        class="delete-btn" 
                        title="Remove">❌</button>
            `;

      newBuildingsList.appendChild(buildingDiv);
    }

    updateNote();
    modal.style.display = "none";
    form.reset();
  };
}

function closeNewBuildingModal() {
  const modal = document.getElementById("newBuildingModal");
  modal.style.display = "none";
  document.getElementById("newBuildingForm").reset();
}

function deleteNewBuildingNote(type, name, id, buttonElement) {
  const noteIndex = state.note.notes.findIndex((note) => {
    if (typeof note === "string") {
      return note.includes(`id #${id}`);
    }
    return note.type === type && note.name === name && note.id === id;
  });

  if (noteIndex !== -1) {
    state.note.notes.splice(noteIndex, 1);
    buttonElement.closest(".new-building-note").remove();

    const notesList = document.getElementById("newBuildingNotesList");
    const notesContainer = document.getElementById("newBuildingNotes");
    if (!notesList.children.length) {
      notesContainer.style.display = "none";
    }

    updateNote();
  }
}

function displayItem(type, item) {
  let gameData = null;
  let currentData = JSON.parse(item.dataset.info);
  
  if (type === "build") {
    gameData = window.appData.gameData[currentData.village].buildings.find(
      building => building.name === currentData.name
    );
  }
  else if (type === "troop") {
    gameData = window.appData.gameData[currentData.village].troops.find(
      troop => troop.name === currentData.name
    );
  }

  const modal = document.getElementById("dataModal");
  const modalHeader = document.getElementById("dataModalHeader");
  const modalBody = document.getElementById("dataModalBody");

  if(gameData === null){
    modalBody.innerHTML = "<p>No data found. Feature is will a WIP.</p>";
    modalHeader.children[0].innerHTML = "Error!";
    modal.style.display = "block";
    return;
  }

  if(gameData === null){
    modalBody.innerHTML = "<p>No data found. Feature is will a WIP.</p>";
    modalHeader.children[0].innerHTML = "Error!";
    modal.style.display = "block";
    return;
  }

  // Clear previous content
  modalBody.innerHTML = "";

  let nextLevelData = null;
  let currentLevelData = null;

  // Find the indices for the stats we need
  const levelIndex = gameData.level_keys.indexOf("level");
  const hitpointsIndex = gameData.level_keys.indexOf("hitpoints");
  const dpsIndex = gameData.level_keys.indexOf("dps");
  const costIndex = gameData.level_keys.indexOf("cost");
  const buildTimeIndex = gameData.level_keys.indexOf("build_time");
  const townHallIndex = gameData.level_keys.indexOf("town_hall");
  const storagesIndex = gameData.level_keys.indexOf("storages");
  const generationIndex = gameData.level_keys.indexOf("generation");

  // Clear previous content
  modalBody.innerHTML = "";

  // Find current and next level data
  for (const levelData of gameData.levels) {
    if (levelData[levelIndex] === currentData.level + 1) {
      nextLevelData = {};
      gameData.level_keys.forEach((key, index) => {
        nextLevelData[key] = levelData[index];
      });
    }
    else if (levelData[levelIndex] === currentData.level) {
      currentLevelData = {};
      gameData.level_keys.forEach((key, index) => {
        currentLevelData[key] = levelData[index];
      });
    }
  }


  let targetString = 'Unknown';
  if (gameData.attacks_air && gameData.attacks_ground) {
    targetString = 'Ground & Air';
  }
  else if (gameData.attacks_air) {
    targetString = 'Air';
  }
  else if (gameData.attacks_ground) {
    targetString = 'Ground';
  }

  // Populate modal with data
  let dataContent = "";
  if(type === "build"){
    dataContent = "";
    dataContent += `<img height="100" src="/static/images/${currentData.village}/buildings/${currentData.name.toLowerCase().replace(/ /g, "_").replace("'", "")}/${nextLevelData.level}.png" alt="${currentData.name}" class="note-image">`;
    dataContent += `<p>Building Type: ${gameData.building_class}</p>`;
    dataContent += `<p>Level: ${currentData.level} -> ${nextLevelData.level}</p>`;
    dataContent += `<p>Hitpoints: ${currentLevelData.hitpoints} -> ${nextLevelData.hitpoints} [+${nextLevelData.hitpoints - currentLevelData.hitpoints}]</p>`;
    dataContent += `<p>Cost: ${nextLevelData.cost.toLocaleString()} ${gameData.build_resource}</p>`;
    dataContent += `<p>Build Time: ${formatTime(nextLevelData.build_time)}</p>`;
    dataContent += `<p>Town Hall Level: ${nextLevelData.town_hall}</p>`;
    if(nextLevelData.dps !== null) {
      dataContent += `<p>DPS: ${currentLevelData.dps} -> ${nextLevelData.dps} [+${nextLevelData.dps - currentLevelData.dps}]</p>`;
      dataContent += `<p>Attack Range: ${gameData.attack_range}</p>`;
      dataContent += `<p>Attack Speed: ${gameData.attack_speed}</p>`;
      dataContent += `<p>Has Alternate Attack: ${gameData.has_alternate_attack || false}</p>`;
      dataContent += `<p>Attacks: ${targetString}</p>`;
    }
    if (nextLevelData.storages) {
      const storage = nextLevelData.storages;
      dataContent += `<p>Stores: ${storage.gold || 0} Gold, ${storage.elixir || 0} Elixir, ${storage.dark_elixir || 0} Dark Elixir</p>`;
    }
    if (nextLevelData.generation) {
      const gen = nextLevelData.generation;
      dataContent += `<p>Production per hour: ${currentLevelData.generation.hundred_hours / 100} -> ${gen.hundred_hours / 100} [+${(gen.hundred_hours / 100) - (currentLevelData.generation.hundred_hours / 100)}]</p>`;
      dataContent += `<p>Capacity: ${currentLevelData.generation.max} -> ${gen.max} [+${(gen.max) - (currentLevelData.generation.max)}]</p>`;
    }
    if(nextLevelData.housing_space) {
      dataContent += `<p>Troop Capacity: ${nextLevelData.housing_space}</p>`;
    }
    if(nextLevelData.housing_space_alt) {
      dataContent += `<p>Spell Capacity: ${nextLevelData.housing_space_alt}</p>`;
    }
    if(nextLevelData.housing_space_siege) {
      dataContent += `<p>Siege Capacity: ${nextLevelData.housing_space_siege}</p>`;
    }
  }
  else if (type === "troop") {
    dataContent = "";
    dataContent += `<img height="100" src="/static/images/${currentData.village}/troops/${currentData.name.toLowerCase().replace(/ /g, "_").replace("'", "")}/avatar.png" alt="${currentData.name}" class="note-image">`;
    dataContent += `<p>Level: ${currentData.level} -> ${nextLevelData.level}</p>`;
    dataContent += `<p>Housing Space: ${gameData.housing_space}</p>`;
    dataContent += `<p>Training Time: ${formatTime(gameData.training_time)}</p>`;
    dataContent += `<p>Cost: ${nextLevelData?.cost?.toLocaleString() ?? 'null'} ${gameData.upgrade_resource}</p>`;
    dataContent += `<p>Upgrade Time: ${formatTime(nextLevelData.upgrade_time)}</p>`;
    dataContent += `<p>Laboratory Level: ${nextLevelData.laboratory_level}</p>`;
    dataContent += `<p>DPS: ${currentLevelData.dps} -> ${nextLevelData.dps} [+${nextLevelData.dps - currentLevelData.dps}]</p>`;
    dataContent += `<p>Hitpoints: ${currentLevelData.hitpoints} -> ${nextLevelData.hitpoints} [+${nextLevelData.hitpoints - currentLevelData.hitpoints}]</p>`;
    dataContent += `<p>Attack Range: ${gameData.attack_range}</p>`;
    dataContent += `<p>Attack Speed: ${gameData.attack_speed}</p>`;
  }
  modalHeader.children[0].innerHTML = `${gameData.name}`;
  modalBody.innerHTML = dataContent;

  // Show the modal
  modal.style.display = "block";
}

// Function to close the data modal
function closeDataModal() {
  const modal = document.getElementById("dataModal");
  modal.style.display = "none";
}

// Close modal when clicking outside of it

function selectItem(type, item) {

  const noteBuilder = document.getElementById("noteBuilderModal");
  if (noteBuilder.style.display !== "block"){
    displayItem(type, item);
    return;
  };

  const info = JSON.parse(item.dataset.info);
  if (type === "build") {
    const newBuilding = {
      village: info.village,
      id: info.id,
      name: info.name,
      level: info.level + 1,
    };

    if (info.new) {
      newBuilding.level -= 1;
    }

    const existingIndex = state.note.buildings.findIndex(
      (b) => b.id === newBuilding.id
    );

    if (existingIndex !== -1) {
      state.note.buildings.splice(existingIndex, 1);
    } else {
      state.note.buildings.push(newBuilding);
    }

    updateNote();
  } else if (type === "troop" || type === "spell") {
    const noteText = {
      village: info.village,
      type: type,
      name: info.name,
      level: info.level + 1,
    };

    if (!state.note.notes) {
      state.note.notes = [];
    }

    const existingIndex = state.note.notes.findIndex(
      (note) =>
        note.type === type &&
        note.village === info.village &&
        note.name === info.name &&
        note.level === info.level + 1
    );

    if (existingIndex !== -1) {
      state.note.notes.splice(existingIndex, 1);
    } else {
      state.note.notes.push(noteText);
    }

    updateNote();
  }
}

// Note Management
// ===============

function updateNote() {
  let cleanNote = JSON.parse(JSON.stringify(state.note));

  function removeEmpty(obj) {
    if (Array.isArray(obj)) {
      obj = obj.filter((item) => {
        if (typeof item === "object" && item !== null) {
          return Object.keys(removeEmpty(item)).length > 0;
        }
        return true;
      });
      return obj.length ? obj : null;
    } else if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          obj[key] = removeEmpty(obj[key]);
          if (obj[key] === null) {
            delete obj[key];
          }
        }
      });
      return Object.keys(obj).length ? obj : null;
    }
    return obj;
  }

  cleanNote = removeEmpty(cleanNote);

  const noteParent = cleanNote
    ? {
        [Date.now()]: cleanNote,
      }
    : {};

  // Update the note builder textarea
  const noteBuilder = document.getElementById("note-builder");
  if (noteBuilder) {
    noteBuilder.value = JSON.stringify(noteParent, null, 4);
  }
}

// UI Event Handlers
// =================

document.addEventListener("contextmenu", (event) => {
  const noteBuilder = document.getElementById("noteBuilderModal");
  if (noteBuilder.style.display !== "block") return;

  const notableElement = event.target.closest("[data-info]");

  if (notableElement) {
    event.preventDefault();

    const elementData = JSON.parse(notableElement.dataset.info);
    const elementType = notableElement.dataset.type;
    let noteText = null;

    if (elementType === "build") {
      noteText = {
        village: elementData.village,
        type: "building",
        name: elementData.name,
        id: elementData.id,
        level: elementData.level + 1,
      };
    } else if (elementType === "troop" || elementType === "spell") {
      noteText = {
        village: elementData.village,
        type: elementType,
        name: elementData.name,
        level: elementData.level + 1,
      };
    }

    if (noteText) {
      const existingIndex = state.note.notes.findIndex(
        (note) =>
          note.type === noteText.type &&
          note.village === noteText.village &&
          note.name === noteText.name &&
          note.level === noteText.level &&
          (!noteText.id || note.id === noteText.id)
      );

      if (existingIndex !== -1) {
        state.note.notes.splice(existingIndex, 1);
      } else {
        state.note.notes.push(noteText);
      }

      updateNote();
    }
  }
});

// Gem Calculation and Time Update
// ===============================

function showGemInput(btn) {
  const container = btn.parentElement.nextElementSibling;
  container.style.display = "block";
  btn.style.display = "none";
}

function hideGemInput(btn) {
  const container = btn.parentElement;
  container.style.display = "none";
  container.previousElementSibling.querySelector(
    ".gem-input-btn"
  ).style.display = "inline";
}

function calculateTimeFromGems(btn) {
  const container = btn.parentElement;
  const gemInput = container.querySelector(".gem-input");
  const gems = parseInt(gemInput.value);

  if (isNaN(gems) || gems < 0) {
    alert("Please enter a valid number of gems");
    return;
  }

  const seconds = gemsToTime(gems);
  const timeStr = formatTime(seconds);

  // Calculate finish time
  const finishTime = Math.floor(Date.now() / 1000) + seconds;

  // Get upgrade info from the parent element
  const parentP = container.previousElementSibling;
  const idSpan = parentP.querySelector(".upgrade-id");

  // Initialize notes array if it doesn't exist
  if (!state.note.notes) {
    state.note.notes = [];
  }

  // Remove any existing time update note for this building ID
  const buildingId = parseInt(idSpan.dataset.id);
  state.note.notes = state.note.notes.filter(
    (note) =>
      !(note.id === buildingId && note.type === "building" && note.endTime)
  );

  // Add the new note
  state.note.notes.push({
    village: idSpan.dataset.village,
    type: "building",
    id: buildingId,
    name: idSpan.dataset.name,
    level: parseInt(idSpan.dataset.level), // Get level from dataset and increment
    endTime: finishTime,
  });

  // Update the UI
  updateNote();

  const timeSpan = parentP.querySelector(".time-remaining");
  if (timeSpan) {
    timeSpan.textContent = ` (${timeStr})`;
    hideGemInput(btn);
  }
}

// Update Upgrade Times
// ====================

function updateUpgradeTimes() {
  const timeElements = document.querySelectorAll(".upgrade-time");
  const now = Math.floor(Date.now() / 1000);

  timeElements.forEach((el) => {
    const endTime = parseInt(el.dataset.endtime);
    if (endTime) {
      const remaining = endTime - now;
      // Don't remove the span, just update the text
      el.textContent = ` (${formatTime(Math.abs(remaining))})`;
    }
  });
}

// Close New Building Modal on Outside Click
// ========================================

let currentItemName = "";
let currentItemLevel = 0;
let currentItemType = "";
let currentItemId = null;

// Open Gem Modal
// =============

function openGemModal(event, itemName, itemLevel, itemType, itemId = null) {
  event.stopPropagation();
  currentItemName = itemName;
  currentItemLevel = itemLevel;
  currentItemType = itemType;
  currentItemId = itemId;
  currentItemVillage = window.appData.requestedVillage;
  const modal = document.getElementById("gemModal");
  modal.style.display = "block";
}

// Submit Gems
// ===========

function submitGems() {
  const gems = parseInt(document.getElementById("gemsInput").value);
  if (isNaN(gems) || gems < 0) {
    alert("Please enter a valid number of gems");
    return;
  }

  const seconds = gemsToTime(gems);
  const finishTime = Math.floor(Date.now() / 1000) + seconds;

  if (!state.note.notes) {
    state.note.notes = [];
  }

  state.note.notes = state.note.notes.filter((note) => {
    if (currentItemId !== null) {
      return note.id !== currentItemId;
    } else {
      return !(
        note.type === currentItemType &&
        note.name === currentItemName &&
        note.village === currentItemVillage
      );
    }
  });

  const newNote = {
    village: currentItemVillage,
    type: currentItemType,
    name: currentItemName,
    level: currentItemLevel + 1,
    endTime: finishTime,
  };

  if (currentItemId !== null) {
    newNote.id = currentItemId;
  }

  state.note.notes.push(newNote);

  updateNote();
  closeGemModal();
}

// Update Time Preview
// ===================

function updateTimePreview(gems) {
  const preview = document.getElementById("timePreview");
  if (!gems || isNaN(gems) || gems < 0) {
    preview.textContent = "";
    return;
  }

  const seconds = gemsToTime(parseInt(gems));
  const timeString = formatTime(seconds);

  preview.textContent = `Time to complete: ${timeString}`;
}

// Close Gem Modal
// ==============

function closeGemModal() {
  const modal = document.getElementById("gemModal");
  modal.style.display = "none";
  document.getElementById("gemForm").reset();
  document.getElementById("timePreview").textContent = "";
}

// Close Gem Modal on Outside Click
// ==============================
window.onclick = function (event) {
  // Handle data modal
  const dataModal = document.getElementById("dataModal");
  if (event.target == dataModal) {
    closeDataModal();
  }

  // Handle new building modal
  const newBuildingModal = document.getElementById("newBuildingModal");
  if (event.target == newBuildingModal) {
    closeNewBuildingModal();
  }

  // Handle gem modal
  const gemModal = document.getElementById("gemModal");
  if (event.target == gemModal) {
    closeGemModal();
  }
};

function sortBuildings(sortBy) {
  if (sortBy === "upgradeTime") {
    // Get all building cards and their data
    const buildings = document.querySelectorAll(".building-card");
    const buildingsData = Array.from(buildings).map(b => JSON.parse(b.dataset.info));
    
    let currentTownHall;
    // Get current Town Hall level
    if(window.appData.requestedVillage === "builder") {
      currentTownHall = buildingsData.find(b => b.name === 'Builder Hall').level;
    }
    else {
      currentTownHall = buildingsData.find(b => b.name === 'Town Hall').level;
    }
    
    // Calculate upgrade times for each building
    const upgradeTimes = [];
    const gameData = window.appData.gameData[window.appData.requestedVillage].buildings;

    for (const building of gameData) {
      const matchingBuildings = buildingsData.filter(b => b.name === building.name);
      
      if (!matchingBuildings.length) continue;

      const levelIndex = building.level_keys.indexOf("level");
      const buildTimeIndex = building.level_keys.indexOf("build_time");
      const townHallIndex = building.level_keys.indexOf("town_hall");

      for (const levelData of building.levels) {
        const buildingsToUpgrade = matchingBuildings.filter(b => 
          b.level + 1 === levelData[levelIndex]
        );
        
        buildingsToUpgrade.forEach(building => {
          upgradeTimes.push({
            id: building.id,
            level: levelData[levelIndex],
            time: levelData[townHallIndex] <= currentTownHall ? 
              levelData[buildTimeIndex] : null
          });
        });
      }
    }

    // Sort upgrade times (null times at end)
    const sortedUpgrades = upgradeTimes.sort((a, b) => {
      if (a.time === null) return 1;
      if (b.time === null) return -1;
      return a.time - b.time;
    });

    // Reorder DOM elements
    const buildingsGrid = document.getElementById("buildingsGrid");
    const buildingCards = Array.from(buildingsGrid.children);
    
    buildingCards.sort((a, b) => {
      const aInfo = JSON.parse(a.dataset.info);
      const bInfo = JSON.parse(b.dataset.info);
      
      const aIndex = sortedUpgrades.findIndex(item => item.id === aInfo.id);
      const bIndex = sortedUpgrades.findIndex(item => item.id === bInfo.id);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });

    // Update DOM
    buildingCards.forEach(card => buildingsGrid.removeChild(card));
    buildingCards.forEach(card => buildingsGrid.appendChild(card));
  }
  else if (sortBy === "dpsEfficiency") {
    // Get all building cards and their data
    const buildings = document.querySelectorAll(".building-card");
    const buildingsData = Array.from(buildings).map(b => JSON.parse(b.dataset.info));
    
    // Get current Town Hall level
    if(window.appData.requestedVillage === "builder") {
      currentTownHall = buildingsData.find(b => b.name === 'Builder Hall').level;
    }
    else {
      currentTownHall = buildingsData.find(b => b.name === 'Town Hall').level;
    }
    
    // Calculate DPS efficiency for each building
    const dpsEfficiency = [];
    const gameData = window.appData.gameData[window.appData.requestedVillage].buildings;

    for (const building of gameData) {
      const matchingBuildings = buildingsData.filter(b => b.name === building.name);
      
      if (!matchingBuildings.length) continue;

      const levelIndex = building.level_keys.indexOf("level");
      const dpsIndex = building.level_keys.indexOf("dps");
      const buildTimeIndex = building.level_keys.indexOf("build_time");
      const townHallIndex = building.level_keys.indexOf("town_hall");

      for (const levelData of building.levels) {
        const buildingsToUpgrade = matchingBuildings.filter(b => 
          b.level + 1 === levelData[levelIndex]
        );
        
        buildingsToUpgrade.forEach(building => {
          const hasDPS = levelData[dpsIndex] !== null;
          const hasBuildTime = levelData[townHallIndex] <= currentTownHall;
          
          dpsEfficiency.push({
            id: building.id,
            level: levelData[levelIndex],
            efficiency: hasDPS && hasBuildTime ? 
              (levelData[dpsIndex] / levelData[buildTimeIndex]) : 
              (hasDPS ? -1 : -2) // -1 for has DPS but no build time, -2 for no DPS
          });
        });
      }
    }

    // Sort by DPS efficiency (higher values first, special values at end)
    const sortedBuildings = dpsEfficiency.sort((a, b) => {
      if (a.efficiency === -2 && b.efficiency === -2) return 0;
      if (a.efficiency === -2) return 1;
      if (b.efficiency === -2) return -1;
      if (a.efficiency === -1 && b.efficiency === -1) return 0;
      if (a.efficiency === -1) return 1;
      if (b.efficiency === -1) return -1;
      return b.efficiency - a.efficiency; // Higher efficiency first
    });

    // Reorder DOM elements
    const buildingsGrid = document.getElementById("buildingsGrid");
    const buildingCards = Array.from(buildingsGrid.children);
    
    buildingCards.sort((a, b) => {
      const aInfo = JSON.parse(a.dataset.info);
      const bInfo = JSON.parse(b.dataset.info);
      
      const aIndex = sortedBuildings.findIndex(item => item.id === aInfo.id);
      const bIndex = sortedBuildings.findIndex(item => item.id === bInfo.id);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });

    // Update DOM
    buildingCards.forEach(card => buildingsGrid.removeChild(card));
    buildingCards.forEach(card => buildingsGrid.appendChild(card));
  }
}

// Troop and Spell Cards Drag Prevention and Context Menu
// =====================

document.querySelectorAll(".troop-card").forEach((card) => {
  card
    .querySelector("img")
    .addEventListener("dragstart", (e) => e.preventDefault());

  card.addEventListener("contextmenu", function (e) {

    const noteBuilder = document.getElementById("noteBuilderModal");
    if (noteBuilder.style.display !== "block") return;

    e.preventDefault();
    selectItem("troop", this);
  });
});
document.querySelectorAll(".spell-card").forEach((card) => {
  card
    .querySelector("img")
    .addEventListener("dragstart", (e) => e.preventDefault());
  card.addEventListener("contextmenu", function (e) {
    const noteBuilder = document.getElementById("noteBuilderModal");
    if (noteBuilder.style.display !== "block") return;
    e.preventDefault();
    selectItem("spell", this);
  });
});

// Collapsible cards
// =================

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".card.collapsible").forEach((card) => {
    card.classList.add("collapsible");
    const toggle = document.createElement("button");
    toggle.className = "collapse-toggle";
    toggle.innerHTML = "▼";
    toggle.onclick = (e) => {
      e.stopPropagation();
      const isCollapsed = card.classList.toggle("collapsed");

      if (!card.dataset.fullHeight) {
        card.dataset.fullHeight = card.scrollHeight + "px";
      }

      if (isCollapsed) {
        card.style.maxHeight = "60px";
      } else {
        card.style.maxHeight = card.dataset.fullHeight;
      }
    };
    card.insertBefore(toggle, card.firstChild);
  });
});

// Initialize
// ==========

function init() {
  updateUpgradeTimes();
  setInterval(updateUpgradeTimes, 1000);
}

// Call initialization
init();
