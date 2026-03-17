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
let gameState = "menu";
let gameMode = "";
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

// shared is the same for everyone and me is just my own bird data fo p5.party
let shared;
let me;

// One color per player so each bird looks different even though its the same image
const playerColors = [
  [255, 80,  80 ],   // Player 1 Red
  [80,  150, 255],   // Player 2 Blue
  [80,  255, 120],   // Player 3 Green
  [255, 230, 80 ],   // Player 4 Yellow
  [200, 80,  255],   // Player 5 Purple
];

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
  });

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

// Connects to p5.party server and sets up shared and me objects
// shared holds everything everyone needs to see like pillars and score
// me holds just my birds data like y position and whether im dead
function connectMultiplayer() {
  partyConnect("wss://deepstream.p5party.org", "ForestFlyer_Artin");

  shared = partyLoadShared("shared", {
    pillars: [],
    score: 0,
    isFlipped: false,
    gameState: "waiting"
  });

  // Figure out which color slot I get based on how many players joined before me
  let playerIndex = partyGetAll().length % 5;

  me = partyLoadMe({
    y: height / 2,
    velocity: 0,
    isDead: false,
    finalScore: 0,
    playerIndex: playerIndex
  });
}

function draw() {
  push();

  // Screen flip effect works in both modes
  // In multiplayer I check shared.isFlipped instead of the local one
  let flipped = gameMode === "multi" && shared ? shared.isFlipped : isFlipped;
  if (flipped) {
    // Move origin to center then rotate 180 degrees and move origin back
    translate(width / 2, height / 2);
    rotate(PI); 
    translate(-width / 2, -height / 2);
  }

  // Change background based on score shared in multiplayer
  let currentScore = gameMode === "multi" && shared ? shared.score : score;
  if (currentScore > 15) {
    image(natureBg, 0, 0, width, height);
  }
  else if (currentScore > 10) {
    image(mountainBg, 0, 0, width, height);
  }
  else if (currentScore > 5) {
    image(desertBg, 0, 0, width, height);
  }
  else {
    image(forestBg, 0, 0, width, height);
  }

  // Use functions based on gameState
  if (gameState === "menu") {
    drawMenuScreen();
  } 
  else if (gameState === "waiting") {
    drawWaitingScreen();
  } 
  else if (gameState === "playing") {
    updateGame(); drawGame(); 
  }
  else if (gameState === "dead") {
    drawGame();
    drawDeadScreen();
  }
  else if (gameState === "leaderboard") {
    drawGame(); drawLeaderboard();
  }

  pop();
}

// Title and instructions screen with two buttons to pick single or multiplayer
function drawMenuScreen() {
  drawBird();

  fill(30, 30, 80);
  stroke(255);
  strokeWeight(3);
  textAlign(CENTER);
  textSize(34);
  text("Flappy Bird", width / 2, height / 2 - 100);

  // Drawing the two mode buttons I used rectMode CENTER so I can position from middle
  let btnW = width * 0.25;
  let btnH = height * 0.08;
  let btnY = height * 0.5;

  rectMode(CENTER);

  fill(50, 120, 50);
  stroke(255);
  strokeWeight(2);
  rect(width / 2, btnY, btnW, btnH, 10);
  fill(255);
  noStroke();
  textSize(width * 0.025);
  text("Single Player", width / 2, btnY + height * 0.012);

  fill(50, 50, 150);
  stroke(255);
  strokeWeight(2);
  rect(width / 2, btnY + btnH * 1.6, btnW, btnH, 10);
  fill(255);
  noStroke();
  text("Multiplayer", width / 2, btnY + btnH * 1.6 + height * 0.012);

  rectMode(CORNER);
}

// Waiting screen works for both modes
// In singleplayer its just the title screen like before
// In multiplayer it shows how many players have connected so far
function drawWaitingScreen() {
  drawBird();

  fill(30, 30, 80);
  stroke(255);
  strokeWeight(3);
  textAlign(CENTER);

  if (gameMode === "single") {
    textSize(34);
    text("Flappy Bird", width / 2, height / 2 - 100);
    fill(255);
    stroke(0);
    strokeWeight(2);
    textSize(16);
    text("Fly through the cloud gaps!", width / 2, height / 2);
    text("SPACE or CLICK to flap", width / 2, height / 2 + 30);
  } 
  else {
    // Multiplayer lobby shows connected players and their colored birds
    textSize(width * 0.04);
    text("Forest Flyer", width / 2, height * 0.3);
    fill(255);
    stroke(0);
    strokeWeight(2);
    textSize(width * 0.022);

    // Show player count so everyone knows how many have joined
    let playerCount = shared ? partyGetAll().length : 1;
    text("Players connected: " + playerCount + " / 5", width / 2, height * 0.45);
    text("SPACE or CLICK to start!", width / 2, height * 0.52);

    // Draw a small colored bird for each connected player so you can see whos in
    for (let i = 0; i < playerCount; i++) {
      let c = playerColors[i];
      tint(c[0], c[1], c[2]);
      imageMode(CENTER);
      image(birdImg, width / 2 + (i - 2) * birds[0].size * 2, height * 0.62, birds[0].size, birds[0].size);
      noTint();
    }
  }
}

// Updates all game objects each frame
function updateGame() {
  // Bird physics same for both modes
  if (gameMode === "single") {
    birds[0].velocity += gravity;
    birds[0].y += birds[0].velocity;
  } else {
    // In multiplayer I update my own me object instead of birds[0]
    if (me && !me.isDead) {
      me.velocity += gravity;
      me.y += me.velocity;
    }
  }

  // Get the right pillar array depending on mode
  let pillars = gameMode === "multi" && shared ? shared.pillars : cloudPillars;

  // Only the host moves pillars and scores in multiplayer
  let canMovePillars = gameMode === "single" || (gameMode === "multi" && partyIsHost());

  if (canMovePillars) {
    for (let i = 0; i < pillars.length; i++) {
      let currentSpeed = cloudSpeed * (1 + (gameMode === "multi" ? shared.score : score) * 0.04);
      pillars[i].x -= currentSpeed;

      // When pillar goes off screen move it to the end
      if (pillars[i].x < -pillarWidth) {
        let maxX = 0;
        for (let j = 0; j < pillars.length; j++) {
          if (pillars[j].x > maxX) {
            maxX = pillars[j].x;
          }
        }
        pillars[i].x = maxX + pillarSpacing;
        pillars[i].gapY = random(height * 0.3, height * 0.7);

        // Scoring logic (Fixed nesting here)
        if (gameMode === "single") {
          score++;
          if (random(1) < 0.15) {
            isFlipped = !isFlipped;
          }
        } else if (shared) {
          shared.score++;
          if (random(1) < 0.15) {
            shared.isFlipped = !shared.isFlipped;
          }
        }
      }
    }
  }

  // Death checks
  if (gameMode === "single") {
    if (birds[0].y > height - birds[0].size / 2 || birds[0].y < 0) {
      gameState = "dead";
    }
    for (let i = 0; i < cloudPillars.length; i++) {
      if (checkCloudCollision(cloudPillars[i], birds[0].y, birds[0].size)) {
        gameState = "dead";
      }
    }
  } else {
    // In multiplayer I only check death for my own bird
    if (me && !me.isDead) {
      if (me.y > height - birds[0].size / 2 || me.y < 0) {
        me.isDead = true;
        me.finalScore = shared.score;
      }
      for (let i = 0; i < shared.pillars.length; i++) {
        if (checkCloudCollision(shared.pillars[i], me.y, birds[0].size)) {
          me.isDead = true;
          me.finalScore = shared.score;
        }
      }
    }

    // Sync my local gameState from shared so everyone transitions together
    if (shared) {
      gameState = shared.gameState;
    }

    // Host checks if everyone is dead and triggers leaderboard
    if (partyIsHost() && shared) {
      let players = partyGetAll();
      let allDead = players.length > 0 && players.every(p => p.isDead);
      if (allDead) {
        shared.gameState = "leaderboard";
      }
    }
  }
}


// Draws all game objects
function drawGame() {
  let pillars = gameMode === "multi" && shared ? shared.pillars : cloudPillars;

  // Draw all pillars using for loop
  for (let i = 0; i < pillars.length; i++) {
    drawCloudPillar(pillars[i]);
  }

  if (gameMode === "single") {
    drawBird();
  } 
  else {
    // Draw every players bird and dead ones show faded as ghosts so you can still see them
    let players = partyGetAll();
    for (let i = 0; i < players.length; i++) {
      let c = playerColors[players[i].playerIndex];
      let alpha = players[i].isDead ? 80 : 255;
      push();
      translate(birds[0].x, players[i].y);
      let angle = constrain(players[i].velocity * 0.05, -0.5, 0.9);
      rotate(angle);
      imageMode(CENTER);
      tint(c[0], c[1], c[2], alpha);
      image(birdImg, 0, 0, birds[0].size, birds[0].size);
      noTint();
      pop();
    }
  }
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

// Draws any player's bird with their color and position
// Dead birds get passed alpha = 80 so they show as ghosts
function drawPlayerBird(y, velocity, color, alpha) {
  push();
  translate(birds[0].x, y);
  let angle = constrain(velocity * 0.05, -0.5, 0.9);
  rotate(angle);
  imageMode(CENTER);
  tint(color[0], color[1], color[2], alpha);
  image(birdImg, 0, 0, birds[0].size, birds[0].size);
  noTint();
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
function checkCloudCollision(pillar, birdY, birdSize) {
  let topCloudBottom = pillar.gapY - cloudGapHeight / 2;
  let bottomCloudTop = pillar.gapY + cloudGapHeight / 2;
  let hitboxWidth = pillarWidth * 0.80; // It is 0.80 so play doesn't die to edges
  let birdHitbox = birdSize * 0.6; // Bird hitbox is 60% of visual size

  // Check if bird overlaps with pillar horizontally
  let inXRange = birds[0].x + birdHitbox / 2 > pillar.x - hitboxWidth / 2 && birds[0].x - birdHitbox / 2 < pillar.x + hitboxWidth / 2;

  // Check if bird hits top cloud
  let hitsTop = birdY - birdHitbox / 2 < topCloudBottom;

  // Check if bird hits bottom cloud
  let hitsBottom = birdY + birdHitbox / 2 > bottomCloudTop;

  return inXRange && (hitsTop || hitsBottom);
}

// Score display
function drawScore() {
  let currentScore = gameMode === "multi" && shared ? shared.score : score;
  fill(255);
  stroke(0);
  strokeWeight(3);
  textAlign(CENTER);
  textSize(width * 0.04);
  text(currentScore, width / 2, height * 0.08);
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

// Final leaderboard shown in multiplayer when all birds are dead
function drawLeaderboard() {
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER);
  fill(255, 220, 50);
  stroke(150, 100, 0);
  strokeWeight(3);
  textSize(width * 0.05);
  text("GAME OVER", width / 2, height * 0.2);

  // Sort players by finalScore
  let players = partyGetAll().slice();
  players.sort((a, b) => b.finalScore - a.finalScore);

  let medals = ["1st", "2nd", "3rd", "4th", "5th"];

  for (let i = 0; i < players.length; i++) {
    let c = playerColors[players[i].playerIndex];
    let isWinner = i === 0;

    fill(c[0], c[1], c[2]);
    stroke(0);
    strokeWeight(2);
    textSize(isWinner ? width * 0.032 : width * 0.025);

    let label = medals[i] + " Player " + (players[i].playerIndex + 1) +" — " + players[i].finalScore + " pts" + (isWinner ? "  👑 WINNER" : "");

    text(label, width / 2, height * 0.35 + i * height * 0.09);
  }

  fill(255);
  noStroke();
  textSize(width * 0.022);
  text("Host press R to play again", width / 2, height * 0.85);
}

// Makes bird jump
function flap() {
  if (gameMode === "single") {
    if (gameState === "waiting") {
      gameState = "playing";
    }
    if (gameState === "playing") {
      birds[0].velocity = birds[0].flapStrength;
    }
  }
  else {
    // In multiplayer, anyone can start the game from the waiting screen
    if (shared && shared.gameState === "waiting") {
      shared.gameState = "playing";
      // Copy pillars into shared so everyone sees the same ones
      if (partyIsHost()) {
        shared.pillars = cloudPillars.slice();
      }
    }
    if (me && !me.isDead) {
      me.velocity = birds[0].flapStrength;
    }
  }
}

// Resets game
function resetGame() {
  if (gameMode === "single") {
    isFlipped = false;
    birds[0].y = height / 2;
    birds[0].velocity = 0;
    score = 0;
    gameState = "waiting";
    // Recreate all pillars
    createPillars();
  }
  else {
    // Only host resets shared state so it doesn't conflict
    if (partyIsHost()) {
      shared.score = 0;
      shared.isFlipped = false;
      shared.gameState = "waiting";
      createPillars();
      shared.pillars = cloudPillars.slice();
    }
    // Everyone resets their own bird
    me.y = height / 2;
    me.velocity = 0;
    me.isDead = false;
    me.finalScore = 0;
    gameState = "waiting";
  }
}

// Mouse interaction
function mousePressed() {
  if (gameState === "menu") {
    handleMenuClick();
    return;
  }
  flap();
}

// Checks which button was clicked on the menu screen
function handleMenuClick() {
  let btnW = width * 0.25;
  let btnH = height * 0.08;
  let btnY = height * 0.5;

  // Single player button
  if (mouseX > width / 2 - btnW / 2 && mouseX < width / 2 + btnW / 2 && mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2) {
    gameMode = "single";
    gameState = "waiting";
    return;
  }

  // Multiplayer button
  let multiY = btnY + btnH * 1.6;
  if (mouseX > width / 2 - btnW / 2 && mouseX < width / 2 + btnW / 2 && mouseY > multiY - btnH / 2 && mouseY < multiY + btnH / 2) {
    gameMode = "multi";
    connectMultiplayer();
    gameState = "waiting";
    return;
  }
}

// Keyboard interaction
function keyPressed() {
  if (key === ' ') {
    if (gameState === "menu") return;  // Space doesn't do anything on menu
    flap();
  }
  if ((key === 'r' || key === 'R') && (gameState === "dead" || gameState === "leaderboard")) {
    // In multiplayer only host can restart
    if (gameMode === "multi" && !partyIsHost()) return;
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