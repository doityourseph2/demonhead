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
	{ name: 'kick', emoji: '🥁', color: '#FF4136', sound: null, spawnWeight: 1 },
	{ name: 'snare', emoji: '🪘', color: '#FF851B', sound: null, spawnWeight: 1 },
	{ name: 'hihat', emoji: '🎪', color: '#FFDC00', sound: null, spawnWeight: 1 },
	{ name: 'clap', emoji: '👏', color: '#2ECC40', sound: null, spawnWeight: 1 },
	{ name: 'tom', emoji: '🥁', color: '#0074D9', sound: null, spawnWeight: 1 },
	{ name: 'crash', emoji: '💥', color: '#B10DC9', sound: null, spawnWeight: 1 },
	{ name: 'cymbal', emoji: '🎯', color: '#F012BE', sound: null, spawnWeight: 1 },
	{ name: 'shaker', emoji: '🎵', color: '#01FF70', sound: null, spawnWeight: 1 },
	{ name: 'percussion', emoji: '⭐', color: '#7FDBFF', sound: null, spawnWeight: 1 }
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
		ball.color = color(0, 0, 0, 0); // Make ball transparent
		ball.text = instrument.emoji;
		ball.textColor = instrument.color;
		return ball;
	}
	return null;
}

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
	
	// Drum Machine Controls
	let drumFolder = gui.addFolder('Drum Machine');
	drumFolder.add(settings, 'bpm', 60, 200).name('BPM');
	drumFolder.add(settings, 'beatWidth', 300, 800).name('Beat Width');
	drumFolder.add(settings, 'beatHeight', 50, 200).name('Beat Height');
	drumFolder.add(settings, 'beatSegments', 4, 32).step(4).name('Beat Segments');
	drumFolder.addColor(settings, 'beatLineColor').name('Beat Line Color');
	drumFolder.add(settings, 'beatLineWidth', 1, 5).name('Line Width');
	drumFolder.add(settings, 'showBeatGrid').name('Show Grid');
	drumFolder.add(settings, 'beatGridOpacity', 0, 1).name('Grid Opacity');
	
	// Updated Throw Zone Controls
	let throwFolder = gui.addFolder('Throw Zones');
	throwFolder.add(settings, 'leftThrowZone', 50, 200).name('Left Zone Width');
	throwFolder.add(settings, 'rightThrowZone', 50, 200).name('Right Zone Width');
	throwFolder.add(settings, 'throwZoneHeight', 100, 1000).name('Zone Height');
	throwFolder.add(settings, 'throwZoneY', 0, 1000).name('Y Offset');
	throwFolder.add(settings, 'showThrowZones').name('Show Zones');
	throwFolder.add(settings, 'showThrowZoneOutline').name('Show Border');
	throwFolder.addColor(settings, 'throwZoneColor').name('Zone Color');
	
	// Visual Controls
	let visualFolder = gui.addFolder('Visual Feedback');
	visualFolder.add(settings, 'showInstrumentLabels').name('Show Labels');
	visualFolder.add(settings, 'instrumentLabelSize', 10, 30).name('Label Size');
	
	// Actions
	let actionsFolder = gui.addFolder('Actions');
	actionsFolder.add(settings, 'resetBalls').name('Reset Balls');
	actionsFolder.add(settings, 'clearInstruments').name('Clear Beat');
	
	// Add Debug Controls folder
	let debugControlsFolder = gui.addFolder('Debug Controls');
	debugControlsFolder.add(settings, 'debugMode').name('Debug Mode');
	debugControlsFolder.add(settings, 'logErrors').name('Log Errors');
	debugControlsFolder.add(settings, 'showDebugInfo').name('Show Debug Info');
	debugControlsFolder.add(settings, 'autoRetryOnError').name('Auto Retry');
	debugControlsFolder.add(settings, 'maxRetries', 1, 5).step(1).name('Max Retries');
	debugControlsFolder.add(settings, 'retryDelay', 100, 2000).name('Retry Delay');
	debugControlsFolder.add(settings, 'resetBoundaries').name('Reset Boundaries');
	debugControlsFolder.add(settings, 'clearErrors').name('Clear Errors');
	
	// Open folders by default
	debugFolder.open();
	pinchFolder.open();
	drumFolder.open();
	throwFolder.open();
	debugControlsFolder.open();
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

	// Load instrument sounds
	INSTRUMENTS.forEach(inst => {
		try {
			inst.sound = loadSound(`sounds/${inst.name}.mp3`);
		} catch (error) {
			console.warn(`Could not load sound for ${inst.name}:`, error);
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
				loops = 4;
				wasThrown = true;
			} else if (ball.x > width - settings.rightThrowZone) {
				loops = 1;
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
		this.totalBeats = 32; // 8 beats * 4 segments
		this.activeInstruments = new Map(); // Map of active instruments and their durations
		this.lastUpdateTime = 0;
		this.beatInterval = (60 / settings.bpm) * 1000 / 2; // ms per beat (doubled for 32 beats)
	}

	addInstrument(instrument, loops) {
		// Remove any existing instance of this instrument
		if (this.activeInstruments.has(instrument.name)) {
			this.activeInstruments.delete(instrument.name);
		}
		
		// Create a beat pattern - activate every 8th beat for this instrument
		let beats = Array(this.totalBeats).fill(false);
		// Add some variation to the pattern
		for (let i = 0; i < this.totalBeats; i += 8) {
			beats[i] = true; // Main beat
			if (Math.random() > 0.5) beats[i + 4] = true; // Optional off-beat
		}
		
		// Store the instrument with its beat pattern
		this.activeInstruments.set(instrument.name, {
			instrument: instrument,
			remainingLoops: loops,
			beats: beats
		});
		
		// Immediately play the sound once when added
		if (instrument.sound && instrument.sound.isLoaded()) {
			instrument.sound.play();
		}
	}

	update() {
		let currentTime = millis();
		if (currentTime - this.lastUpdateTime >= this.beatInterval) {
			this.currentBeat = (this.currentBeat + 1) % this.totalBeats;
			
			// Play active instruments
			for (let [name, data] of this.activeInstruments) {
				if (data.beats[this.currentBeat]) {
					if (data.instrument.sound && data.instrument.sound.isLoaded()) {
						data.instrument.sound.play();
					}
				}
			}
			
			// Update loop counts at the end of each loop
			if (this.currentBeat === 0) {
				for (let [name, data] of this.activeInstruments.entries()) {
					data.remainingLoops--;
					if (data.remainingLoops <= 0) {
						this.activeInstruments.delete(name);
					}
				}
			}
			
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
				
				for (let i = 0; i < this.totalBeats; i++) {
					if (data.beats[i]) {
						text(instrument.emoji, 
							 x + (i * (settings.beatWidth / this.totalBeats)),
							 instrumentY);
					}
				}
				instrumentY += 25;
			}
		}
		pop();
	}
}
