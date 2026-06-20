const STORAGE_KEY = "fifa-world-cup-2026-static-bracket-state-v1";
const DUPLICATE_KEY = "fifa-world-cup-2026-static-allow-duplicates-v1";

const groupColors = [
  "#00f5a0",
  "#ff1476",
  "#ffb000",
  "#0094ff",
  "#e144ff",
  "#c9ff00",
  "#ff1476",
  "#00d6d6",
  "#e144ff",
  "#00d084",
  "#ffb000",
  "#00b7ff"
];

const flagUrl = (code) => `https://flagcdn.com/w80/${code}.png`;

const groupData = {
  A: [
    ["Mexico", "MEX", "mx"],
    ["South Africa", "RSA", "za"],
    ["South Korea", "KOR", "kr"],
    ["Czech Republic", "CZE", "cz"]
  ],
  B: [
    ["Canada", "CAN", "ca"],
    ["Bosnia and Herzegovina", "BIH", "ba"],
    ["Qatar", "QAT", "qa"],
    ["Switzerland", "SUI", "ch"]
  ],
  C: [
    ["Brazil", "BRA", "br"],
    ["Morocco", "MAR", "ma"],
    ["Haiti", "HAI", "ht"],
    ["Scotland", "SCO", "gb-sct"]
  ],
  D: [
    ["United States", "USA", "us"],
    ["Paraguay", "PAR", "py"],
    ["Australia", "AUS", "au"],
    ["Turkey", "TUR", "tr"]
  ],
  E: [
    ["Germany", "GER", "de"],
    ["Mali", "MLI", "ml"],
    ["Ireland", "IRL", "ie"],
    ["Ecuador", "ECU", "ec"]
  ],
  F: [
    ["Netherlands", "NED", "nl"],
    ["Japan", "JPN", "jp"],
    ["Sweden", "SWE", "se"],
    ["Tunisia", "TUN", "tn"]
  ],
  G: [
    ["Belgium", "BEL", "be"],
    ["Egypt", "EGY", "eg"],
    ["Iran", "IRN", "ir"],
    ["New Zealand", "NZL", "nz"]
  ],
  H: [
    ["Spain", "ESP", "es"],
    ["Cape Verde", "CPV", "cv"],
    ["Saudi Arabia", "KSA", "sa"],
    ["Uruguay", "URU", "uy"]
  ],
  I: [
    ["France", "FRA", "fr"],
    ["Senegal", "SEN", "sn"],
    ["Norway", "NOR", "no"],
    ["Puerto Rico", "PUR", "pr"]
  ],
  J: [
    ["Argentina", "ARG", "ar"],
    ["Algeria", "ALG", "dz"],
    ["Austria", "AUT", "at"],
    ["Jordan", "JOR", "jo"]
  ],
  K: [
    ["Portugal", "POR", "pt"],
    ["DR Congo", "COD", "cd"],
    ["Uzbekistan", "UZB", "uz"],
    ["Colombia", "COL", "co"]
  ],
  L: [
    ["England", "ENG", "gb-eng"],
    ["Croatia", "CRO", "hr"],
    ["Ghana", "GHA", "gh"],
    ["Panama", "PAN", "pa"]
  ]
};

const groups = Object.entries(groupData).map(([id, teamRows]) => ({
  id,
  teams: teamRows.map(([name, code, flagCode]) => ({
    id: code.toLowerCase(),
    name,
    code,
    group: id,
    flagCode,
    flagUrl: flagUrl(flagCode)
  }))
}));

const teams = groups.flatMap((group) => group.teams);
const teamsById = Object.fromEntries(teams.map((team) => [team.id, team]));

const leftLabels = [
  "1E v 3 ABCDF",
  "1I v 3 CDFGH",
  "2A v 2B",
  "1F v 2C",
  "2K v 2L",
  "1H v 2J",
  "1D v 3 BEFIJ",
  "1G v 3 AEHIJ"
];

const rightLabels = [
  "1C v 2F",
  "2E v 2I",
  "1A v 3 CEFHI",
  "1L v 3 EHIJK",
  "1J v 2H",
  "2D v 2G",
  "1B v 3 EFGIJ",
  "1K v 3 DEIJL"
];

const sideRounds = ["r32", "r16", "qf", "sf"];

function makeRound(side, round, count, labels = []) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${side}-${round}-${index + 1}`,
    side,
    round,
    label: labels[index] || ""
  }));
}

const leftSlots = [
  ...makeRound("left", "r32", 8, leftLabels),
  ...makeRound("left", "r16", 4),
  ...makeRound("left", "qf", 2),
  ...makeRound("left", "sf", 1)
];

const rightSlots = [
  ...makeRound("right", "r32", 8, rightLabels),
  ...makeRound("right", "r16", 4),
  ...makeRound("right", "qf", 2),
  ...makeRound("right", "sf", 1)
];

const centerSlots = [
  { id: "final-left", side: "center", round: "final", label: "FINALIST" },
  { id: "champion", side: "center", round: "final", label: "WINNER" },
  { id: "final-right", side: "center", round: "final", label: "FINALIST" },
  { id: "third-left", side: "center", round: "third", label: "THIRD PLACE" },
  { id: "third-right", side: "center", round: "third", label: "THIRD PLACE" }
];

const bracketSlots = [...leftSlots, ...rightSlots, ...centerSlots];
const emptyState = Object.fromEntries(
  bracketSlots.flatMap((slot) => [
    [`${slot.id}-1`, null],
    [`${slot.id}-2`, null]
  ])
);

let bracketState = { ...emptyState };
let allowDuplicate = false;

function normalizeState(value) {
  const next = { ...emptyState };
  if (!value || typeof value !== "object") return next;

  Object.keys(next).forEach((slotId) => {
    if (typeof value[slotId] === "string" && teamsById[value[slotId]]) {
      next[slotId] = value[slotId];
    }
  });

  return next;
}

function getUsedTeamIds() {
  return new Set(Object.values(bracketState).filter(Boolean));
}

function getNodeTop(round, index) {
  const config = {
    r32: { offset: 6.25, step: 12.5 },
    r16: { offset: 12.5, step: 25 },
    qf: { offset: 25, step: 50 },
    sf: { offset: 50, step: 100 }
  }[round];

  return `${config.offset + index * config.step}%`;
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bracketState));
  localStorage.setItem(DUPLICATE_KEY, String(allowDuplicate));
}

function readSavedState() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  const savedDuplicate = localStorage.getItem(DUPLICATE_KEY);

  if (savedState) {
    try {
      bracketState = normalizeState(JSON.parse(savedState));
    } catch {
      bracketState = { ...emptyState };
    }
  }

  allowDuplicate = savedDuplicate === "true";
}

function setTeamInSlot(targetSlotId, payload) {
  const next = { ...bracketState };

  if (!allowDuplicate) {
    Object.entries(next).forEach(([slotId, teamId]) => {
      if (teamId === payload.teamId && slotId !== targetSlotId) {
        next[slotId] = null;
      }
    });
  }

  if (payload.sourceSlotId && payload.sourceSlotId !== targetSlotId) {
    next[payload.sourceSlotId] = null;
  }

  next[targetSlotId] = payload.teamId;
  bracketState = next;
  saveToStorage();
  render();
}

function removeTeam(slotId) {
  bracketState = { ...bracketState, [slotId]: null };
  saveToStorage();
  render();
}

function makeFlagImage(team, className) {
  const img = document.createElement("img");
  img.className = className;
  img.src = team.flagUrl;
  img.alt = `${team.name} flag`;
  img.title = team.name;
  img.crossOrigin = "anonymous";
  return img;
}

function makeBracketSlot(slotId, options = {}) {
  const { label = "", cellCount = 2, compact = false, featured = false } = options;
  const shell = document.createElement("div");
  shell.className = "slot-shell";

  if (label) {
    const labelEl = document.createElement("div");
    labelEl.className = "slot-label";
    labelEl.textContent = label;
    shell.append(labelEl);
  }

  const grid = document.createElement("div");
  grid.className = `slot-grid${cellCount === 1 ? " single" : ""}`;
  shell.append(grid);

  for (let index = 1; index <= cellCount; index += 1) {
    const cellId = `${slotId}-${index}`;
    const team = teamsById[bracketState[cellId]];
    const cell = document.createElement("div");
    cell.className = `slot-cell${compact ? " compact" : ""}${featured ? " featured" : ""}${team ? " filled" : ""}`;
    cell.dataset.cellId = cellId;

    cell.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      cell.classList.add("drag-over");
    });

    cell.addEventListener("dragleave", () => {
      cell.classList.remove("drag-over");
    });

    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      cell.classList.remove("drag-over");
      const raw = event.dataTransfer.getData("application/json");
      if (!raw) return;
      setTeamInSlot(cellId, JSON.parse(raw));
    });

    if (team) {
      cell.draggable = true;
      cell.addEventListener("dragstart", (event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
          "application/json",
          JSON.stringify({ teamId: team.id, sourceSlotId: cellId })
        );
      });

      cell.append(makeFlagImage(team, "slot-flag"));

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-flag";
      removeButton.textContent = "X";
      removeButton.setAttribute("aria-label", `Remove ${team.name}`);
      removeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        removeTeam(cellId);
      });
      cell.append(removeButton);
    }

    grid.append(cell);
  }

  return shell;
}

function makeMatchBox(slot, cellCount) {
  return makeBracketSlot(slot.id, {
    label: slot.label,
    cellCount,
    compact: false,
    featured: false
  });
}

function renderGroups() {
  const leftGroups = document.getElementById("left-groups");
  const rightGroups = document.getElementById("right-groups");
  leftGroups.replaceChildren();
  rightGroups.replaceChildren();

  groups.forEach((group, index) => {
    const panel = document.createElement("section");
    panel.className = "group-panel";
    panel.style.setProperty("--group-color", groupColors[index]);

    const title = document.createElement("h2");
    title.textContent = `Group ${group.id}`;
    panel.append(title);

    const flagGrid = document.createElement("div");
    flagGrid.className = "group-flags";
    group.teams.forEach((team) => flagGrid.append(makeFlagImage(team, "group-flag")));
    panel.append(flagGrid);

    if (index < 6) leftGroups.append(panel);
    else rightGroups.append(panel);
  });
}

function renderWing(targetId, slots) {
  const wing = document.getElementById(targetId);
  wing.replaceChildren();

  sideRounds.forEach((round) => {
    const column = document.createElement("div");
    column.className = `round-column round-${round}`;
    const stack = document.createElement("div");
    stack.className = "round-stack";

    slots
      .filter((slot) => slot.round === round)
      .forEach((slot, index) => {
        const node = document.createElement("div");
        node.className = `connector-node ${slot.round}`;
        node.style.setProperty("--node-top", getNodeTop(round, index));
        node.append(makeMatchBox(slot, round === "sf" ? 1 : 2));
        stack.append(node);
      });

    column.append(stack);
    wing.append(column);
  });
}

function renderCenterStage() {
  document.getElementById("champion-slot").replaceChildren(
    makeBracketSlot("champion", { cellCount: 1, featured: true })
  );
  document.getElementById("final-left-slot").replaceChildren(
    makeBracketSlot("final-left", { cellCount: 1, compact: true })
  );
  document.getElementById("final-right-slot").replaceChildren(
    makeBracketSlot("final-right", { cellCount: 1, compact: true })
  );
  document.getElementById("third-left-slot").replaceChildren(
    makeBracketSlot("third-left", { cellCount: 2, compact: true })
  );
  document.getElementById("third-right-slot").replaceChildren(
    makeBracketSlot("third-right", { cellCount: 2, compact: true })
  );
}

function makeFlagCard(team, usedTeamIds) {
  const card = document.createElement("div");
  card.className = `flag-card${usedTeamIds.has(team.id) ? " used" : ""}`;
  card.draggable = true;
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ teamId: team.id, sourceSlotId: null })
    );
  });

  card.append(makeFlagImage(team, "bank-flag"));

  const text = document.createElement("div");
  const name = document.createElement("div");
  name.className = "flag-name";
  name.textContent = team.name;
  const code = document.createElement("div");
  code.className = "flag-code";
  code.textContent = team.code;
  text.append(name, code);
  card.append(text);

  return card;
}

function renderFlagBank() {
  const bank = document.getElementById("flag-bank");
  const usedTeamIds = getUsedTeamIds();
  bank.replaceChildren(...teams.map((team) => makeFlagCard(team, usedTeamIds)));

  const countText = `${usedTeamIds.size} / ${teams.length} placed`;
  document.getElementById("placed-count").textContent = countText;
  document.getElementById("bank-count").textContent = countText;
}

function renderControls() {
  const toggle = document.getElementById("allow-duplicates");
  toggle.classList.toggle("active", allowDuplicate);
  toggle.setAttribute("aria-pressed", String(allowDuplicate));
}

function render() {
  renderGroups();
  renderWing("left-wing", leftSlots);
  renderWing("right-wing", rightSlots);
  renderCenterStage();
  renderFlagBank();
  renderControls();
}

function downloadTextFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function bindControls() {
  document.getElementById("export-png").addEventListener("click", async () => {
    if (!window.html2canvas) {
      alert("html2canvas did not load. Check your internet connection or CDN access.");
      return;
    }

    const canvas = await window.html2canvas(document.getElementById("bracket-capture"), {
      backgroundColor: "#020304",
      scale: 2,
      useCORS: true
    });

    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "fifa-world-cup-2026-knockout-bracket.png";
    anchor.click();
  });

  document.getElementById("reset-bracket").addEventListener("click", () => {
    bracketState = { ...emptyState };
    saveToStorage();
    render();
  });

  document.getElementById("save-json").addEventListener("click", () => {
    downloadTextFile(
      "fifa-world-cup-2026-knockout-bracket.json",
      JSON.stringify(bracketState, null, 2),
      "application/json"
    );
  });

  document.getElementById("load-json").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const text = await file.text();
    bracketState = normalizeState(JSON.parse(text));
    event.target.value = "";
    saveToStorage();
    render();
  });

  document.getElementById("allow-duplicates").addEventListener("click", () => {
    allowDuplicate = !allowDuplicate;
    saveToStorage();
    render();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  readSavedState();
  bindControls();
  render();
});
