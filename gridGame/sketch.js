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

// The 2D array that holds the whole maze
let grid = [];

let cols;
let rows;

// Player position in grid coordinates
let playerCol;
let playerRow;

let gameState = "playing";

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Figure out how many cols and rows fit on screen
  // I use odd numbers so the maze walls work out properly
  cols = Math.floor(width / CELL_SIZE);
  rows = Math.floor(height / CELL_SIZE);
  if (cols % 2 === 0) cols--;
  if (rows % 2 === 0) rows--;

  generateMaze();
}

function draw() {
  background(30);

  drawMaze();
  drawPlayer();

  if (gameState === "dead") {
    drawMessage("YOU HIT A MINE!", "Press R to try again");
  } else if (gameState === "win") {
    drawMessage("YOU ESCAPED!", "Press R to play again");
  }
}

// Builds the maze using a simple recursive backtracker
// It starts with all walls then carves out paths
function generateMaze() {
  // Fill the whole grid with walls first using nested for loops
  grid = [];
  for (let r = 0; r < rows; r++) {
    grid.push([]);
    for (let c = 0; c < cols; c++) {
      grid[r].push(WALL);
    }
  }

  // Carve paths starting from top left cell
  carvePath(1, 1);

  // Place the exit randomly on one of the four corners
  placeExit();

  // Scatter mines on walkable tiles
  placeMines();

  // Spawn player at top left path cell
  playerCol = 1;
  playerRow = 1;
  gameState = "playing";
}

// Recursive function that carves a path through the maze
// It visits cells in random order so the maze is different every time
function carvePath(c, r) {
  grid[r][c] = PATH;

  // All four directions shuffled randomly so carving is unpredictable
  let directions = shuffle([
    [0, -2], // up
    [0,  2], // down
    [-2, 0], // left
    [2,  0]  // right
  ]);

  for (let i = 0; i < directions.length; i++) {
    let nc = c + directions[i][0];
    let nr = r + directions[i][1];

    // Only carve if the neighbour is inside the grid and still a wall
    if (nc > 0 && nc < cols - 1 && nr > 0 && nr < rows - 1 && grid[nr][nc] === WALL) {
      // Also carve the cell between current and neighbour to connect them
      grid[r + directions[i][1] / 2][c + directions[i][0] / 2] = PATH;
      carvePath(nc, nr);
    }
  }
}

// Picks one of the four corners randomly and places the exit there
function placeExit() {
  // The four corner positions
  let corners = [
    [1, 1],           // top left
    [cols - 2, 1],    // top right
    [1, rows - 2],    // bottom left
    [cols - 2, rows - 2] // bottom right
  ];

  // Pick one corner randomly
  let chosen = corners[Math.floor(random(corners.length))];
  grid[chosen[1]][chosen[0]] = EXIT;
}

// Goes through every path tile and gives it a small chance to become a mine
function placeMines() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Only replace walkable tiles, not exits or walls
      if (grid[r][c] === PATH && !(r === 1 && c === 1)) {
        if (random(1) < MINE_CHANCE) {
          grid[r][c] = MINE;
        }
      }
    }
  }
}

// Draws every cell in the 2D grid using nested for loops
function drawMaze() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === WALL) {
        fill(60, 80, 60); // dark green walls
      } else if (grid[r][c] === PATH) {
        fill(200, 190, 160); // sandy path
      } else if (grid[r][c] === EXIT) {
        fill(80, 200, 80); // bright green exit
      } else if (grid[r][c] === MINE) {
        fill(200, 190, 160); // mines look like normal paths so you cant see them
      }
      noStroke();
      rect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

// Draws the player as a circle
function drawPlayer() {
  fill(255, 100, 100);
  noStroke();
  let px = playerCol * CELL_SIZE + CELL_SIZE / 2;
  let py = playerRow * CELL_SIZE + CELL_SIZE / 2;
  circle(px, py, CELL_SIZE * 0.7);
}

// Overlay message for win/dead states
function drawMessage(title, subtitle) {
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER);
  fill(255);
  textSize(width * 0.05);
  text(title, width / 2, height / 2 - 20);
  textSize(width * 0.025);
  text(subtitle, width / 2, height / 2 + 30);
}

// Move player with arrow keys
function keyPressed() {
  if (gameState !== "playing") {
    if (key === 'r' || key === 'R') generateMaze();
    return;
  }

  let nc = playerCol;
  let nr = playerRow;

  if (keyCode === UP_ARROW)    nr--;
  if (keyCode === DOWN_ARROW)  nr++;
  if (keyCode === LEFT_ARROW)  nc--;
  if (keyCode === RIGHT_ARROW) nc++;

  // Only move if the new cell is not a wall and is inside the grid
  if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && grid[nr][nc] !== WALL) {
    playerCol = nc;
    playerRow = nr;

    if (grid[nr][nc] === EXIT) {
      gameState = "win";
    } else if (grid[nr][nc] === MINE) {
      gameState = "dead";
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Recalculate grid size and regenerate so it fits the new window
  cols = Math.floor(width / CELL_SIZE);
  rows = Math.floor(height / CELL_SIZE);
  if (cols % 2 === 0) cols--;
  if (rows % 2 === 0) rows--;
  generateMaze();
}