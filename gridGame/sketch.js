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

// The 2D array that holds the whole maze
let grid = [];

// Player position stored as grid coordinates
let cols;
let rows;

// realX and realY are the smooth pixel positions for lerp animation
let realX;
let realY;

// Player position in grid coordinates
let playerCol;
let playerRow;

let gameState = "playing";

function setup() {
  createCanvas(windowWidth, windowHeight);

  initializeGridSize();
  generateMaze();
  realX = playerCol * CELL_SIZE;
  realY = playerRow * CELL_SIZE;
}

function draw() {
  background(15);

  // Lerp smoothly slides realX/realY toward the target grid position each frame
  let lerpSpeed = 0.2;
  realX = lerp(realX, playerCol * CELL_SIZE, lerpSpeed);
  realY = lerp(realY, playerRow * CELL_SIZE, lerpSpeed);

  drawMaze();
  drawPlayer();
  handleMineLogic();

  if (gameState === "dead") {
    drawMessage("BOOM!", "Too slow! Press R to restart");
  } 
  else if (gameState === "win") {
    drawMessage("VICTORY!", "You found the way out! Press R to restart");
  }
}

// Calculates how many cols and rows fit on screen
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

  // First shuffled corner is the exit, second is the player spawn
  let exitPos = corners[0];
  grid[exitPos[1]][exitPos[0]] = EXIT;

  playerCol = corners[1][0];
  playerRow = corners[1][1];

  realX = playerCol * CELL_SIZE;
  realY = playerRow * CELL_SIZE;

  placeMines();
  gameState = "playing";
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

// Checks all active mines each frame and explodes them if MINE_DELAY has passed
// I loop backwards so I can safely splice without messing up the index
function handleMineLogic() {
  if (gameState !== "playing") {
    return;
  }

  for (let i = activeMines.length - 1; i >= 0; i--) {
    let m = activeMines[i];
    if (millis() - m.time > MINE_DELAY) {
      if (playerCol === m.c && playerRow === m.r) {
        // Player is still standing on it when it goes off
        gameState = "dead";
      } 
      else {
        // Player moved away in time so the mine just disappears
        grid[m.r][m.c] = PATH;
        activeMines.splice(i, 1);
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