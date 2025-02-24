let video;
let poseNet;
let poses = [];
let bubbles = [];
let score = 0;
let fft;
let sound;
let isAudioLoaded = false;
let debugMode = true;
let statusElement;
let loadingElement;
let scoreDisplay;
let lastBeatTime = 0;
let gui;

// Debug settings
const settings = {
    debugMode: true,
    beatThreshold: 230,
    minBeatInterval: 500,
    bubbleRadius: 30,
    bubbleSpeed: { min: 2, max: 4 },
    particleCount: 10,
    handConfidenceThreshold: 0.2,
    showVideo: true,
    videoOpacity: 127,
    scorePerPop: 10,
    score: 0,
    bubbleOpacity: 0.7,
    spawnFromTop: true,
    // Color settings
    bubbleColors: {
        hueMin: 0,
        hueMax: 360,
        saturation: 80,
        brightness: 90
    },
    // Audio settings
    audioAnalysis: {
        smoothing: 0.8,
        threshold: 150,
        multiplier: 1.5
    }
};

class Bubble {
    constructor(x, y) {
        this.x = x;
        this.y = settings.spawnFromTop ? 0 : height;
        this.radius = settings.bubbleRadius;
        // Generate random HSB color
        colorMode(HSB, 360, 100, 100, 1.0);
        this.color = color(
            random(settings.bubbleColors.hueMin, settings.bubbleColors.hueMax),
            settings.bubbleColors.saturation,
            settings.bubbleColors.brightness,
            settings.bubbleOpacity
        );
        colorMode(RGB);
        this.speed = random(settings.bubbleSpeed.min, settings.bubbleSpeed.max);
        this.speed *= settings.spawnFromTop ? 1 : -1; // Reverse direction if spawning from top
        this.popped = false;
        this.alpha = 255;
        this.particles = [];
    }

    update() {
        if (!this.popped) {
            this.y += this.speed;
            return settings.spawnFromTop ? 
                   this.y < height : // When spawning from top
                   this.y > 0;      // When spawning from bottom
        } else {
            this.alpha -= 10;
            // Update particles
            for (let particle of this.particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha -= 5;
            }
            return this.alpha > 0;
        }
    }

    draw() {
        if (!this.popped) {
            // Draw bubble
            push();
            noStroke();
            fill(red(this.color), green(this.color), blue(this.color), this.alpha);
            circle(this.x, this.y, this.radius * 2);
            // Add shine effect
            fill(255, this.alpha * 0.5);
            circle(this.x - this.radius/3, this.y - this.radius/3, this.radius * 0.5);
            pop();
        } else {
            // Draw particles
            push();
            noStroke();
            for (let particle of this.particles) {
                fill(red(this.color), green(this.color), blue(this.color), particle.alpha);
                circle(particle.x, particle.y, particle.size);
            }
            pop();
        }
    }

    checkCollision(x, y) {
        if (!this.popped) {
            let d = dist(x, y, this.x, this.y);
            if (d < this.radius) {
                this.pop();
                return true;
            }
        }
        return false;
    }

    pop() {
        this.popped = true;
        // Create particles
        for (let i = 0; i < settings.particleCount; i++) {
            let angle = random(TWO_PI);
            let speed = random(2, 5);
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: cos(angle) * speed,
                vy: sin(angle) * speed,
                alpha: 255,
                size: random(5, 10)
            });
        }
    }
}

function debug(message) {
    if (settings.debugMode) console.log(`[Debug] ${message}`);
}

function createStatusElement() {
    const status = document.getElementById('status');
    if (!status) {
        const div = document.createElement('div');
        div.id = 'status';
        div.className = 'status';
        document.body.appendChild(div);
        return div;
    }
    return status;
}

function showStatus(message, duration = 3000) {
    debug(`Status: ${message}`);
    try {
        if (!statusElement) {
            statusElement = createStatusElement();
        }
        statusElement.textContent = message;
        statusElement.classList.add('visible');
        setTimeout(() => {
            statusElement.classList.remove('visible');
        }, duration);
    } catch (error) {
        console.error('Status error:', error);
    }
}

function updateScore(points) {
    settings.score += points;
    scoreDisplay.textContent = settings.score;
}

function handleAudioFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        loadSound(e.target.result, (loadedSound) => {
            if (sound) {
                sound.stop();
            }
            sound = loadedSound;
            sound.play();
            isAudioLoaded = true;
            showStatus('Music loaded and playing');
            debug('Audio file loaded successfully');
        });
    };
    reader.readAsDataURL(file);
}

function setupGui() {
    // Destroy existing GUI if it exists
    if (gui) {
        gui.destroy();
    }
    
    // Create new GUI with custom styling
    gui = new dat.GUI({ 
        width: 300,
        hideable: false, // Prevents accidental hiding
        closeOnTop: true // More accessible close button
    });
    
    // Style the GUI container
    const guiContainer = gui.domElement.parentElement;
    guiContainer.style.zIndex = '1000';
    guiContainer.style.position = 'absolute';
    
    // Game Controls folder
    const gameFolder = gui.addFolder('Game Controls');
    const scoreController = gameFolder.add(settings, 'score').name('Score').listen();
    scoreController.domElement.style.pointerEvents = 'none';
    
    // Audio Upload
    const audioFolder = gui.addFolder('Audio Settings');
    
    // Create a custom audio upload button
    const audioButton = document.createElement('div');
    audioButton.className = 'audio-upload-button';
    audioButton.innerHTML = '🎵 Choose Music File';
    audioButton.style.cssText = `
        padding: 6px;
        margin: 4px 0;
        background: #2fa1d6;
        color: white;
        border-radius: 3px;
        cursor: pointer;
        text-align: center;
        font-size: 11px;
    `;
    
    // Create a new audio input element
    const newAudioInput = document.createElement('input');
    newAudioInput.type = 'file';
    newAudioInput.accept = 'audio/*';
    newAudioInput.style.display = 'none';
    newAudioInput.addEventListener('change', handleAudioFile);
    
    // Add click handler to the button
    audioButton.addEventListener('click', () => {
        newAudioInput.click();
    });
    
    // Add the custom button to the GUI
    const audioContainer = document.createElement('div');
    audioContainer.appendChild(audioButton);
    audioContainer.appendChild(newAudioInput);
    audioFolder.domElement.appendChild(audioContainer);
    
    // Add audio analysis controls
    audioFolder.add(settings.audioAnalysis, 'threshold', 0, 300).name('Beat Sensitivity');
    audioFolder.add(settings.audioAnalysis, 'smoothing', 0, 1).name('Beat Smoothing');
    audioFolder.add(settings.audioAnalysis, 'multiplier', 0.1, 3).name('Beat Multiplier');
    
    // Bubble Settings
    const bubbleFolder = gui.addFolder('Bubble Settings');
    bubbleFolder.add(settings, 'spawnFromTop').name('Spawn From Top');
    bubbleFolder.add(settings, 'bubbleRadius', 10, 50).name('Size');
    bubbleFolder.add(settings, 'bubbleOpacity', 0, 1).name('Opacity');
    bubbleFolder.add(settings.bubbleSpeed, 'min', 1, 10).name('Min Speed');
    bubbleFolder.add(settings.bubbleSpeed, 'max', 1, 10).name('Max Speed');
    bubbleFolder.add(settings, 'particleCount', 5, 20).step(1).name('Particles');
    
    // Color Settings
    const colorFolder = bubbleFolder.addFolder('Color Settings');
    colorFolder.add(settings.bubbleColors, 'hueMin', 0, 360).name('Min Hue');
    colorFolder.add(settings.bubbleColors, 'hueMax', 0, 360).name('Max Hue');
    colorFolder.add(settings.bubbleColors, 'saturation', 0, 100).name('Saturation');
    colorFolder.add(settings.bubbleColors, 'brightness', 0, 100).name('Brightness');
    
    // Debug Settings
    const debugFolder = gui.addFolder('Debug Settings');
    debugFolder.add(settings, 'debugMode').name('Debug Mode');
    debugFolder.add(settings, 'showVideo').name('Show Video');
    debugFolder.add(settings, 'videoOpacity', 0, 255).name('Video Opacity');
    debugFolder.add(settings, 'handConfidenceThreshold', 0.1, 1).name('Hand Confidence');
    
    // Open folders by default
    gameFolder.open();
    audioFolder.open();
    bubbleFolder.open();
    
    // Add change handlers to all controllers
    gui.__folders['Bubble Settings'].__controllers.forEach(controller => {
        controller.onChange(() => {
            // Trigger immediate update when settings change
            if (typeof controller.getValue() === 'number') {
                controller.updateDisplay();
            }
        });
    });
    
    // Position the GUI in a better spot
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
}

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('game-container');
    
    // Initialize video and PoseNet
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();

    // Wait for ml5 to be ready
    if (ml5.poseNet) {
        initializePoseNet();
    } else {
        console.log("Waiting for ml5...");
        setTimeout(initializePoseNet, 1000);
    }

    // Initialize audio analysis
    fft = new p5.FFT();
    const audioInput = document.getElementById('audioInput');
    audioInput.addEventListener('change', handleAudioFile);

    // Initialize UI elements
    loadingElement = document.getElementById('loading');
    statusElement = createStatusElement();
    scoreDisplay = document.getElementById('score');

    // Set initial score
    updateScore(0);

    // Setup dat.GUI
    setupGui();
}

function initializePoseNet() {
    try {
        poseNet = ml5.poseNet(video, {
            flipHorizontal: true,
            detectionType: 'single'
        }, modelLoaded);
        poseNet.on('pose', gotPoses);
    } catch (error) {
        console.error("Error initializing PoseNet:", error);
        showStatus('Error loading PoseNet. Please refresh the page.');
    }
}

function modelLoaded() {
    debug('PoseNet loaded');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    showStatus('Ready! Upload music to start playing');
}

function gotPoses(results) {
    poses = results;
}

function createBubble() {
    const x = random(width * 0.1, width * 0.9);
    const y = settings.spawnFromTop ? 0 : height;
    bubbles.push(new Bubble(x, y));
}

function checkBeat() {
    if (!isAudioLoaded) return false;
    
    let spectrum = fft.analyze();
    fft.smooth(settings.audioAnalysis.smoothing);
    let energy = fft.getEnergy("bass", "lowMid") * settings.audioAnalysis.multiplier;
    let currentTime = millis();
    
    if (energy > settings.audioAnalysis.threshold && currentTime - lastBeatTime > settings.minBeatInterval) {
        lastBeatTime = currentTime;
        return true;
    }
    return false;
}

function draw() {
    // Clear background with fade effect
    background(0, 20);

    // Draw video feed with transparency
    if (settings.showVideo) {
        push();
        translate(width, 0);
        scale(-1, 1);
        tint(255, settings.videoOpacity);
        image(video, 0, 0, width, height);
        pop();
    }

    // Check for beats and create bubbles
    if (checkBeat()) {
        createBubble();
    }

    // Update and draw bubbles
    bubbles = bubbles.filter(bubble => {
        bubble.draw();
        return bubble.update();
    });

    // Check for hand collisions with bubbles
    if (poses.length > 0) {
        let pose = poses[0].pose;
        let leftWrist = pose.keypoints[9];
        let rightWrist = pose.keypoints[10];

        if (leftWrist.score > settings.handConfidenceThreshold) {
            fill(0, 255, 0);
            noStroke();
            ellipse(leftWrist.position.x, leftWrist.position.y, 20);
            
            bubbles.forEach(bubble => {
                if (bubble.checkCollision(leftWrist.position.x, leftWrist.position.y)) {
                    updateScore(settings.scorePerPop);
                    showStatus(`+${settings.scorePerPop} Points!`, 500);
                }
            });
        }

        if (rightWrist.score > settings.handConfidenceThreshold) {
            fill(0, 255, 0);
            noStroke();
            ellipse(rightWrist.position.x, rightWrist.position.y, 20);
            
            bubbles.forEach(bubble => {
                if (bubble.checkCollision(rightWrist.position.x, rightWrist.position.y)) {
                    updateScore(settings.scorePerPop);
                    showStatus(`+${settings.scorePerPop} Points!`, 500);
                }
            });
        }
    }

    // Debug information
    if (settings.debugMode) {
        push();
        fill(255);
        noStroke();
        textSize(14);
        textAlign(LEFT, TOP);
        text(`FPS: ${floor(frameRate())}`, 10, 10);
        text(`Bubbles: ${bubbles.length}`, 10, 30);
        text(`Audio Energy: ${floor(fft.getEnergy("bass"))}`, 10, 50);
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
} 