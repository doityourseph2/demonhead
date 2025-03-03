let video;
let handPose; let hands = [];
let balls;
let gui;
let drumMachine;
let boundaries;

// Add debug state tracking
let debugState = {
	boundariesInitialized: false,
	setupComplete: false,
	errors: [],
	lastError: null,
	boundaryCount: 0
};

// Instrument definitions
const INSTRUMENTS = [
	{ name: 'aliensynth', emoji: '👽', color: 'rgba(147, 51, 234, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'basedrums', emoji: '🥁', color: 'rgba(220, 38, 38, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'bollytrap', emoji: '🪘', color: 'rgba(234, 179, 8, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'clubdrums', emoji: '🎧', color: 'rgba(34, 197, 94, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'clubsynth', emoji: '🎹', color: 'rgba(59, 130, 246, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'melody', emoji: '🎵', color: 'rgba(236, 72, 153, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'piano2', emoji: '🎼', color: 'rgba(14, 165, 233, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'siren', emoji: '🚨', color: 'rgba(249, 115, 22, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'tambourine', emoji: '🔔', color: 'rgba(168, 85, 247, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'technobass', emoji: '💫', color: 'rgba(139, 92, 246, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'typicaltrapA', emoji: '🎪', color: 'rgba(20, 184, 166, 0.8)', sound: null, spawnWeight: 1 },
	{ name: 'typicaltrapB', emoji: '🌟', color: 'rgba(245, 158, 11, 0.8)', sound: null, spawnWeight: 1 }
];

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
	ballFriction: 0.5,
	ballDrag: 0.5,
	
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
	
	// Drum machine settings
	bpm: 120,
	beatWidth: 600,
	beatHeight: 100,
	loopDuration: 4, // seconds per loop
	beatSegments: 16,
	beatLineColor: '#ff0000',
	beatLineWidth: 2,
	showBeatGrid: true,
	beatGridOpacity: 0.8,
	
	// Ball throw detection
	throwVelocityThreshold: 10,
	leftThrowZone: 100,  // pixels from left edge
	rightThrowZone: 100,  // pixels from right edge
	throwZoneHeight: 600, // height of throw zones from top
	throwZoneY: 300,       // Y offset from top
	throwZoneColor: 'rgba(255, 0, 0, 0.2)', // Visual indicator for throw zones
	showThrowZones: true,
	showThrowZoneOutline: true, // Show border around throw zones
	
	// Visual feedback
	showInstrumentLabels: true,
	instrumentLabelSize: 14,
	
	// Boundary Debug
	debugMode: true,
	logErrors: true,
	showDebugInfo: true,
	autoRetryOnError: true,
	maxRetries: 3,
	retryDelay: 500,
	
	// Actions
	resetBalls: function() {
		resetBallPositions();
	},
	clearInstruments: function() {
		if (drumMachine) {
			drumMachine.activeInstruments.clear();
		}
	},
	resetBoundaries: function() {
		initializeBoundaries(true);
	},
	clearErrors: function() {
		debugState.errors = [];
		debugState.lastError = null;
	}
};

// Track which balls are being held
let heldBalls = new Map();  // Map to store held balls and their hold time

// Add spawn position tracking
let availableSpawnPositions = [];

function initializeSpawnPositions() {
	availableSpawnPositions = [];
	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) {
			availableSpawnPositions.push({
				x: width * settings.gridOffsetX + (i * width * settings.gridSpacingX),
				y: height * settings.gridOffsetY + (j * height * settings.gridSpacingY)
			});
		}
	}
}

function getRandomInstrument() {
	const totalWeight = INSTRUMENTS.reduce((sum, inst) => sum + inst.spawnWeight, 0);
	let random = Math.random() * totalWeight;
	
	for (let instrument of INSTRUMENTS) {
		random -= instrument.spawnWeight;
		if (random <= 0) return instrument;
	}
	return INSTRUMENTS[0];
}

function spawnSingleBall(position = null) {
	// If no position provided, get a random available position
	if (!position && availableSpawnPositions.length > 0) {
		const randomIndex = Math.floor(Math.random() * availableSpawnPositions.length);
		position = availableSpawnPositions.splice(randomIndex, 1)[0];
	}
	
	if (position) {
		const instrument = getRandomInstrument();
		let ball = new balls.Sprite(position.x, position.y);
		ball.instrument = instrument;
		ball.color = instrument.color; // Use instrument color for ball
		ball.text = instrument.emoji;
		noStroke();
		ball.textSize = settings.ballDiameter * 0.5;
		ball.textColor = 'white'; // Make emoji white for better visibility
		return ball;
	}
	return null;
}

function setupGUI() {
	gui = new dat.GUI();
	
	// Camera Controls
	let cameraFolder = gui.addFolder('Camera');
	cameraFolder.add(settings, 'cameraX', -width, width).name('Position X');
	cameraFolder.add(settings, 'cameraY', -height, height).name('Position Y');
	cameraFolder.add(settings, 'cameraScale', 0.1, 2).name('Scale');
	
	// Ball Physics
	let physicsFolder = gui.addFolder('Physics');
	physicsFolder.add(settings, 'gravityY', -20, 20).name('Gravity');
	physicsFolder.add(settings, 'ballBounciness', 0, 1).name('Bounce');
	physicsFolder.add(settings, 'ballFriction', 0, 1).name('Friction');
	physicsFolder.add(settings, 'ballDrag', 0, 1).name('Air Resistance');
	
	// Visual Settings
	let visualFolder = gui.addFolder('Visual Settings');
	visualFolder.add(settings, 'ballDiameter', 40, 200).name('Ball Size');
	visualFolder.add(settings, 'instrumentLabelSize', 20, 60).name('Emoji Size');
	visualFolder.add(settings, 'showInstrumentLabels').name('Show Labels');
	visualFolder.add(settings, 'showBoundaries').name('Show Walls');
	
	// Spawn Settings
	let spawnFolder = gui.addFolder('Spawn Settings');
	spawnFolder.add(settings, 'gridOffsetX', 0, 1).name('Grid X Offset');
	spawnFolder.add(settings, 'gridOffsetY', 0, 1).name('Grid Y Offset');
	spawnFolder.add(settings, 'gridSpacingX', 0.1, 0.5).name('X Spacing');
	spawnFolder.add(settings, 'gridSpacingY', 0.1, 0.5).name('Y Spacing');
	
	// Pinch Controls
	let pinchFolder = gui.addFolder('Pinch Controls');
	pinchFolder.add(settings, 'pinchThreshold', 20, 100).name('Grab Distance');
	pinchFolder.add(settings, 'releaseThreshold', 50, 200).name('Release Distance');
	pinchFolder.add(settings, 'pinchRadius', 20, 150).name('Grab Radius');
	pinchFolder.add(settings, 'pinchForce', 0.5, 1).name('Grab Strength');
	pinchFolder.add(settings, 'pinchSmoothing', 0.1, 1).name('Movement Smooth');
	
	// Throw Zones
	let throwFolder = gui.addFolder('Throw Zones');
	throwFolder.add(settings, 'leftThrowZone', 50, 200).name('Left Width');
	throwFolder.add(settings, 'rightThrowZone', 50, 200).name('Right Width');
	throwFolder.add(settings, 'throwZoneHeight', 100, 1000).name('Height');
	throwFolder.add(settings, 'throwZoneY', 0, 1000).name('Y Position');
	throwFolder.add(settings, 'showThrowZones').name('Show Zones');
	throwFolder.add(settings, 'showThrowZoneOutline').name('Show Borders');
	throwFolder.addColor(settings, 'throwZoneColor').name('Zone Color');
	
	// Beat Visualization
	let beatFolder = gui.addFolder('Beat Display');
	beatFolder.add(settings, 'bpm', 60, 200).name('BPM');
	beatFolder.add(settings, 'beatWidth', 300, 800).name('Grid Width');
	beatFolder.add(settings, 'beatHeight', 50, 200).name('Grid Height');
	beatFolder.add(settings, 'beatSegments', 4, 32).step(4).name('Segments');
	beatFolder.addColor(settings, 'beatLineColor').name('Line Color');
	beatFolder.add(settings, 'beatLineWidth', 1, 5).name('Line Width');
	beatFolder.add(settings, 'showBeatGrid').name('Show Grid');
	beatFolder.add(settings, 'beatGridOpacity', 0, 1).name('Grid Opacity');
	
	// Actions
	let actionsFolder = gui.addFolder('Actions');
	actionsFolder.add(settings, 'resetBalls').name('Reset Balls');
	actionsFolder.add(settings, 'clearInstruments').name('Clear All Loops');
	actionsFolder.add(settings, 'resetBoundaries').name('Reset Boundaries');
	actionsFolder.add(settings, 'clearErrors').name('Clear Errors');
	
	// Debug
	let debugFolder = gui.addFolder('Debug');
	debugFolder.add(settings, 'debugMode').name('Debug Mode');
	debugFolder.add(settings, 'logErrors').name('Log Errors');
	debugFolder.add(settings, 'showDebugInfo').name('Show Info');
	debugFolder.add(settings, 'autoRetryOnError').name('Auto Retry');
	debugFolder.add(settings, 'maxRetries', 1, 5).step(1).name('Max Retries');
	debugFolder.add(settings, 'retryDelay', 100, 2000).name('Retry Delay');
	
	// Open important folders by default
	visualFolder.open();
	throwFolder.open();
	beatFolder.open();
	actionsFolder.open();
}

function resetBallPositions() {
	// Remove existing balls
	for (let ball of balls) {
		ball.remove();
	}
	
	// Reset spawn positions
	initializeSpawnPositions();
	
	// Create initial set of balls
	for (let i = 0; i < 9; i++) {
		spawnSingleBall();
	}
}

function preload() {
	// Load the handPose model
	handPose = ml5.handPose({ flipped: true });

	// Create the webcam video and hide it
	video = createCapture(VIDEO);
	video.hide();

	// Load loop sounds
	INSTRUMENTS.forEach(inst => {
		try {
			inst.sound = loadSound(`loops/${inst.name}140bpm.mp3`);
			// Configure the sound as a loop
			if (inst.sound) {
				inst.sound.setLoop(true);
			}
		} catch (error) {
			console.warn(`Could not load loop for ${inst.name}:`, error);
		}
	});
}

function setup() {
	createCanvas(video.width, video.height);
	displayMode(MAXED);
	imageMode(CENTER);

	world.gravity.y = settings.gravityY;
	drumMachine = new DrumMachine();

	// Initialize boundaries first
	if (!initializeBoundaries()) {
		console.error('Failed to initialize boundaries');
	}

	// Create balls group
	balls = new Group();
	balls.diameter = settings.ballDiameter;
	balls.bounciness = settings.ballBounciness;
	balls.friction = settings.ballFriction;
	balls.drag = settings.ballDrag;
	
	updateBoundaries();
	setupGUI();
	resetBallPositions();
	
	handPose.detectStart(video, gotHands);
	debugState.setupComplete = true;
}

function updateBoundaries() {
	try {
		// Ensure boundaries are initialized
		if (!debugState.boundariesInitialized) {
			if (!initializeBoundaries()) {
				return;
			}
		}
		
		// Safely remove existing boundaries
		if (boundaries && boundaries.length > 0) {
			boundaries.forEach(boundary => {
				if (boundary && boundary.remove) {
					boundary.remove();
				}
			});
		}
		
		if (settings.showBoundaries) {
			const boundarySprites = [
				// Bottom
				{
					x: width/2,
					y: height - settings.boundaryOffset,
					w: width,
					h: settings.boundaryThickness
				},
				// Left
				{
					x: settings.boundaryOffset,
					y: height/2,
					w: settings.boundaryThickness,
					h: height
				},
				// Right
				{
					x: width - settings.boundaryOffset,
					y: height/2,
					w: settings.boundaryThickness,
					h: height
				},
				// Top
				{
					x: width/2,
					y: settings.boundaryOffset,
					w: width,
					h: settings.boundaryThickness
				}
			];
			
			// Create new boundary sprites
			boundarySprites.forEach(config => {
				try {
					new boundaries.Sprite(config.x, config.y, config.w, config.h);
					debugState.boundaryCount++;
				} catch (error) {
					handleError('Boundary Sprite Creation Error', error);
				}
			});
		}
	} catch (error) {
		handleError('Update Boundaries Error', error);
	}
}

// Initialize boundaries with error handling
function initializeBoundaries(forceReset = false) {
	try {
		if (forceReset && boundaries) {
			if (boundaries.removeAll) {
				boundaries.removeAll();
			}
		}
		
		// Create boundaries group if it doesn't exist
		if (!boundaries) {
			boundaries = new Group();
			debugState.boundariesInitialized = true;
		}
		
		// Set up boundaries properties
		boundaries.collider = 'static';
		boundaries.color = 'skyblue';
		
		// Update debug state
		debugState.boundaryCount = 0;
		
		return true;
	} catch (error) {
		handleError('Boundary Initialization Error', error);
		return false;
	}
}

// Error handling function
function handleError(context, error) {
	const errorInfo = {
		context: context,
		message: error.message,
		timestamp: Date.now(),
		stack: error.stack
	};
	
	debugState.lastError = errorInfo;
	debugState.errors.push(errorInfo);
	
	if (settings.logErrors) {
		console.error(`${context}:`, error);
	}
	
	// Auto-retry logic
	if (settings.autoRetryOnError && debugState.errors.length <= settings.maxRetries) {
		setTimeout(() => {
			console.log(`Retrying... Attempt ${debugState.errors.length} of ${settings.maxRetries}`);
			initializeBoundaries(true);
		}, settings.retryDelay);
	}
}

function draw() {
	clear();
	push();
	translate(settings.cameraX, settings.cameraY);
	scale(settings.cameraScale);
	
	image(video, width/2, height/2, width, height);

	// Update and draw drum machine
	drumMachine.update();
	drumMachine.draw();

	// Handle ball throws and instrument activation
	for (let ball of balls) {

		 // Apply damping effect to ball's velocity
        ball.vel.x *= 0.98; // Damping factor for x velocity
        ball.vel.y *= 0.98; // Damping factor for y velocity

		// Draw instrument emoji on ball
		push();
		fill(ball.textColor);
		textSize(settings.ballDiameter * 0.5);
		textAlign(CENTER, CENTER);
		text(ball.text, ball.x, ball.y);
		pop();

		// Check for throws with Y-position constraint
		let inThrowZoneY = ball.y >= settings.throwZoneY && 
						  ball.y <= settings.throwZoneY + settings.throwZoneHeight;

		if (inThrowZoneY) {
			let wasThrown = false;
			let loops = 0;
			
			if (ball.x < settings.leftThrowZone) {
				loops = 16; // Increased to 16 loops for left side
				wasThrown = true;
			} else if (ball.x > width - settings.rightThrowZone) {
				loops = 4; // Changed to 4 loops for right side
				wasThrown = true;
			}
			
			if (wasThrown) {
				// Add instrument to drum machine before removing ball
				drumMachine.addInstrument(ball.instrument, loops);
				
				// Remove the ball
				ball.remove();
				
				// Spawn a new ball after a short delay
				setTimeout(() => {
					const newPosition = {
						x: width * settings.gridOffsetX + (Math.floor(Math.random() * 3) * width * settings.gridSpacingX),
						y: height * settings.gridOffsetY + (Math.floor(Math.random() * 3) * height * settings.gridSpacingY)
					};
					spawnSingleBall(newPosition);
				}, 500);
			}
		}
	}

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

class DrumMachine {
	constructor() {
		this.currentBeat = 0;
		this.totalBeats = 32;
		this.activeInstruments = new Map();
		this.lastUpdateTime = 0;
		this.beatInterval = (60 / settings.bpm) * 1000 / 2;
	}

	addInstrument(instrument, loops) {
		// If the instrument is already playing, extend its loops instead of restarting
		if (this.activeInstruments.has(instrument.name)) {
			const existing = this.activeInstruments.get(instrument.name);
			
			// Calculate remaining loops for the current instance
			const currentTime = millis();
			const loopDuration = (60 / 140) * 4 * 1000; // Duration of one loop at 140 BPM
			const elapsedTime = currentTime - existing.startTime;
			const elapsedLoops = Math.floor(elapsedTime / loopDuration);
			const remainingLoops = existing.remainingLoops - elapsedLoops;
			
			// Add new loops to the remaining loops
			existing.remainingLoops = remainingLoops + loops;
			
			// Don't restart the sound since it's already playing
			return;
		}
		
		// If it's a new instrument, start playing it
		if (instrument.sound && instrument.sound.isLoaded()) {
			instrument.sound.play();
		}
		
		// Store the instrument with its loop count
		this.activeInstruments.set(instrument.name, {
			instrument: instrument,
			remainingLoops: loops,
			startTime: millis()
		});
	}

	update() {
		let currentTime = millis();
		
		// Check for loops that need to end
		for (let [name, data] of this.activeInstruments.entries()) {
			const loopDuration = (60 / 140) * 4 * 1000; // Duration of one loop at 140 BPM
			const elapsedLoops = Math.floor((currentTime - data.startTime) / loopDuration);
			
			if (elapsedLoops >= data.remainingLoops) {
				if (data.instrument.sound && data.instrument.sound.isLoaded()) {
					data.instrument.sound.stop();
				}
				this.activeInstruments.delete(name);
			}
		}
		
		// Update beat counter for visualization
		if (currentTime - this.lastUpdateTime >= this.beatInterval) {
			this.currentBeat = (this.currentBeat + 1) % this.totalBeats;
			this.lastUpdateTime = currentTime;
		}
	}

	draw() {
		push();
		// Draw throw zones if enabled
		if (settings.showThrowZones) {
			push();
			fill(settings.throwZoneColor);
			if (settings.showThrowZoneOutline) {
				stroke(255);
				strokeWeight(1);
			} else {
				noStroke();
			}
			// Left zone
			rect(0, settings.throwZoneY, 
				 settings.leftThrowZone, 
				 settings.throwZoneHeight);
			// Right zone
			rect(width - settings.rightThrowZone, 
				 settings.throwZoneY,
				 settings.rightThrowZone, 
				 settings.throwZoneHeight);
			pop();
		}

		// Draw beat segments
		let segmentWidth = settings.beatWidth / 4;
		let x = (width - settings.beatWidth) / 2;
		let y = 50;

		if (settings.showBeatGrid) {
			// Draw segment backgrounds with configurable opacity
			for (let i = 0; i < 4; i++) {
				fill(i % 2 === 0 ? `rgba(42, 42, 42, ${settings.beatGridOpacity})` 
								: `rgba(26, 26, 26, ${settings.beatGridOpacity})`);
				rect(x + (i * segmentWidth), y, segmentWidth, settings.beatHeight);
			}
		}

		// Draw beat line with configured color and width
		stroke(settings.beatLineColor);
		strokeWeight(settings.beatLineWidth);
		let beatX = x + (this.currentBeat * (settings.beatWidth / this.totalBeats));
		line(beatX, y, beatX, y + settings.beatHeight);

		// Draw active instruments
		if (settings.showInstrumentLabels) {
			let instrumentY = y + 20;
			for (let [name, data] of this.activeInstruments) {
				let instrument = data.instrument;
				textSize(settings.instrumentLabelSize);
				textAlign(CENTER, CENTER);
				fill(instrument.color);
				
				// Calculate remaining time for this loop
				const currentTime = millis();
				const loopDuration = (60 / 140) * 4 * 1000; // Duration of one loop at 140 BPM
				const elapsedTime = currentTime - data.startTime;
				const remainingLoops = data.remainingLoops - Math.floor(elapsedTime / loopDuration);
				
				// Show instrument emoji and remaining loops
				text(instrument.emoji, x + 20, instrumentY);
				textAlign(LEFT, CENTER);
				text(` × ${remainingLoops}`, x + 40, instrumentY);
				
				instrumentY += 25;
			}
		}
		pop();
	}
}
