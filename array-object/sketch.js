// Arrays and Object Notations Assignment
// Artin Kamyar
// March 5/26
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
let isFlipped = false;

// Cloud pillar objects
let cloudPillars = [];

// Cloud settings
let cloudSpeed = 4;
let cloudGapHeight = 180;

// Preload images before setup runs
function preload() {
  birdImg = loadImage('red-bird.png');
  cloudImg = loadImage('gray-cloud.png');
  forestBg = loadImage('forest.png');
  mountainBg = loadImage('mountain.jpg');
  natureBg = loadImage('nature.jpg');
  desertBg = loadImage('desert.jpg');
}

function setup() {
  // Set up starting positions
  createCanvas(windowWidth, windowHeight);
  birdY = height / 2;

  // Creat 3 pillar objects using push()
  cloudPillars.push({
    x: width + 200,
    gapY: random(height * 0.3, height * 0.7),
  });
  
  cloudPillars.push({
    x: width + 550,
    gapY: random(height * 0.3, height * 0.7),
  });

  cloudPillars.push({
    x: width + 900,
    gapY: random(height * 0.3, height * 0.7),
  });
}

function draw() {
  push();

  if (isFlipped) {
    // Move origin to center then rotate 180 degrees and move origin back
    translate(width / 2, height / 2);
    rotate(PI); 
    translate(-width / 2, -height / 2);
  }

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

  pop();
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

  // Update all pillars using for loop and array
  for (let i = 0; i < cloudPillars.length; i++) {
    cloudPillars[i].x -= cloudSpeed;

    if (cloudPillars[i].x  <  -100) {
      cloudPillars[i].x = width + 100;
      cloudPillars[i].gapY = random(height * 0.3, height * 0.7);
      score++;

      // 15% chance to flip the screen with every score
      if (random(1) < 0.15) {
        isFlipped = !isFlipped;
      }
    }
  }

  // Death if hits ground or ceiling
  if (birdY > height - birdSize / 2 || birdY < 0) {
    gameState = "dead";
  }

  // Check collisions using for loop
  for (let i = 0; i < cloudPillars.length; i++) {
    if (checkCloudCollision(cloudPillars[i].x, cloudPillars[i].gapY)) {
      gameState = "dead";
    }
  }
}

// Draws all game objects
function drawGame() {
  // Draw all pillars using for loop
  for (let i = 0; i < cloudPillars.length; i++) {
    drawCloudPillar(cloudPillars[i].x, cloudPillars[i].gapY);
  }
  
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
  let pillarWidth = 90; // It is 90 so play doesn't die to edges
  
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
  isFlipped = false;
  birdY = height / 2;
  birdVelocity = 0;
  score = 0;
  gameState = "waiting";
  
  // Reset all pillars using for loop
  cloudPillars[0].x = width + 200;
  cloudPillars[0].gapY = random(height * 0.3, height * 0.7);
  
  cloudPillars[1].x = width + 550;
  cloudPillars[1].gapY = random(height * 0.3, height * 0.7);
  
  cloudPillars[2].x = width + 900;
  cloudPillars[2].gapY = random(height * 0.3, height * 0.7);
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
  
  for (let pillar of cloudPillars) {
    pillar.gapY = random(height * 0.3, height * 0.7);
  }
}