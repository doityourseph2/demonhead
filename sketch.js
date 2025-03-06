let video;
let handPose; let hands = [];
let balls;
let gui;
let drumMachine;
let boundaries;
let uiOverlay;
let sound, fft;
let analyzer;
let waveform;
let customFont;
let videoWidth;
let videoHeight;

// Set up aspect ratio for canvas
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const ASPECT_RATIO = 9/16;

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
	// Drums & Beats
	{ name: 'acidbeat', color: '#FF5733', emoji: '🥁', type: 'drums' },
	{ name: 'amenbreak', color: '#C70039', emoji: '🔊', type: 'drums' },
	{ name: 'atmospherebeat', color: '#900C3F', emoji: '🌌', type: 'drums' },
	{ name: 'basedrums', color: '#581845', emoji: '💥', type: 'drums' },
	{ name: 'breakbeatA', color: '#FF8D1A', emoji: '🎵', type: 'drums' },
	{ name: 'breakbeathithat', color: '#39C7A5', emoji: '🎶', type: 'drums' },
	{ name: 'clubdrums', color: '#3498DB', emoji: '🎧', type: 'drums' },
	{ name: 'danceclaps', color: '#8E44AD', emoji: '👏', type: 'drums' },
	{ name: 'dancedrums', color: '#2ECC71', emoji: '💃', type: 'drums' },
	{ name: 'drumbeat', color: '#F1C40F', emoji: '🥁', type: 'drums' },
	{ name: 'dubstepdrumsA', color: '#E74C3C', emoji: '🎚', type: 'drums' },
	{ name: 'electrobeatA', color: '#1ABC9C', emoji: '💨', type: 'drums' },
	{ name: 'electrobeatB', color: '#16A085', emoji: '💫', type: 'drums' },
	{ name: 'energybeat', color: '#27AE60', emoji: '⚡', type: 'drums' },
	{ name: 'funkydrums', color: '#F39C12', emoji: '🕺', type: 'drums' },
	{ name: 'glitchbeat', color: '#D35400', emoji: '🎛', type: 'drums' },
	{ name: 'harddrum', color: '#C0392B', emoji: '💥', type: 'drums' },
	{ name: 'hardtrap', color: '#8E44AD', emoji: '🔥', type: 'drums' },
	{ name: 'hithat', color: '#2980B9', emoji: '🎪', type: 'drums' },
	{ name: 'offbeatdrums', color: '#E67E22', emoji: '🥁', type: 'drums' },
	{ name: 'snapdrums', color: '#95A5A6', emoji: '👌', type: 'drums' },
	{ name: 'trapdrums', color: '#7F8C8D', emoji: '🎭', type: 'drums' },
	{ name: 'zuludrums', color: '#BDC3C7', emoji: '🛢️', type: 'drums' },

	// Synths & Melodies
	{ name: 'aliensynth', color: '#2C3E50', emoji: '👽', type: 'synth' },
	{ name: 'clubsynth', color: '#34495E', emoji: '🎹', type: 'synth' },
	{ name: 'melody', color: '#ECF0F1', emoji: '🎵', type: 'melody' },
	{ name: 'melodicchords', color: '#95A5A6', emoji: '🎼', type: 'melody' },
	{ name: 'piano', color: '#7F8C8D', emoji: '🎹', type: 'melody' },
	{ name: 'spacesynths', color: '#BDC3C7', emoji: '🚀', type: 'synth' },
	{ name: 'trappianoA', color: '#E74C3C', emoji: '🎹', type: 'melody' },
	{ name: 'trappianoB', color: '#C0392B', emoji: '🎼', type: 'melody' },

	// Bass & Effects
	{ name: 'plingybass', color: '#E67E22', emoji: '🎸', type: 'bass' },
	{ name: 'siren', color: '#D35400', emoji: '🚨', type: 'effects' },
	{ name: 'tambourine', color: '#3498DB', emoji: '🔔', type: 'effects' },
	{ name: 'technobass', color: '#2980B9', emoji: '💫', type: 'bass' },
	{ name: 'typicaltrapA', color: '#8E44AD', emoji: '🎪', type: 'trap' },
	{ name: 'typicaltrapB', color: '#9B59B6', emoji: '🌟', type: 'trap' },
	{ name: 'wobblebass', color: '#2C3E50', emoji: '🌊', type: 'bass' }
];

let settings = {
	// Camera settings
	cameraX: 0,
	cameraY: 0,
	cameraScale: 1,
	
	// Boundary settings
	boundaryThickness: 20,
	boundaryOffset: 30,
	
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
	bpm: 140,
	beatWidth: 1000,
	beatHeight: 200,
	loopDuration: 4, // seconds per loop
	beatSegments: 16,
	beatLineColor: '#ff0000',
	beatLineWidth: 4,
	showBeatGrid: true,
	beatGridOpacity: 1,
	
	// Ball throw detection
	throwVelocityThreshold: 10,
	leftThrowZone: 200,  // pixels from left edge
	rightThrowZone: 200,  // pixels from right edge
	throwZoneHeight: 400, // height of throw zones from top
	throwZoneY: 545,       // Y offset from top
	throwZoneColor: 'rgba(255, 0, 0, 0.2)', // Visual indicator for throw zones
	showThrowZones: false,
	showThrowZoneOutline: false, // Show border around throw zones
	
	// Visual feedback
	showInstrumentLabels: true,
	instrumentLabelSize: 37,
	
	// Boundary Debug
	debugMode: true,
	logErrors: true,
	showDebugInfo: true,
	autoRetryOnError: true,
	maxRetries: 3,
	retryDelay: 500,
	
	// Grid Visualization settings
	grid: {
		enabled: true,
		x: 0,
		y: 1416,
		width: 1000,
		height: 275,
		cellSize: 60,
		primaryColor: 'rgba(255, 255, 255, 1)',  // Full opacity
		secondaryColor: 'rgba(83, 28, 16, 1)',  // Full opacity
		lineWidth: 1,
		rotation: 0,          // Reset rotation to 0
		scale: 1,
		perspective: 0,       // Remove perspective effect
		animate: true,
		animationSpeed: -0.2   // Slower animation speed
	},
	
	// Hand Tracking Visualization
	handVis: {
		enabled: true,
		dotSize: 10,
		leftHandColor: 'rgba(255, 0, 255, 0.6)',
		rightHandColor: 'rgba(255, 255, 0, 0.6)',
		showFingerTips: true,
		showPalmPoints: false,
		minY: 0,      // Will be set in setup
		maxY: 0,      // Will be set in setup
		minX: 0,      // Will be set in setup
		maxX: 0       // Will be set in setup
	},
	
	// Actions
	resetBalls: function() {
		resetBallPositions();
	},
	clearInstruments: function() {
		if (drumMachine) {
			// Clear all instruments and stop all audio
			for (let [name, data] of drumMachine.activeInstruments) {
				// Stop both P5 sound and Tone.js player
				if (data.instrument.sound && data.instrument.sound.isLoaded()) {
					data.instrument.sound.stop();
				}
				if (data.instrument.player && data.instrument.player.loaded) {
					data.instrument.player.stop();
				}
			}
			drumMachine.activeInstruments.clear();
			
			// Additional safety: stop all Tone.js players
			INSTRUMENTS.forEach(inst => {
				if (inst.player && inst.player.loaded) {
					inst.player.stop();
				}
			});
		}
	},
	resetBoundaries: function() {
		initializeBoundaries(true);
	},
	clearErrors: function() {
		debugState.errors = [];
		debugState.lastError = null;
	},
	// Waveform settings
	waveform: {
		x: 541,
		y: 1575,
		width: 1000,
		height: 100,
		scale: 1,
		smoothing: 0.8,
		color: '#ff0000',
		opacity: 0.5,
		lineWidth: 4,
		enabled: true
	},
	// Add new banner system settings to the settings object
	banner: {
		enabled: true,
		x: 0,
		y: 1285,
		speed: 3,  // Increased speed
		fontSize: 52,
		color: '#656d9c',
		spacing: 4,
		cropOffset: 70,  // Add crop offset to hide text at edges
		messages: [
			"DON'T STOP THE BEAT!",
			"KEEP IT UP!",
			"GROOVY TUNES",
			"PUMP IT UP",
			"FEEL THE RHYTHM",
			"DROP THE BEAT",
			"MAKE SOME NOISE",
			"LET'S JAM",
			"BRING THE HEAT",
			"ROCK THE HOUSE",
			"CAN'T STOP, WON'T STOP",
			"MUSIC MAKE YOU LOSE CONTROL",
			"DANCE TO THE BEAT",
			"GET DOWN",
			"HIT THE FLOOR",
			"JUMP ON IT",
			"KEEP IT GOING",
			"LET'S DANCE",
			
		]
	},
	maxBalls: 13
};

// Track which balls are being held
let heldBalls = new Map();  // Map to store held balls and their hold time

// Add spawn position tracking
let availableSpawnPositions = [];


function initializeSpawnPositions() {
	availableSpawnPositions = [];
	
	// Calculate playable area bounds
	const topBound = height/3.58 + settings.boundaryThickness;  // Top boundary + thickness
	const bottomBound = height/1.53 - settings.boundaryThickness;  // Bottom boundary - thickness
	const leftBound = settings.boundaryOffset + settings.boundaryThickness + settings.leftThrowZone;  // Left boundary + throw zone
	const rightBound = width - settings.boundaryOffset - settings.boundaryThickness - settings.rightThrowZone;  // Right boundary - throw zone
	
	// Calculate grid dimensions for more evenly distributed spawns
	const gridCols = 4;
	const gridRows = 3;
	const cellWidth = (rightBound - leftBound) / gridCols;
	const cellHeight = (bottomBound - topBound) / gridRows;
	
	// Create spawn positions in grid cells with some randomization
	for (let i = 0; i < gridCols; i++) {
		for (let j = 0; j < gridRows; j++) {
			// Add random offset within cell
			const randomX = leftBound + (i * cellWidth) + random(cellWidth * 0.2, cellWidth * 0.8);
			const randomY = topBound + (j * cellHeight) + random(cellHeight * 0.2, cellHeight * 0.8);
			
			availableSpawnPositions.push({
				x: randomX,
				y: randomY
			});
		}
	}
}

function getRandomSpawnPosition() {
	// Calculate playable area bounds
	const topBound = height/3.58 + settings.boundaryThickness;
	const bottomBound = height/1.53 - settings.boundaryThickness;
	const leftBound = settings.boundaryOffset + settings.boundaryThickness + settings.leftThrowZone;
	const rightBound = width - settings.boundaryOffset - settings.boundaryThickness - settings.rightThrowZone;
	
	return {
		x: random(leftBound, rightBound),
		y: random(topBound, bottomBound)
	};
}

function getRandomInstrument() {
	// Simple random selection since we don't have weights
	return INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)];
}

function spawnSingleBall(position = null) {
	// If no position provided, get a random position within playable area
	if (!position) {
		if (availableSpawnPositions.length > 0) {
			const randomIndex = Math.floor(Math.random() * availableSpawnPositions.length);
			position = availableSpawnPositions.splice(randomIndex, 1)[0];
		} else {
			position = getRandomSpawnPosition();
		}
	}
	
	const instrument = getRandomInstrument();
	let ball = new balls.Sprite(position.x, position.y);
	ball.instrument = instrument;  // Make sure to assign the instrument
	ball.color = instrument.color;
	ball.text = instrument.emoji;
	noStroke();
	ball.textSize = settings.ballDiameter * 0.5;
	ball.textColor = 'white';
	return ball;
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
	
	// Grid Visualization
	let gridFolder = gui.addFolder('Background Grid');
	gridFolder.add(settings.grid, 'enabled').name('Show Grid');
	gridFolder.add(settings.grid, 'x', 0, width).name('Position X');
	gridFolder.add(settings.grid, 'y', 0, height).name('Position Y');
	gridFolder.add(settings.grid, 'width', 100, width).name('Width');
	gridFolder.add(settings.grid, 'height', 50, 500).name('Height');
	gridFolder.add(settings.grid, 'cellSize', 10, 100).name('Cell Size');
	gridFolder.addColor(settings.grid, 'primaryColor').name('Primary Color');
	gridFolder.addColor(settings.grid, 'secondaryColor').name('Secondary Color');
	gridFolder.add(settings.grid, 'lineWidth', 0.1, 5).name('Line Width');
	gridFolder.add(settings.grid, 'rotation', -180, 180).name('Rotation');
	gridFolder.add(settings.grid, 'scale', 0.1, 3).name('Scale');
	gridFolder.add(settings.grid, 'perspective', 0, 1).name('Perspective');
	gridFolder.add(settings.grid, 'animate').name('Animate');
	gridFolder.add(settings.grid, 'animationSpeed', 0.1, 2).name('Anim Speed');
	gridFolder.open();
	
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
	
	// Waveform Visualization
	let waveformFolder = gui.addFolder('Waveform');
	waveformFolder.add(settings.waveform, 'enabled').name('Show Waveform');
	waveformFolder.add(settings.waveform, 'x', 0, width).name('Position X');
	waveformFolder.add(settings.waveform, 'y', 0, height).name('Position Y');
	waveformFolder.add(settings.waveform, 'width', 100, width).name('Width');
	waveformFolder.add(settings.waveform, 'height', 50, 300).name('Height');
	waveformFolder.add(settings.waveform, 'scale', 0.1, 3).name('Scale');
	waveformFolder.add(settings.waveform, 'smoothing', 0, 0.99).name('Smoothing');
	waveformFolder.add(settings.waveform, 'opacity', 0, 1).name('Opacity');
	waveformFolder.add(settings.waveform, 'lineWidth', 1, 5).name('Line Width');
	waveformFolder.addColor(settings.waveform, 'color').name('Color');
	waveformFolder.open();
	
	// Hand Visualization Settings
	let handVisFolder = gui.addFolder('Hand Visualization');
	handVisFolder.add(settings.handVis, 'enabled').name('Show Hand Points');
	handVisFolder.add(settings.handVis, 'dotSize', 4, 20).name('Dot Size');
	handVisFolder.add(settings.handVis, 'showFingerTips').name('Show Fingers');
	handVisFolder.add(settings.handVis, 'showPalmPoints').name('Show Palm');
	handVisFolder.addColor(settings.handVis, 'leftHandColor').name('Left Hand');
	handVisFolder.addColor(settings.handVis, 'rightHandColor').name('Right Hand');
	handVisFolder.open();
	
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
	for (let i = 0; i < settings.maxBalls; i++) {
		spawnSingleBall();
	}
}

async function preload() {
    // Check the browser window size
    try {
        const resolution = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        const browserAspectRatio = resolution.width / resolution.height;

        let videoWidth, videoHeight;
        if (browserAspectRatio > ASPECT_RATIO) {
            videoHeight = resolution.height;
            videoWidth = videoHeight * ASPECT_RATIO;
        } else {
            videoWidth = resolution.width;
            videoHeight = videoWidth / ASPECT_RATIO;
        }

		//  // If the detected resolution does not match the constant canvas values, set to 1280x720
		//  if (videoWidth !== 1080 || videoHeight !== 1920) {
		// 	videoWidth = 720;
		// 	videoHeight = 1280;
		// }

		console.log(`Canvas dimensions set to: ${videoWidth}x${videoHeight}`);
    } catch (error) {
        console.warn('Could not determine browser window size:', error);
        // Fallback to default resolution
        videoWidth = 1080;
        videoHeight = 1920;
        console.log(`Fallback canvas dimensions set to: ${videoWidth}x${videoHeight}`);
    }

	// Load custom font
	customFont = loadFont('assets/digit.TTF', () => {
		updateLoadingProgress('font');
	});
	
	// Load UI overlay
	uiOverlay = loadImage('assets/demonheadui.png', () => {
		updateLoadingProgress('UI overlay');
	});
	
	// Load the handPose model
	handPose = ml5.handPose({ flipped: true });

	// Create the webcam video with dynamic dimensions
    video = createCapture(VIDEO);
    video.size(videoWidth, videoHeight);
    video.hide();
 

	// Load loop sounds
	INSTRUMENTS.forEach(inst => {
		try {
			inst.sound = loadSound(`loops/${inst.name}140bpm.mp3`, () => {
				updateLoadingProgress(`${inst.name} sound`);
			}, 
			(error) => {
				console.warn(`Could not load loop for ${inst.name}:`, error);
				updateLoadingProgress(`${inst.name} (failed)`);
			});
			// Configure the sound as a loop
			if (inst.sound) {
				inst.sound.setLoop(true);
			}
		} catch (error) {
			console.warn(`Could not load loop for ${inst.name}:`, error);
			updateLoadingProgress(`${inst.name} (failed)`);
		}
	});
}

function setup() {
	 // Create canvas with fixed dimensions
	 createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
	 displayMode(MAXED);
	 imageMode(CENTER);
	 userStartAudio();
	
	// Initialize dynamic settings after canvas is created
	initializeSettings();
	
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
	balls.rotationDrag = 0.2;  // Add rotation drag for stability
	balls.mass = 1;  // Standardize mass
	
	updateBoundaries();
	setupGUI();
	resetBallPositions();
	
	handPose.detectStart(video, gotHands);
	debugState.setupComplete = true;
	
	// Initialize Tone.js analyzer
	analyzer = new Tone.Analyser({
		type: "waveform",
		size: 1024,
		smoothing: settings.waveform.smoothing
	});
	
	// Create a master gain node for all instruments
	const masterGain = new Tone.Gain().toDestination();
	
	// Connect analyzer to master output
	masterGain.connect(analyzer);
	
	// Modify instrument sound loading to use Tone.js
	INSTRUMENTS.forEach(inst => {
		try {
			inst.player = new Tone.Player(`loops/${inst.name}140bpm.mp3`).connect(masterGain);
			inst.player.loop = true;
		} catch (error) {
			console.warn(`Could not load loop for ${inst.name}:`, error);
		}
	});

	// Initialize banner system
	bannerSystem = new BannerSystem();
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
					y: height/1.53,
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
					y: height/3.58,
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
		boundaries.visible = false;
		
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
	
	// Initialize camera transform object with default values
    const cameraTransform = {
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        videoWidth: width,
        videoHeight: height,
        videoX: width / 2,
        videoY: height / 2
    };

    // Calculate video display dimensions to maintain aspect ratio
    const playAreaTop = height / 3.58;
    const playAreaBottom = height / 1.53;
    const playAreaHeight = playAreaBottom - playAreaTop;
    const playAreaCenter = playAreaTop + (playAreaHeight / 2);

    // Calculate scaling factors
    const videoAspect = video.width / video.height;
    const scaleX = width / video.width;
    const scaleY = playAreaHeight / video.height;

    // Update camera transform with calculated values
    cameraTransform.scale = Math.max(scaleX, scaleY);
    cameraTransform.videoWidth = video.width * cameraTransform.scale;
    cameraTransform.videoHeight = video.height * cameraTransform.scale;
    cameraTransform.videoX = width / 2;
    cameraTransform.videoY = playAreaCenter;
    cameraTransform.offsetX = cameraTransform.videoX - (cameraTransform.videoWidth / 2);
    cameraTransform.offsetY = cameraTransform.videoY - (cameraTransform.videoHeight / 2);

    // Draw scaled and centered video
    image(video, cameraTransform.videoX, cameraTransform.videoY, 
          cameraTransform.videoWidth, cameraTransform.videoHeight);
	
	// Update held balls before drawing
	updateHeldBalls(cameraTransform);
	
	// Draw grid before other elements
	drawGrid();

	// Update and draw drum machine
	drumMachine.update();
	drumMachine.drawBeatBar();

	// Check for raised hands gesture to clear instruments
	if (hands.length >= 2) {
		let handsRaised = hands.filter(hand => {
			let wrist = hand.keypoints[0];
			return wrist && wrist.y < height/5;
		});
		
		if (handsRaised.length >= 2) {
			push();
			noFill();
			stroke(255, 255, 0);
			strokeWeight(3);
			rect(0, 0, width, height/5);
			pop();
			
			// Clear instruments code...
			for (let [name, data] of drumMachine.activeInstruments) {
				if (data.instrument.sound && data.instrument.sound.isLoaded()) {
					data.instrument.sound.stop();
				}
				if (data.instrument.player && data.instrument.player.loaded) {
					data.instrument.player.stop();
				}
			}
			drumMachine.activeInstruments.clear();
			
			INSTRUMENTS.forEach(inst => {
				if (inst.player && inst.player.loaded) {
					inst.player.stop();
				}
			});
		}
	}

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
					spawnSingleBall(getRandomSpawnPosition());
				}, 500);
			}
		}
	}
	
	// Draw waveform
	drawWaveform();
	
	// Draw UI overlay
	if (uiOverlay) {
		image(uiOverlay, width/2, height/2, width, height);
	}
	
	// Draw active instruments text
	drumMachine.drawActiveInstruments();
	
	// Update and draw banner
	bannerSystem.update();
	bannerSystem.draw();
	
	// Draw hand tracking points LAST (after UI overlay)
	if (settings.handVis.enabled && hands.length > 0) {
	for (let i = 0; i < hands.length; i++) {
		let hand = hands[i];
		
			// Check if hand is pinching
			const isPinch = isPinching(hand);
			
			// Set color based on hand and pinch state
			const baseColor = hand.handedness === "Left" ? "#e8903d" : "#ffffff";
			const handColor = isPinch ? color(baseColor) : color(baseColor + '80'); // Add transparency when not pinching
			
			// Only draw thumb tip and fingertips
			const fingerTips = [4, 8, 12, 16, 20]; // Indices for fingertips
			
			for (let j = 0; j < hand.keypoints.length; j++) {
			let keypoint = hand.keypoints[j];
				
				// Check if point is within boundaries
				if (keypoint.x >= settings.handVis.minX && 
					keypoint.x <= settings.handVis.maxX && 
					keypoint.y >= settings.handVis.minY && 
					keypoint.y <= settings.handVis.maxY) {
					
					// Only draw fingertips
					if (fingerTips.includes(j)) {
						push();
						fill(handColor);
						noStroke();
						circle(keypoint.x, keypoint.y, 10); // Fixed dot size
						pop();
					}
				}
			}
		}
	}
	
	pop();
}

// Callback function for when handPose outputs data
function gotHands(results) {
	// Only process if we have valid results
	if (!results || !results.length) {
		hands = results;
		return;
	}

	// Calculate transform values consistently with draw function
	const playAreaTop = height/3.58;
	const playAreaBottom = height/1.53;
	const playAreaHeight = playAreaBottom - playAreaTop;
	const playAreaCenter = playAreaTop + (playAreaHeight / 2);
	
	const scaleX = width / video.width;
	const scaleY = playAreaHeight / video.height;
	const scale = Math.max(scaleX, scaleY);
	
	const transformedResults = results.map(hand => {
		// Create a new hand object to avoid modifying the original
		const transformedHand = {...hand};
		
		if (hand.keypoints) {
			transformedHand.keypoints = hand.keypoints.map(point => ({
				...point,
				x: (point.x * scale) + (width/2 - (video.width * scale)/2),
				y: (point.y * scale) + (playAreaCenter - (video.height * scale)/2)
			}));
		}
		
		return transformedHand;
	});
	
	hands = transformedResults;
}

class DrumMachine {
	constructor() {
		this.currentBeat = 0;
		this.totalBeats = 32;
		this.activeInstruments = new Map();
		this.lastUpdateTime = 0;
		this.beatInterval = (60 / 140) * 1000; // Fixed to 140 BPM
		this.beatsPerLoop = 8; // 8 beats per loop
		this.nextCleanupTime = 0;
		this.fadeOutDuration = 0.5; // Duration in seconds
		this.visualEffects = new Map(); // Store visual effects for instruments
	}

	addInstrument(instrument, loops) {
		let gainNode;
		
		// Stop any existing instance of this instrument
		if (this.activeInstruments.has(instrument.name)) {
			const existing = this.activeInstruments.get(instrument.name);
			if (existing.instrument.player && existing.instrument.player.loaded) {
				existing.instrument.player.stop();
			}
		}
		
		// Start the Tone.js player only
		if (instrument.player && instrument.player.loaded) {
			// Create a gain node for fade effects
			gainNode = new Tone.Gain(1).toDestination();
			instrument.player.connect(gainNode);
			instrument.player.start();
			
			// Add entry animation
			this.visualEffects.set(instrument.name, {
				scale: 1.5,
				opacity: 0,
				state: 'entering'
			});
		}
		
		// Store the instrument with its loop count and precise timing info
		this.activeInstruments.set(instrument.name, {
			instrument: instrument,
			remainingLoops: loops,
			startTime: Tone.now(),
			startBeat: this.currentBeat,
			lastBeat: this.currentBeat,
			expectedEndTime: Tone.now() + (loops * this.beatsPerLoop * this.beatInterval / 1000),
			gainNode: gainNode
		});

		// Add banner notification with descriptive text based on instrument type
		if (bannerSystem) {
			let message;
			switch(instrument.name) {
				case 'aliensynth':
					message = "ALIEN SYNTH JOINS THE MIX";
					break;
				case 'basedrums':
					message = "BASE DRUMS DROPPING IN";
					break;
				case 'bollytrap':
					message = "BOLLY TRAP BEATS ADDED";
					break;
				case 'clubdrums':
					message = "CLUB DRUMS HITTING THE BEAT";
					break;
				case 'clubsynth':
					message = "CLUB SYNTH TAKING OVER";
					break;
				case 'melody':
					message = "MELODY LINE FLOWING IN";
					break;
				case 'piano':
					message = "PIANO KEYS JOINING THE GROOVE";
					break;
				case 'siren':
					message = "SIREN SOUNDS INCOMING";
					break;
				case 'tambourine':
					message = "TAMBOURINE SHAKING IT UP";
					break;
				case 'technobass':
					message = "TECHNO BASS DROPPING";
					break;
				case 'typicaltrapA':
					message = "TRAP BEATS ROLLING IN";
					break;
				case 'typicaltrapB':
					message = "TRAP RHYTHM ADDED";
					break;
				default:
					message = "NEW SOUND ADDED TO THE MIX";
			}
			bannerSystem.addEventMessage(message);
		}
	}

	update() {
		const currentTime = Tone.now();
		
		// Update visual effects
		for (let [name, effect] of this.visualEffects) {
			switch(effect.state) {
				case 'entering':
					effect.scale = lerp(effect.scale, 1, 0.2);
					effect.opacity = lerp(effect.opacity, 1, 0.2);
					if (Math.abs(effect.scale - 1) < 0.01) {
						effect.state = 'playing';
					}
					break;
				case 'playing':
					// Pulse effect on beat
					if (this.currentBeat % 8 === 0) {
						effect.scale = 1.1;
					}
					effect.scale = lerp(effect.scale, 1, 0.1);
					break;
				case 'ending':
					effect.opacity = lerp(effect.opacity, 0, 0.1);
					effect.scale = lerp(effect.scale, 0.8, 0.1);
					if (effect.opacity < 0.01) {
						this.visualEffects.delete(name);
					}
					break;
			}
		}
		
		// Update beat counter
		if (millis() - this.lastUpdateTime >= this.beatInterval) {
			this.currentBeat = (this.currentBeat + 1) % this.totalBeats;
			this.lastUpdateTime = millis();
			
			// Process instruments on beat change
			for (let [name, data] of this.activeInstruments) {
				// Calculate actual beats passed
				let beatsPassed = 0;
				if (this.currentBeat < data.lastBeat) {
					beatsPassed = (this.totalBeats - data.lastBeat) + this.currentBeat;
				} else {
					beatsPassed = this.currentBeat - data.lastBeat;
				}
				
				// Update last beat
				data.lastBeat = this.currentBeat;
				
				// Check for loop completion
				if (beatsPassed > 0 && this.currentBeat % this.beatsPerLoop === 0) {
					data.remainingLoops--;
					
					// Start fade-out if it's the last loop
					if (data.remainingLoops === 1) {
						const effect = this.visualEffects.get(name);
						if (effect) effect.state = 'ending';
						
						// Start volume fade-out
						if (data.gainNode) {
							data.gainNode.gain.linearRampToValueAtTime(0, 
								Tone.now() + this.fadeOutDuration);
						}
					}
					
					// Remove instrument if no loops remain
					if (data.remainingLoops <= 0) {
						this.stopAndRemoveInstrument(name);
					}
				}
			}
		}
		
		// Periodic cleanup check (every 100ms)
		if (millis() > this.nextCleanupTime) {
			this.cleanupExpiredInstruments();
			this.nextCleanupTime = millis() + 100;
		}
	}

	stopAndRemoveInstrument(name) {
		const data = this.activeInstruments.get(name);
		if (data) {
			// Stop Tone.js player with fade out
			if (data.instrument.player && data.instrument.player.loaded) {
				if (data.gainNode) {
					data.gainNode.gain.linearRampToValueAtTime(0, 
						Tone.now() + this.fadeOutDuration);
					setTimeout(() => {
						data.instrument.player.stop();
						data.gainNode.disconnect();
					}, this.fadeOutDuration * 1000);
				} else {
					data.instrument.player.stop();
				}
			}
			// Remove from active instruments
			this.activeInstruments.delete(name);
		}
	}

	cleanupExpiredInstruments() {
		const currentTime = Tone.now();
		for (let [name, data] of this.activeInstruments) {
			// Check if instrument has exceeded its expected duration
			if (currentTime >= data.expectedEndTime) {
				this.stopAndRemoveInstrument(name);
			}
		}
	}

	drawBeatBar() {
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
		let segmentWidth = settings.beatWidth / 8;
		let beatBarX = (width - settings.beatWidth) / 2;
		let beatBarY = 300;

		if (settings.showBeatGrid) {
			// Draw segment backgrounds with configurable opacity
			for (let i = 0; i < 8; i++) {
				fill(i % 2 === 0 ? `rgba(118, 39, 36, ${settings.beatGridOpacity})` 
								: `rgba(83, 28, 16, ${settings.beatGridOpacity})`);
				rect(beatBarX + (i * segmentWidth), beatBarY, segmentWidth, settings.beatHeight);
			}
		}

		// Draw beat line with configured color and width
		stroke(settings.beatLineColor);
		strokeWeight(settings.beatLineWidth);
		let beatX = beatBarX + (this.currentBeat * (settings.beatWidth / this.totalBeats));
		line(beatX, beatBarY, beatX, beatBarY + settings.beatHeight);
		pop();
	}

	drawActiveInstruments() {
		if (!settings.showInstrumentLabels) return;

		push();
		let beatBarY = 300;
		let textStartY = beatBarY + settings.beatHeight + 100;
		let textX = width / 2;
		
		textAlign(CENTER, CENTER);
		textFont(customFont);
		
		for (let [name, data] of this.activeInstruments) {
			let instrument = data.instrument;
			let effect = this.visualEffects.get(name) || { scale: 1, opacity: 1 };
			
			// Calculate warning color for last loop
			let warningAlpha = data.remainingLoops === 1 ? 
				map(sin(frameCount * 0.1), -1, 1, 0.3, 0.8) : 1;
			
			push();
			translate(textX, textStartY);
			scale(effect.scale);
			
			textSize(settings.instrumentLabelSize);
			
			// Draw text shadow for better visibility
			fill(0, 0, 0, 150 * effect.opacity);
			text(`${instrument.emoji} × ${data.remainingLoops}`, 2, 2);
			
			// Set the text color with fallback
			let textColor;
			try {
				if (instrument.color.startsWith('#')) {
					// Handle hex colors
					let c = color(instrument.color);
					textColor = color(red(c), green(c), blue(c), 255 * effect.opacity * warningAlpha);
				} else if (instrument.color.startsWith('rgb')) {
					// Handle RGB/RGBA colors
					let rgbaValues = instrument.color.match(/[\d.]+/g);
					if (rgbaValues && rgbaValues.length >= 3) {
						textColor = color(
							parseInt(rgbaValues[0]),
							parseInt(rgbaValues[1]),
							parseInt(rgbaValues[2]),
							255 * effect.opacity * warningAlpha
						);
					} else {
						textColor = color('#e8903d' + Math.floor(255 * effect.opacity * warningAlpha).toString(16).padStart(2, '0'));
					}
				} else {
					// Fallback color
					textColor = color('#e8903d' + Math.floor(255 * effect.opacity * warningAlpha).toString(16).padStart(2, '0'));
				}
			} catch (error) {
				// Final fallback
				textColor = color('#e8903d' + Math.floor(255 * effect.opacity * warningAlpha).toString(16).padStart(2, '0'));
			}
			
			// Apply the color
			fill(textColor);
			text(`${instrument.emoji} × ${data.remainingLoops}`, 0, 0);
			
			pop();
			
			textStartY += 50;
		}
		pop();
	}
}

// Add new function for drawing waveform
function drawWaveform() {
	if (!settings.waveform.enabled) return;
	
	push();
	const waveformData = analyzer.getValue();
	
	// Set drawing styles
	stroke(settings.waveform.color + Math.floor(settings.waveform.opacity * 255).toString(16).padStart(2, '0'));
	strokeWeight(settings.waveform.lineWidth);
	noFill();
	
	// Draw waveform
	beginShape();
	for (let i = 0; i < waveformData.length; i++) {
		const x = map(i, 0, waveformData.length, 
					 settings.waveform.x - settings.waveform.width/2, 
					 settings.waveform.x + settings.waveform.width/2);
		const y = 1575 + 
				 (waveformData[i] * settings.waveform.height * settings.waveform.scale);
		vertex(x, y);
	}
	endShape();
	pop();
}

// Add function to initialize dynamic settings
function initializeSettings() {
	// Set waveform position based on canvas size
	settings.waveform.x = width/2;
	settings.waveform.y = height - 100;
	
	// Initialize hand tracking boundaries
	settings.handVis.minY = height/3.58 + settings.boundaryThickness;
	settings.handVis.maxY = height/1.53 - settings.boundaryThickness;
	settings.handVis.minX = settings.boundaryOffset + settings.boundaryThickness;
	settings.handVis.maxX = width - settings.boundaryOffset - settings.boundaryThickness;
}

// Add new function for drawing the grid
function drawGrid() {
	if (!settings.grid.enabled) return;
	
	push();
	translate(settings.grid.x, settings.grid.y);
	
	// Calculate grid dimensions with overlap
	const cols = Math.ceil(settings.grid.width / settings.grid.cellSize) + 1;
	const rows = Math.ceil(settings.grid.height / settings.grid.cellSize) + 1;
	
	// Animation offset (slower and more precise)
	const animOffset = settings.grid.animate ? 
		(frameCount * settings.grid.animationSpeed) % settings.grid.cellSize : 0;
	
	// Draw cells with overlap to prevent gaps
	for (let i = -1; i <= cols; i++) {
		for (let j = -1; j <= rows; j++) {
			const x = Math.floor(i * settings.grid.cellSize - animOffset);
			const y = Math.floor(j * settings.grid.cellSize - animOffset);
			
			// Dark red fill for all squares
			fill('#531c10');  // Dark red
			stroke('rgba(255, 255, 255, 0.2)'); // Light red
			strokeWeight(2);
			
			// Draw cell with 1px overlap to prevent gaps
			rect(x, y, settings.grid.cellSize + 1, settings.grid.cellSize + 1);
		}
	}
	
	pop();
}

// Add new function to check pinch gesture
function isPinching(hand) {
	if (!hand || !hand.keypoints) return false;
	
	const thumb = hand.keypoints[4];  // Thumb tip
	const index = hand.keypoints[8];  // Index tip
	
	if (!thumb || !index) return false;
	
	const distance = dist(thumb.x, thumb.y, index.x, index.y);
	return distance < settings.pinchThreshold;
}

// Add new function to find nearest ball to a point
function findNearestBall(x, y, maxDistance) {
	let nearest = null;
	let minDist = maxDistance;
	
	for (let ball of balls) {
		if (heldBalls.has(ball)) continue;  // Skip already held balls
		
		const d = dist(x, y, ball.x, ball.y);
		if (d < minDist) {
			minDist = d;
			nearest = ball;
		}
	}
	
	return nearest;
}

// Add new function to handle ball movement
function updateHeldBalls(cameraTransform) {
	if (!hands || hands.length === 0) {
		// Release all balls if no hands detected
		heldBalls.clear();
		return;
	}
	
	for (let hand of hands) {
		const thumb = hand.keypoints[4];
		const index = hand.keypoints[8];
		
		if (!thumb || !index) continue;
		
		const pinchPoint = {
			x: (thumb.x + index.x) / 2,
			y: (thumb.y + index.y) / 2
		};
		
		const isPinch = isPinching(hand);
		const handId = hand.handedness.toLowerCase();
		
		if (isPinch) {
			// Try to grab a ball if not holding one
			if (!heldBalls.has(handId)) {
				const nearestBall = findNearestBall(pinchPoint.x, pinchPoint.y, settings.pinchRadius);
				if (nearestBall) {
					heldBalls.set(handId, {
						ball: nearestBall,
						offset: {
							x: nearestBall.x - pinchPoint.x,
							y: nearestBall.y - pinchPoint.y
						}
					});
				}
			}
			
			// Update held ball position with camera transform applied
			const heldBall = heldBalls.get(handId);
			if (heldBall) {
				const targetX = pinchPoint.x + heldBall.offset.x;
				const targetY = pinchPoint.y + heldBall.offset.y;
				
				// Smooth movement using lerp
				heldBall.ball.x = lerp(heldBall.ball.x, targetX, settings.pinchSmoothing);
				heldBall.ball.y = lerp(heldBall.ball.y, targetY, settings.pinchSmoothing);
				
				// Update velocity for throw detection
				heldBall.ball.vel.x = (targetX - heldBall.ball.x) / deltaTime;
				heldBall.ball.vel.y = (targetY - heldBall.ball.y) / deltaTime;
			}
		} else {
			// Release ball if no longer pinching
			if (heldBalls.has(handId)) {
				heldBalls.delete(handId);
			}
		}
	}
}

// Add banner system class
class BannerSystem {
	constructor() {
		this.messages = settings.banner.messages;
		this.currentMessage = 0;
		this.x = width - settings.banner.cropOffset;  // Start from cropped position
		this.messageQueue = [];
		this.lastEventTime = 0;
		this.eventDelay = 3000; // Time between event messages
		this.idleDelay = 2000;  // Shorter delay between idle messages
		this.lastIdleTime = 0;
	}

	addEventMessage(message) {
		const now = millis();
		if (now - this.lastEventTime > this.eventDelay) {
			this.messageQueue.push(message);
			this.lastEventTime = now;
		}
	}

	update() {
		if (!settings.banner.enabled) return;

		// Move banner
		this.x -= settings.banner.speed;

		// Get current message and calculate total width
		const message = this.messageQueue.length > 0 ? 
			this.messageQueue[0] : 
			this.messages[this.currentMessage];
		let totalWidth = 0;
		for (let char of message) {
			totalWidth += textWidth(char);
		}

		// Reset position and cycle messages when completely off screen
		if (this.x < -(totalWidth + settings.banner.cropOffset)) {
			this.x = width + settings.banner.cropOffset; // Start from further right
			if (this.messageQueue.length > 0) {
				this.messageQueue.shift();
			} else {
				const now = millis();
				if (now - this.lastIdleTime > this.idleDelay) {
					this.currentMessage = (this.currentMessage + 1) % this.messages.length;
					this.lastIdleTime = now;
				}
			}
		}
	}

	draw() {
		if (!settings.banner.enabled) return;

		push();
		const maskWidth = width - (settings.banner.cropOffset * 2);
		const maskX = settings.banner.cropOffset;
		const fadeWidth = 60; // Width of the fade effect for each letter
		
		// Setup text properties
		textFont(customFont);
		textSize(settings.banner.fontSize);
		textAlign(LEFT, CENTER);
		noStroke();
		
		const message = this.getCurrentMessage();
		let currentX = this.x;
		
		// Parse the base color components
		const baseColorObj = color(settings.banner.color);
		const r = red(baseColorObj);
		const g = green(baseColorObj);
		const b = blue(baseColorObj);
		
		// Draw each character individually with its own fade effect
		for (let i = 0; i < message.length; i++) {
			const char = message[i];
			const charWidth = textWidth(char);
			
			// Calculate alpha based on character position
			let alpha = 255;
			if (currentX < maskX + fadeWidth) {
				alpha = map(currentX, maskX, maskX + fadeWidth, 0, 255);
			}
			
			// Only draw visible characters
			if (currentX + charWidth > maskX && currentX < maskX + maskWidth) {
				fill(r, g, b, alpha);
				text(char, currentX, settings.banner.y);
			}
			
			currentX += charWidth;
		}
		
		pop();
	}

	getCurrentMessage() {
		return this.messageQueue.length > 0 ? 
			this.messageQueue[0] : 
			this.messages[this.currentMessage];
	}
}
