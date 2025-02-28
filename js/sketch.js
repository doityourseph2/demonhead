let capture;
let handTracking;
let drumMachine;
let debugPanel;
let balls = [];

// Keyboard control variables
let selectedBall = -1;
let keyboardX = 0;
let keyboardY = 0;
const KEYBOARD_SPEED = 5;

// Performance optimization: Cache frequently accessed values
let lastFrameTime = 0;
let frameInterval = 1000 / 60; // Target 60 FPS
let needsNewBall = false;

function preload() {
    // Preload any necessary assets
}

async function setup() {
    createCanvas(CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
    frameRate(60);
    
    // Setup video capture
    capture = createCapture(VIDEO);
    capture.size(640, 480);
    capture.hide();
    
    // Initialize systems
    handTracking = new HandTracking();
    drumMachine = new DrumMachine();
    debugPanel = new DebugPanel(drumMachine, handTracking);
    
    // Setup world physics
    world.gravity.y = CONFIG.PHYSICS.GRAVITY;
    
    // Create boundary walls
    new Sprite(0, height/2, 10, height, 'static');
    new Sprite(width, height/2, 10, height, 'static');
    new Sprite(width/2, height, width, 10, 'static');
    
    // Initial ball spawn
    spawnBalls();
    
    // Initialize keyboard control position
    keyboardX = width / 2;
    keyboardY = height / 2;
}

function spawnBalls() {
    const currentTime = millis();
    if (currentTime - lastFrameTime < frameInterval) return;
    
    while (balls.length < CONFIG.BALLS.COUNT) {
        const x = random(100, width - 100);
        const y = random(200, height/2);
        const instrument = random(CONFIG.BALLS.INSTRUMENTS);
        balls.push(new Ball(x, y, instrument));
    }
    lastFrameTime = currentTime;
}

function draw() {
    // Performance optimization: Skip frames if needed
    const currentTime = millis();
    if (currentTime - lastFrameTime < frameInterval) return;
    lastFrameTime = currentTime;
    
    background(20);
    
    // Update hand tracking
    const hand = handTracking.getHandPosition();
    
    // Update keyboard controls
    if (debugPanel.settings.keyboardControls) {
        updateKeyboardControls();
    }
    
    // Update and draw drum machine
    drumMachine.update();
    drumMachine.draw();
    
    // Handle ball grabbing
    if (hand.isGrabbing) {
        // Try to grab the nearest ball within range
        let nearestBall = null;
        let nearestDist = Infinity;
        
        // Performance optimization: Use for loop instead of forEach
        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];
            if (ball.isGrabbed) continue; // Skip already grabbed balls
            
            const dx = hand.x - ball.sprite.x;
            const dy = hand.y - ball.sprite.y;
            const d = sqrt(dx * dx + dy * dy);
            
            if (d < CONFIG.HAND_TRACKING.INTERACTION_RADIUS && d < nearestDist) {
                nearestDist = d;
                nearestBall = ball;
            }
        }
        
        if (nearestBall && !nearestBall.isGrabbed) {
            nearestBall.tryGrab(hand.x, hand.y);
        }
    }
    
    // Update and draw balls
    needsNewBall = false;
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        if (ball.update(hand.x, hand.y, hand.isGrabbing)) {
            ball.remove();
            balls.splice(i, 1);
            needsNewBall = true;
        } else {
            ball.draw();
        }
    }
    
    // Spawn new balls only if needed
    if (needsNewBall) {
        spawnBalls();
    }
    
    // Draw hand tracking visualization
    handTracking.draw();
    
    // Draw keyboard control indicator
    if (debugPanel.settings.keyboardControls) {
        drawKeyboardControls();
    }
    
    // Draw debug info
    debugPanel.draw();
}

function updateKeyboardControls() {
    if (keyIsDown(LEFT_ARROW)) keyboardX -= KEYBOARD_SPEED;
    if (keyIsDown(RIGHT_ARROW)) keyboardX += KEYBOARD_SPEED;
    if (keyIsDown(UP_ARROW)) keyboardY -= KEYBOARD_SPEED;
    if (keyIsDown(DOWN_ARROW)) keyboardY += KEYBOARD_SPEED;
    
    // Keep within bounds
    keyboardX = constrain(keyboardX, 0, width);
    keyboardY = constrain(keyboardY, 0, height);
}

function drawKeyboardControls() {
    push();
    stroke(255, 255, 0);
    noFill();
    circle(keyboardX, keyboardY, 30);
    
    if (selectedBall !== -1) {
        fill(255, 255, 0, 100);
        circle(keyboardX, keyboardY, 40);
    }
    pop();
}

function keyPressed() {
    if (debugPanel.settings.keyboardControls) {
        if (key === ' ') {
            // Find closest ball to keyboard position
            let closestDist = Infinity;
            let closestIndex = -1;
            
            balls.forEach((ball, index) => {
                const d = dist(keyboardX, keyboardY, ball.sprite.x, ball.sprite.y);
                if (d < closestDist && d < CONFIG.BALLS.SIZE) {
                    closestDist = d;
                    closestIndex = index;
                }
            });
            
            if (closestIndex !== -1) {
                selectedBall = closestIndex;
                balls[selectedBall].tryGrab(keyboardX, keyboardY);
            }
        }
    }
}

function keyReleased() {
    if (debugPanel.settings.keyboardControls) {
        if (key === ' ') {
            selectedBall = -1;
        }
    }
}

// Prevent touch events from interfering with the canvas
function touchStarted() {
    return false;
}

function touchMoved() {
    return false;
}

function touchEnded() {
    return false;
} 