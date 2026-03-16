// Arrays and Object Notations Assignment
// Artin Kamyar
// March 5/26
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

// Bird array
let birds = [];

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

// Settings based on window size
let cloudSpeed;
let cloudGapHeight;
let pillarSpacing;
let pillarWidth;
let numPillars;
let gravity;

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
  createCanvas(windowWidth, windowHeight);
  
  // Calculate all sizes based on window
  calculateSizes();

  // Create bird object
  birds.push({
    x: width * 0.15,
    y: height / 2,
    velocity: 0,
    size: width * 0.05,
    flapStrength: - height * 0.0155
  })

  // Create all the pillars using a function with loops
  createPillars();
}

// Calculates all sizes as percentages of window dimensions so everything scales when you resize the window
function calculateSizes() {
  cloudSpeed = width * 0.003;
  cloudGapHeight = height * 0.35;
  gravity = height * 0.0009;
  pillarSpacing = width / 4; // Pillars are evenly spaced at 1/4 screen width
  pillarWidth = width * 0.08;
  numPillars = Math.ceil(width / pillarSpacing) + 2;  // Calculate how many pillars fit on screen
}

// Creates pillars evenly spaced across the screen using a for loop
function createPillars() {
  cloudPillars = [];
  
  // For loop creates all pillars and adds them
  for (let i = 0; i < numPillars; i++) {
    cloudPillars.push({
      x: width + i * pillarSpacing,
      gapY: random(height * 0.3, height * 0.7)
    });
  }
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
  birds[0].velocity += gravity;
  birds[0].y += birds[0].velocity;

  // Update all pillars using for loop
  for (let i = 0; i < cloudPillars.length; i++) {
    let currentSpeed = cloudSpeed * 1 + score * 0.04;
    cloudPillars[i].x -= currentSpeed;

    // This creates infinite pillars without making new ones
    if (cloudPillars[i].x < -pillarWidth) {
      let maxX = 0;
      for (let j = 0; j < cloudPillars.length; j++) {
        if (cloudPillars[j].x > maxX) {
          maxX = cloudPillars[j].x;
        }
      }
      
      // Move this pillar to the end with a new random gap
      cloudPillars[i].x = maxX + pillarSpacing;
      cloudPillars[i].gapY = random(height * 0.3, height * 0.7);
      score++;

      // 15% chance to flip the screen with every score
      if (random(1) < 0.15) {
        isFlipped = !isFlipped;
      }
    }
  }

  // Death if hits ground or ceiling
  if (birds[0].y > height - birds[0].size / 2 || birds[0].y < 0) {
    gameState = "dead";
  }

  // Check collisions with all pillars using for loop
  for (let i = 0; i < cloudPillars.length; i++) {
    if (checkCloudCollision(cloudPillars[i])) {
      gameState = "dead";
    }
  }
}

// Draws all game objects
function drawGame() {
  // Draw all pillars using for loop
  for (let i = 0; i < cloudPillars.length; i++) {
    drawCloudPillar(cloudPillars[i]);
  }
  
  drawBird();
  drawScore();
}

// Bird using image
function drawBird() {
  push();
  translate(birds[0].x, birds[0].y);
  
  // Tilt bird based on velocity
  let angle = constrain(birds[0].velocity * 0.05, -0.5, 0.9);
  rotate(angle);
  
  // Draw bird image centered
  imageMode(CENTER);
  image(birdImg, 0, 0, birds[0].size, birds[0].size);
  
  pop();
}

// Cloud pillar using loop to stack cloud images
function drawCloudPillar(pillar) {
  let topCloudBottom = pillar.gapY - cloudGapHeight / 2;
  let bottomCloudTop = pillar.gapY + cloudGapHeight / 2;
  let cloudHeight = pillarWidth * 0.7;

  imageMode(CORNER);
  
  // Top pillar stack clouds using for loop
  for (let y = 0; y < topCloudBottom; y += cloudHeight - 15) {
    image(cloudImg, pillar.x - pillarWidth / 2, y, pillarWidth, cloudHeight);
  }

  // Bottom pillar stack clouds using for loop
  for (let y = bottomCloudTop; y < height; y += cloudHeight - 15) {
    image(cloudImg, pillar.x - pillarWidth / 2, y, pillarWidth, cloudHeight);
  }
}

// Collision detection
function checkCloudCollision(pillar) {
  let topCloudBottom = pillar.gapY - cloudGapHeight / 2;
  let bottomCloudTop = pillar.gapY + cloudGapHeight / 2;
  let hitboxWidth = pillarWidth * 0.80; // It is 0.80 so play doesn't die to edges
  
  // Bird hitbox is 60% of visual size
  let birdHitbox = birds[0].size * 0.6;

  // Check if bird overlaps with pillar horizontally
  let inXRange = birds[0].x + birdHitbox / 2 > pillar.x - hitboxWidth / 2 && birds[0].x - birdHitbox / 2 < pillar.x + hitboxWidth / 2;

  // Check if bird hits top or bottom cloud
  let hitsTop = birds[0].y - birdHitbox / 2 < topCloudBottom;
  let hitsBottom = birds[0].y + birdHitbox / 2 > bottomCloudTop;

  return inXRange && (hitsTop || hitsBottom);
}

// Score display
function drawScore() {
  fill(255);
  stroke(0);
  strokeWeight(3);
  textAlign(CENTER);
  textSize(width * 0.04);
  text(score, width / 2, height * 0.08);
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
  textSize(width * 0.06);
  text("YOU CRASHED!", width / 2, height / 2 - height * 0.08);

  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(width * 0.04);
  text("Score: " + score, width / 2, height / 2 + height * 0.01);

  textSize(width * 0.025);
  text("Press R to try again", width / 2, height / 2 + height * 0.08);
}

// Makes bird jump
function flap() {
  if (gameState === "waiting") {
    gameState = "playing";
  }
  if (gameState === "playing") {
    birds[0].velocity = birds[0].flapStrength;
  }
}

// Resets game
function resetGame() {
  isFlipped = false;
  birds[0].y = height / 2;
  birds[0].velocity = 0;
  score = 0;
  gameState = "waiting";
  
  // Recreate all pillars
  createPillars();
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
  
  // Recalculate sizes for new window
  calculateSizes();
  
  // Update bird properties in birds array
  birds[0].x = width * 0.15;
  birds[0].size = width * 0.05;
  birds[0].flapStrength = -height * 0.018;
  
  // Keep bird on screen
  if (birds[0].y > height) {
    birds[0].y = height / 2;
  }
  
  // Recreate pillars with new spacing
  createPillars();
}