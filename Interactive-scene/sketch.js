// Flappy Bird
// Artin Kamyar
// 2/25/2026
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"


// Bird variables
let birdX = 120;
let birdY;
let birdVelocity = 0;
let birdSize = 35;
let gravity = 0.45;
let flapStrength = -9;

// Images
let birdImg;
let cloudImg;
let forestBg;
let mountainBg;
let natureBg;
let desertBg;

// Game state tracking
let gameState = "waiting";
let score = 0;

// Cloud pillar 1
let cloud1X;
let cloud1GapY;

// Cloud pillar 2
let cloud2X;
let cloud2GapY;

// Cloud pillar 3
let cloud3X;
let cloud3GapY;

let cloudSpeed = 4;
let cloudGapHeight = 180;

// Preload images before setup runs
function preload() {
  birdImg = loadImage('red-bird.png');
  cloudImg = loadImage('gray-cloud.png');
  forestBg = loadImage('forest.png');
  mountainBg = loadImage('mountain.png');
  natureBg = loadImage('nature.png');
  desertBg = loadImage('desert.png');
}

function setup() {
  // Set up starting positions
  createCanvas(windowWidth, windowHeight);
  birdY = height / 2;

  cloud1X = width + 200;
  cloud1GapY = random(height * 0.3, height * 0.7);
  
  cloud2X = width + 550;
  cloud2GapY = random(height * 0.3, height * 0.7);
  
  cloud3X = width + 900;
  cloud3GapY = random(height * 0.3, height * 0.7);
}

function draw() {
  // Change background based on score
  if (score > 15) {
    image(natureBg, 0, 0, width, height);
  }
  else if (score > 10) {
    image(mountainBg, 0, 0, width, height);
  }
  else if (score > 5) {
    image(desertBg, 0, 0, width, height);
  }
  else {
    image(forestBg, 0, 0, width, height);
  }

  // Use functions based on gameState
  if (gameState === "waiting") {
    drawWaitingScreen();
  } 
  else if (gameState === "playing") {
    updateGame();
    drawGame();
  } 
  else if (gameState === "dead") {
    drawGame();
    drawDeadScreen();
  }
}

// Title and instructions screen
function drawWaitingScreen() {
  drawBird();

  fill(30, 30, 80);
  stroke(255);
  strokeWeight(3);
  textAlign(CENTER);
  textSize(34);
  text("Flappy Bird", width / 2, height / 2 - 100);

  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(16);
  text("Fly through the cloud gaps!", width / 2, height / 2);
  text("SPACE or CLICK to flap", width / 2, height / 2 + 30);
}

// Updates all game objects each frame
function updateGame() {
  // Bird physics
  birdVelocity += gravity;
  birdY += birdVelocity;

  // Move pillar 1
  cloud1X -= cloudSpeed;
  if (cloud1X < -100) {
    cloud1X = width + 100;
    cloud1GapY = random(height * 0.3, height * 0.7);
    score++;
  }

  // Move pillar 2
  cloud2X -= cloudSpeed;
  if (cloud2X < -100) {
    cloud2X = width + 100;
    cloud2GapY = random(height * 0.3, height * 0.7);
    score++;
  }

  // Move pillar 3
  cloud3X -= cloudSpeed;
  if (cloud3X < -100) {
    cloud3X = width + 100;
    cloud3GapY = random(height * 0.3, height * 0.7);
    score++;
  }

  // Death if hits ground or ceiling
  if (birdY > height - birdSize / 2 || birdY < 0) {
    gameState = "dead";
  }

  // Check collisions with each pillar
  if (checkCloudCollision(cloud1X, cloud1GapY)) {
    gameState = "dead";
  }
  if (checkCloudCollision(cloud2X, cloud2GapY)) {
    gameState = "dead";
  }
  if (checkCloudCollision(cloud3X, cloud3GapY)) {
    gameState = "dead";
  }
}

// Draws all game objects
function drawGame() {
  drawCloudPillar(cloud1X, cloud1GapY);
  drawCloudPillar(cloud2X, cloud2GapY);
  drawCloudPillar(cloud3X, cloud3GapY);
  drawBird();
  drawScore();
}

// Bird using image
function drawBird() {
  push();
  translate(birdX, birdY);
  
  // Tilt bird based on velocity
  let angle = constrain(birdVelocity * 0.05, -0.5, 0.9);
  rotate(angle);
  
  // Draw bird image centered
  imageMode(CENTER);
  image(birdImg, 0, 0, birdSize, birdSize);
  
  pop();
}

// Cloud pillar using loop to stack cloud images
function drawCloudPillar(pillarX, gapY) {
  let topCloudBottom = gapY - cloudGapHeight / 2;
  let bottomCloudTop = gapY + cloudGapHeight / 2;
  let pillarWidth = 100;
  let cloudHeight = 70;

  imageMode(CORNER);
  
  // Top pillar stack clouds using for loop
  for (let y = 0; y < topCloudBottom; y += cloudHeight - 15) {
    image(cloudImg, pillarX - pillarWidth / 2, y, pillarWidth, cloudHeight);
  }

  // Bottom pillar stack clouds using for loop
  for (let y = bottomCloudTop; y < height; y += cloudHeight - 15) {
    image(cloudImg, pillarX - pillarWidth / 2, y, pillarWidth, cloudHeight);
  }
}

// Collision detection
function checkCloudCollision(pillarX, gapY) {
  let topCloudBottom = gapY - cloudGapHeight / 2;
  let bottomCloudTop = gapY + cloudGapHeight / 2;
  let pillarWidth = 80;
  
  // Bird hitbox is 60% of visual size
  let birdHitbox = birdSize * 0.6;

  // Check if bird overlaps with pillar horizontally
  let inXRange = birdX + birdHitbox / 2 > pillarX - pillarWidth / 2 && birdX - birdHitbox / 2 < pillarX + pillarWidth / 2;

  // Check if bird hits top or bottom cloud
  let hitsTop = birdY - birdHitbox / 2 < topCloudBottom;
  let hitsBottom = birdY + birdHitbox / 2 > bottomCloudTop;

  return inXRange && (hitsTop || hitsBottom);
}

// Score display
function drawScore() {
  fill(255);
  stroke(0);
  strokeWeight(3);
  textAlign(CENTER);
  textSize(28);
  text(score, width / 2, 45);
}

// Death screen
function drawDeadScreen() {
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);

  fill(255, 80, 80);
  stroke(150, 0, 0);
  strokeWeight(3);
  textAlign(CENTER);
  textSize(42);
  text("YOU CRASHED!", width / 2, height / 2 - 60);

  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(26);
  text("Score: " + score, width / 2, height / 2 + 5);

  textSize(18);
  text("Press R to try again", width / 2, height / 2 + 60);
}

// Makes bird jump
function flap() {
  if (gameState === "waiting") {
    gameState = "playing";
  }
  if (gameState === "playing") {
    birdVelocity = flapStrength;
  }
}

// Resets game
function resetGame() {
  birdY = height / 2;
  birdVelocity = 0;
  score = 0;
  gameState = "waiting";
  
  cloud1X = width + 200;
  cloud1GapY = random(height * 0.3, height * 0.7);
  
  cloud2X = width + 550;
  cloud2GapY = random(height * 0.3, height * 0.7);
  
  cloud3X = width + 900;
  cloud3GapY = random(height * 0.3, height * 0.7);
}

// Mouse interaction
function mousePressed() {
  flap();
}

// Keyboard interaction
function keyPressed() {
  if (key === ' ') {
    flap();
  }
  if ((key === 'r' || key === 'R') && gameState === "dead") {
    resetGame();
  }
}

// Window resize handler
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  if (birdY > height) {
    birdY = height / 2;
  }
  
  cloud1GapY = random(height * 0.3, height * 0.7);
  cloud2GapY = random(height * 0.3, height * 0.7);
  cloud3GapY = random(height * 0.3, height * 0.7);
}