let video;
let handPose; let hands = [];
let balls;
let gui;
let settings = {
	// Camera settings
	cameraX: 0,
	cameraY: 0,
	cameraScale: 1,
	
	// Boundary settings
	boundaryThickness: 20,
	boundaryOffset: 10,
	
	// Ball settings
	ballDiameter: 80,
	ballBounciness: 0.3,
	ballFriction: 0.1,
	ballDrag: 0.1,
	
	// Grid settings
	gridOffsetX: 0.25,
	gridOffsetY: 0.25,
	gridSpacingX: 0.25,
	gridSpacingY: 0.25,
	
	// Physics
	gravityY: 10,
	
	// Debug
	showBoundaries: true,
	
	// Pinch mechanics
	pinchThreshold: 50,      // Distance to trigger pinch
	releaseThreshold: 150,   // Distance to release pinch
	stickyness: 0.95,       // How strongly balls stick (0-1)
	pinchForce: 0.9,        // How strongly balls move to pinch point
	pinchRadius: 80,        // How close to pinch point to grab balls
	pinchSmoothing: 0.1,    // Smooth ball movement (0-1)
	
	// Actions
	resetBalls: function() {
		resetBallPositions();
	}
};

// Track which balls are being held
let heldBalls = new Map();  // Map to store held balls and their hold time

function setupGUI() {
	gui = new dat.GUI();
	
	// All debug options in one folder
	let debugFolder = gui.addFolder('Boundary Debug');
	debugFolder.add(settings, 'cameraX', -width, width).name('Camera X');
	debugFolder.add(settings, 'cameraY', -height, height).name('Camera Y');
	debugFolder.add(settings, 'cameraScale', 0.1, 2).name('Camera Scale');
	debugFolder.add(settings, 'boundaryThickness', 5, 50).name('Wall Thickness');
	debugFolder.add(settings, 'boundaryOffset', -100, 100).name('Wall Offset');
	debugFolder.add(settings, 'ballDiameter', 10, 100).name('Ball Size');
	debugFolder.add(settings, 'ballBounciness', 0, 1).name('Bounce');
	debugFolder.add(settings, 'ballFriction', 0, 1).name('Friction');
	debugFolder.add(settings, 'ballDrag', 0, 1).name('Air Resistance');
	debugFolder.add(settings, 'gridOffsetX', 0, 1).name('Spawn X');
	debugFolder.add(settings, 'gridOffsetY', 0, 1).name('Spawn Y');
	debugFolder.add(settings, 'gravityY', -20, 20).name('Gravity');
	debugFolder.add(settings, 'showBoundaries').name('Show Walls');
	
	// New pinch mechanics controls
	let pinchFolder = gui.addFolder('Pinch Controls');
	pinchFolder.add(settings, 'pinchThreshold', 20, 100).name('Grab Distance');
	pinchFolder.add(settings, 'releaseThreshold', 50, 200).name('Release Distance');
	pinchFolder.add(settings, 'stickyness', 0.5, 1).name('Stickyness');
	pinchFolder.add(settings, 'pinchForce', 0.5, 1).name('Grab Strength');
	pinchFolder.add(settings, 'pinchRadius', 20, 100).name('Grab Radius');
	pinchFolder.add(settings, 'pinchSmoothing', 0.5, 1).name('Movement Smooth');
	
	// Actions at bottom
	gui.add(settings, 'resetBalls').name('Reset Balls');
	
	// Open folders by default
	debugFolder.open();
	pinchFolder.open();
}

function resetBallPositions() {
	// Remove existing balls
	for (let ball of balls) {
		ball.remove();
	}
	
	// Recreate balls with current settings
	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) {
			new balls.Sprite(
				width * settings.gridOffsetX + (i * width * settings.gridSpacingX),
				height * settings.gridOffsetY + (j * height * settings.gridSpacingY)
			);
		}
	}
}

function preload() {
	// Load the handPose model
	handPose = ml5.handPose({ flipped: true });

	// Create the webcam video and hide it
	video = createCapture(VIDEO);
	video.hide();
}

function setup() {
	createCanvas(video.width, video.height);
	displayMode(MAXED);
	imageMode(CENTER);

	world.gravity.y = settings.gravityY;

	// Create proper boundary boxes
	boundaries = new Group();
	boundaries.collider = 'static';
	boundaries.color = 'skyblue';

	// Create balls group
	balls = new Group();
	balls.color = 'purple';
	
	updateBoundaries();
	setupGUI();
	
	// start detecting hands from the webcam video
	handPose.detectStart(video, gotHands);
}

function updateBoundaries() {
	// Remove existing boundaries
	for (let boundary of boundaries) {
		boundary.remove();
	}
	
	if (settings.showBoundaries) {
		// Bottom
		new boundaries.Sprite(
			width/2,
			height - settings.boundaryOffset,
			width,
			settings.boundaryThickness
		);
		
		// Left
		new boundaries.Sprite(
			settings.boundaryOffset,
			height/2,
			settings.boundaryThickness,
			height
		);
		
		// Right
		new boundaries.Sprite(
			width - settings.boundaryOffset,
			height/2,
			settings.boundaryThickness,
			height
		);
		
		// Top
		new boundaries.Sprite(
			width/2,
			settings.boundaryOffset,
			width,
			settings.boundaryThickness
		);
	}
}

function draw() {
	clear();
	push();
	translate(settings.cameraX, settings.cameraY);
	scale(settings.cameraScale);
	
	// Update physics settings
	world.gravity.y = settings.gravityY;
	balls.diameter = settings.ballDiameter;
	balls.bounciness = settings.ballBounciness;
	balls.friction = settings.ballFriction;
	balls.drag = settings.ballDrag;
	
	image(video, width/2, height/2, width, height);

	if (hands.length > 0) {
		for (let i = 0; i < hands.length; i++) {
			let hand = hands[i];
			let index = hand.index_finger_tip;
			let thumb = hand.thumb_tip;

			let d = dist(index.x, index.y, thumb.x, thumb.y);
			let pinchX = (index.x + thumb.x) / 2;
			let pinchY = (index.y + thumb.y) / 2;
			
			// Handle pinching mechanics
			if (d < settings.pinchThreshold) {
				fill(0);
				// Check for new balls to grab
				for (let ball of balls) {
					let ballDist = dist(pinchX, pinchY, ball.x, ball.y);
					if (ballDist < settings.pinchRadius) {
						if (!heldBalls.has(ball)) {
							heldBalls.set(ball, frameCount); // Start tracking this ball
						}
						
						// Calculate hold duration factor
						let holdDuration = frameCount - heldBalls.get(ball);
						let holdFactor = min(holdDuration / 30, 1); // Max effect after 30 frames
						
						// Apply stronger movement for longer-held balls
						let strength = settings.pinchForce * (1 + holdFactor);
						ball.moveTowards(pinchX, pinchY, strength);
						
						// Apply smoothing based on hold duration
						let smoothing = settings.pinchSmoothing * (1 + holdFactor * 0.5);
						ball.vel.x *= smoothing;
						ball.vel.y *= smoothing;
					}
				}
			} else if (d > settings.releaseThreshold) {
				// Only fully release when fingers are far apart
				heldBalls.clear();
				fill(255);
			}
			
			noStroke();
			circle(index.x, index.y, 16);
			circle(thumb.x, thumb.y, 16);
		}
	}

	// Draw all the tracked hand points
	for (let i = 0; i < hands.length; i++) {
		let hand = hands[i];
		for (let j = 0; j < hand.keypoints.length; j++) {
			let keypoint = hand.keypoints[j];
			if (hand.handedness == "Left") {
				fill(255, 0, 255);
			} else {
				fill(255, 255, 0);
			}
			noStroke();
			circle(keypoint.x, keypoint.y, 10);
		}
	}
	
	pop();
}

// Callback function for when handPose outputs data
function gotHands(results) {
	// save the output to the hands variable
	hands = results;
}
