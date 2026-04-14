// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

// Cell types stored in the 2D grid
const WALL = 0;
const PATH = 1;
const EXIT = 2;
const MINE = 3;

// How big each cell is in pixels
const CELL_SIZE = 40;

// Chance for a mine to spawn on any walkable tile
const MINE_CHANCE = 0.05;

// How long in ms before a tripped mine explodes
const MINE_DELAY = 1300;

// How many cells around the player are visible
const VISIBILITY_RADIUS = 4;

// Each player gets a unique color
const playerColors = [
  [255, 80,  80 ],  // Player 1 Red
  [80,  150, 255],  // Player 2 Blue
  [80,  255, 120],  // Player 3 Green
  [255, 230, 80 ],  // Player 4 Yellow
  [200, 80,  255],  // Player 5 Purple
];

// The 2D array that holds the whole maze
let grid = [];

// Player position stored as grid coordinates
let cols;
let rows;

// realX and realY are the smooth pixel positions for lerp animation
let realX;
let realY;

let gameState = "menu";
let gameMode = "";

// activeMines only used in single player, multiplayer uses shared.activeMines instead
let activeMines = [];

// p5.party objects: shared is the same for everyone, me is just my own data
let shared;
let me;

function setup() {
  createCanvas(windowWidth, windowHeight);
  initializeGridSize();
}

function draw() {
  background(15);

  // In multiplayer I check shared each frame to stay in sync with the host
  if (gameMode === "multi" && shared) {

    // When host starts the game and the grid is ready, set up my local state
    if (shared.gameState === "playing" && gameState === "waiting" && shared.gridReady) {
      grid = rebuildGrid(shared.flatGrid, shared.mazeCols, shared.mazeRows);
      cols = shared.mazeCols;
      rows = shared.mazeRows;
      me.col = shared.spawnCol;
      me.row = shared.spawnRow;
      // Clear spawn tile so no one starts directly on a mine
      if (grid[me.row]) {
        grid[me.row][me.col] = PATH;
      }
      realX = me.col * CELL_SIZE;
      realY = me.row * CELL_SIZE;
      gameState = "playing";
    }

    // If host resets the game back to waiting, reset my own bird state too
    if (shared.gameState === "waiting" && (gameState === "dead" || gameState === "win" || gameState === "leaderboard")) {
      me.isDead = false;
      me.hasEscaped = false;
      me.finishTime = 0;
      gameState = "waiting";
    }

    // Sync leaderboard trigger from host
    if (shared.gameState === "leaderboard" && gameState !== "leaderboard") {
      gameState = "leaderboard";
    }

    // Keep the grid in sync with shared so mine clears show for everyone
    if (shared.gridReady && gameState === "playing") {
      grid = rebuildGrid(shared.flatGrid, shared.mazeCols, shared.mazeRows);
    }
  }

  if (gameState === "menu") {
    drawMenuScreen();
    return;
  }

  if (gameState === "waiting") {
    drawWaitingScreen();
    return;
  }

  // Lerp smoothly slides realX/realY toward the target grid position each frame
  let myCol = gameMode === "multi" && me ? me.col : playerCol;
  let myRow = gameMode === "multi" && me ? me.row : playerRow;
  realX = lerp(realX, myCol * CELL_SIZE, 0.2);
  realY = lerp(realY, myRow * CELL_SIZE, 0.2);

  drawMaze();
  if (gameMode === "multi") {
    drawOtherPlayers();
  }
  drawPlayer();
  handleMineLogic();

  if (gameState === "dead") {
    drawMessage("BOOM!", "Too slow! Press R to restart");
  } 
  else if (gameState === "win") {
    drawMessage("ESCAPED!", "You found the exit! Press R to restart");
  } 
  else if (gameState === "leaderboard") {
    drawLeaderboard();
  }
}

// I force odd numbers because the recursive backtracker needs odd dimensions to work
function initializeGridSize() {
  cols = Math.floor(width / CELL_SIZE);
  rows = Math.floor(height / CELL_SIZE);
  if (cols % 2 === 0) {
    cols--;
  }
  if (rows % 2 === 0) {
    rows--;
  }
}

// Builds the maze using a simple recursive backtracker
// It starts with all walls then carves out paths
function generateMaze() {
  // Fill the whole 2D grid with walls first using nested for loops
  grid = [];
  activeMines = [];
  for (let r = 0; r < rows; r++) {
    grid.push([]);
    for (let c = 0; c < cols; c++) {
      grid[r].push(WALL);
    }
  }

  // Carve the maze starting from (1,1)
  carvePath(1, 1);

  // Shuffle the four corners so exit and player spawn in random different corners
  let corners = [[1, 1], 
    [cols - 2, 1], 
    [1, rows - 2], 
    [cols - 2, rows - 2]];
  corners = shuffle(corners);

  let exitPos  = corners[0];
  let spawnPos = corners[1];
  grid[exitPos[1]][exitPos[0]]   = EXIT;
  grid[spawnPos[1]][spawnPos[0]] = PATH; // clear spawn so no mine can land there

  placeMines(spawnPos[0], spawnPos[1]);

  if (gameMode === "single") {
    playerCol = spawnPos[0];
    playerRow = spawnPos[1];
    realX = playerCol * CELL_SIZE;
    realY = playerRow * CELL_SIZE;
    gameState = "playing";
  } 
  else if (partyIsHost()) {
    // Flatten the 2D grid to a 1D array so p5.party can sync it to everyone
    shared.flatGrid    = grid.flat();
    shared.mazeCols    = cols;
    shared.mazeRows    = rows;
    shared.spawnCol    = spawnPos[0];
    shared.spawnRow    = spawnPos[1];
    shared.activeMines = [];
    shared.gridReady   = true;
    shared.gameState   = "playing";
  }
}

// Recursive function that carves a path through the maze
// It visits cells in random order so the maze is different every time
// I had to use odd numbered steps so walls always stay between paths
function carvePath(c, r) {
  grid[r][c] = PATH;

  let directions = shuffle([[0, -2], 
    [0, 2], 
    [-2, 0], 
    [2, 0]]);

  for (let dir of directions) {
    let nc = c + dir[0], nr = r + dir[1];
    // Only carve into cells that are still walls and inside the grid border
    if (nc > 0 && nc < cols - 1 && nr > 0 && nr < rows - 1 && grid[nr][nc] === WALL) {
      // Carve the wall between current cell and neighbour to connect them
      grid[r + dir[1] / 2][c + dir[0] / 2] = PATH;
      carvePath(nc, nr);
    }
  }
}

// Goes through every path tile and gives it a small chance to become a mine
function placeMines() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === PATH && !(r === playerRow && c === playerCol)) {
        if (random(1) < MINE_CHANCE) {
          grid[r][c] = MINE;
        }
      }
    }
  }
}

// p5.party can't sync 2D arrays directly so I flatten to 1D when syncing and rebuild the 2D grid on every client from the flat version
function rebuildGrid(flat, c, r) {
  let g = [];
  for (let row = 0; row < r; row++) {
    g.push(Array.from(flat.slice(row * c, (row+1) * c)));
  }
  return g;
}

// Connects to p5.party and sets up the shared and me objects
function connectMultiplayer() {
  partyConnect("wss://demoserver.p5party.org", "maze-escape-v1");

  shared = partyLoadShared("shared", {
    flatGrid: [],
    mazeCols: 0,
    mazeRows: 0,
    spawnCol: 1,
    spawnRow: 1,
    activeMines: [],
    gridReady: false,
    gameState: "waiting"
  });

  // me is my own private data, playerIndex assigns my color from the playerColors array
  me = partyLoadMyShared({
    col: 1,
    row: 1,
    isDead: false,
    hasEscaped: false,
    finishTime: 0,
    playerIndex: partyLoadGuestShareds().length % 5
  });
}

// Checks active mines each frame - single player uses local activeMines, multi uses shared.activeMines
function handleMineLogic() {
  if (gameState !== "playing") return;

  if (gameMode === "single") {
    // Loop backwards so splice doesn't mess up the index
    for (let i = activeMines.length - 1; i >= 0; i--) {
      let m = activeMines[i];
      if (millis() - m.time > MINE_DELAY) {
        if (playerCol === m.c && playerRow === m.r) {
          gameState = "dead";
        } 
        else {
          // Player moved away in time so just clear the mine
          grid[m.r][m.c] = PATH;
          activeMines.splice(i, 1);
        }
      }
    }
  } else {
    if (!me || me.isDead || me.hasEscaped) {
      return;
    }
    let mines = shared.activeMines || [];

    // Check if I'm still standing on any mine that just went off
    for (let i = 0; i < mines.length; i++) {
      let m = mines[i];
      // I use Date.now() instead of millis() so the timestamp is consistent across all clients
      if (Date.now() - m.time > MINE_DELAY && me.col === m.c && me.row === m.r) {
        me.isDead = true;
        gameState = "dead";
      }
    }

    // Host is responsible for cleaning up expired mines that no one is standing on anymore
    if (partyIsHost()) {
      let players = partyLoadGuestShareds();
      let newMines = [];
      for (let i = 0; i < mines.length; i++) {
        let m = mines[i];
        if (Date.now() - m.time > MINE_DELAY) {
          let anyoneOnIt = players.some(p => !p.isDead && p.col === m.c && p.row === m.r);
          if (!anyoneOnIt) {
            // Clear it from the flat grid so the sync removes the mine visually for everyone
            shared.flatGrid[m.r * shared.mazeCols + m.c] = PATH;
            continue; // don't keep this mine in the list
          }
        }
        newMines.push(m);
      }
      if (newMines.length !== mines.length) {
        shared.activeMines = newMines;
      }

      // When all players are either dead or escaped, show the leaderboard
      let allDone = players.length > 0 && players.every(p => p.isDead || p.hasEscaped);
      if (allDone && shared.gameState !== "leaderboard") {
        shared.gameState = "leaderboard";
      }
    }
  }
}

// Draws the maze with fog, tiles that are far from the player fade out
function drawMaze() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Calculate distance from player and map it to an opacity value
      let d = dist(playerCol, playerRow, c, r);
      let opacity = map(d, VISIBILITY_RADIUS - 2, VISIBILITY_RADIUS, 255, 0);
      opacity = constrain(opacity, 0, 255);

      // Skip completely invisible tiles to save drawing time
      if (opacity <= 0) {
        continue;
      }

      if (grid[r][c] === WALL) {
        fill(40, 50, 45, opacity);
      }
      else if (grid[r][c] === PATH) {
        fill(210, 200, 180, opacity);
      }
      else if (grid[r][c] === EXIT) {
        fill(50, 220, 100, opacity);
      }
      else if (grid[r][c] === MINE) {
        // Active mines pulse red so you can see the countdown, hidden ones look like normal path
        let active = null;
        for (let k = 0; k < activeMines.length; k++) {
          if (activeMines[k].r === r && activeMines[k].c === c) {
            active = activeMines[k];
            break;
          }
        }
        if (active) {
          let pulse = map(sin(frameCount * 0.2), -1, 1, 100, 255);
          fill(pulse, 0, 0, opacity);
        } 
        else {
          fill(210, 200, 180, opacity); // Looks identical to PATH so you can't see
        }
      }
      noStroke();
      rect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

// Draws the player at the smooth lerped position with a little breathing animation
function drawPlayer() {
  push();
  translate(realX + CELL_SIZE / 2, realY + CELL_SIZE / 2);
  // sin() on frameCount gives a slow oscillation for the breathing effect
  let breathe = sin(frameCount * 0.1) * 3;
  fill(255, 80, 80);
  circle(0, 0, CELL_SIZE * 0.7 + breathe);
  // Two small white circles for eyes
  fill(255);
  circle(-5, -5, 5);
  circle(5, -5, 5);
  pop();
}

// Messages for win and dead screens
function drawMessage(title, subtitle) {
  fill(0, 0, 0, 220);
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(50);
  text(title, width / 2, height / 2 - 20);
  textSize(20);
  fill(200);
  text(subtitle, width / 2, height / 2 + 40);
}

// Arrow keys move the player, R restarts
function keyPressed() {
  if (gameState !== "playing") {
    if (key === 'r' || key === 'R') {
      generateMaze();
      return;
    }
  }

  let nc = playerCol;
  let nr = playerRow;

  if (gameState === "playing") {
    if (keyCode === UP_ARROW) {
      nr--;
    }
    else if (keyCode === DOWN_ARROW) {
      nr++;
    }
    else if (keyCode === LEFT_ARROW) {
      nc--;
    }
    else if (keyCode === RIGHT_ARROW) {
      nc++;
    }
  }

  // Make sure new position is inside the grid and not a wall
  if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
    if (grid[nr][nc] !== WALL) {
      playerCol = nc;
      playerRow = nr;

      if (grid[nr][nc] === EXIT) {
        gameState = "win";
      } 
      else if (grid[nr][nc] === MINE) {
        // Only trip the mine once - check if it's already in the active list
        let alreadyTripped = activeMines.some(m => m.r === nr && m.c === nc);
        if (!alreadyTripped) {
          activeMines.push({ r: nr, c: nc, time: millis() });
        }
      }
    }
  }
}

// Recalculate grid size and regenerate when window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeGridSize();
  generateMaze();
}