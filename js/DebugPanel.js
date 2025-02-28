class DebugPanel {
    constructor(drumMachine, handTracking) {
        this.gui = new dat.GUI();
        this.drumMachine = drumMachine;
        this.handTracking = handTracking;
        
        this.settings = {
            showDebugInfo: false,
            showHandTracking: true,
            showCameraView: true,
            showHandVisuals: true,
            showNearestBall: true,
            showBallPhysics: false,
            volume: 1.0,
        };
        
        this.setupDrumControls();
        this.setupPhysicsControls();
        this.setupHandTrackingControls();
        this.setupVisualsControls();
        this.setupAccessibilityControls();
    }

    setupDrumControls() {
        const drumFolder = this.gui.addFolder('Drum Machine');
        
        drumFolder.add(CONFIG.DRUM_MACHINE, 'BPM', 60, 180).onChange(value => {
            this.drumMachine.updateBPM(value);
        });
        
        drumFolder.add(this.settings, 'volume', 0, 1).onChange(value => {
            this.drumMachine.setVolume(value);
        });
        
        drumFolder.add(CONFIG.DRUM_MACHINE, 'SEGMENTS', 2, 8).step(1).onChange(value => {
            this.drumMachine.updateSegments(value);
        });
        
        drumFolder.open();
    }

    setupPhysicsControls() {
        const physicsFolder = this.gui.addFolder('Physics');
        
        physicsFolder.add(CONFIG.PHYSICS, 'GRAVITY', 0, 2);
        physicsFolder.add(CONFIG.PHYSICS, 'BOUNCE', 0, 1);
        physicsFolder.add(CONFIG.PHYSICS, 'FRICTION', 0, 0.2);
        physicsFolder.add(this.settings, 'showBallPhysics');
    }

    setupHandTrackingControls() {
        const handFolder = this.gui.addFolder('Hand Tracking');
        
        // Main toggles
        handFolder.add(this.settings, 'showHandTracking').name('Enable Hand Tracking');
        handFolder.add(this.settings, 'showCameraView').name('Show Camera');
        handFolder.add(this.settings, 'showHandVisuals').name('Show Hand Cursor');
        handFolder.add(this.settings, 'showNearestBall').name('Show Ball Distance');
        
        // Sensitivity controls
        const sensitivityFolder = handFolder.addFolder('Sensitivity');
        sensitivityFolder.add(CONFIG.HAND_TRACKING, 'CONFIDENCE_THRESHOLD', 0, 1).name('Confidence Threshold');
        sensitivityFolder.add(CONFIG.HAND_TRACKING, 'GRAB_THRESHOLD', 0, 1).name('Grab Threshold');
        
        // Visual settings
        const visualsFolder = handFolder.addFolder('Visual Settings');
        
        // Add hand position offset controls
        const offsetControls = {
            xOffset: 0,
            yOffset: 0,
            scale: 1.0,
            interactionRadius: this.handTracking.interactionRadius
        };
        
        visualsFolder.add(offsetControls, 'xOffset', -200, 200).name('X Offset').onChange(value => {
            this.handTracking.setOffset('x', value);
        });
        
        visualsFolder.add(offsetControls, 'yOffset', -200, 200).name('Y Offset').onChange(value => {
            this.handTracking.setOffset('y', value);
        });
        
        visualsFolder.add(offsetControls, 'scale', 0.5, 2).name('Movement Scale').onChange(value => {
            this.handTracking.setScale(value);
        });

        visualsFolder.add(offsetControls, 'interactionRadius', 30, 100).name('Interaction Range').onChange(value => {
            this.handTracking.interactionRadius = value;
        });

        // Camera view settings
        const cameraFolder = handFolder.addFolder('Camera View');
        const cameraSettings = {
            width: this.handTracking.cameraViewSize.width,
            height: this.handTracking.cameraViewSize.height,
            position: 'bottom-right'
        };

        cameraFolder.add(cameraSettings, 'width', 160, 480).step(40).name('Camera Width').onChange(value => {
            this.handTracking.cameraViewSize.width = value;
            this.updateCameraPosition(cameraSettings.position);
        });

        cameraFolder.add(cameraSettings, 'height', 120, 360).step(30).name('Camera Height').onChange(value => {
            this.handTracking.cameraViewSize.height = value;
            this.updateCameraPosition(cameraSettings.position);
        });

        cameraFolder.add(cameraSettings, 'position', ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
            .name('Camera Position')
            .onChange(value => this.updateCameraPosition(value));
        
        handFolder.open();
    }

    updateCameraPosition(position) {
        const padding = 20;
        const size = this.handTracking.cameraViewSize;
        
        switch (position) {
            case 'top-left':
                this.handTracking.cameraViewPosition = {
                    x: padding,
                    y: padding
                };
                break;
            case 'top-right':
                this.handTracking.cameraViewPosition = {
                    x: CONFIG.CANVAS.WIDTH - size.width - padding,
                    y: padding
                };
                break;
            case 'bottom-left':
                this.handTracking.cameraViewPosition = {
                    x: padding,
                    y: CONFIG.CANVAS.HEIGHT - size.height - padding
                };
                break;
            case 'bottom-right':
                this.handTracking.cameraViewPosition = {
                    x: CONFIG.CANVAS.WIDTH - size.width - padding,
                    y: CONFIG.CANVAS.HEIGHT - size.height - padding
                };
                break;
        }
    }

    setupVisualsControls() {
        const visualsFolder = this.gui.addFolder('Visuals');
        
        visualsFolder.add(this.settings, 'showDebugInfo');
        visualsFolder.addColor(CONFIG.DRUM_MACHINE, 'backgroundColor');
        
        // Ball size control
        visualsFolder.add(CONFIG.BALLS, 'SIZE', 20, 80).onChange(() => {
            // Trigger ball resize
            if (window.balls) {
                balls.forEach(ball => ball.updateSize());
            }
        });
    }

    setupAccessibilityControls() {
        const accessibilityFolder = this.gui.addFolder('Accessibility');
        
        const accessibilitySettings = {
            highContrastMode: false,
            largeText: false,
            reducedMotion: false,
            keyboardControls: true
        };
        
        accessibilityFolder.add(accessibilitySettings, 'highContrastMode').onChange(value => {
            document.body.classList.toggle('high-contrast', value);
        });
        
        accessibilityFolder.add(accessibilitySettings, 'largeText').onChange(value => {
            document.body.classList.toggle('large-text', value);
        });
        
        accessibilityFolder.add(accessibilitySettings, 'reducedMotion').onChange(value => {
            document.body.classList.toggle('reduced-motion', value);
        });
        
        accessibilityFolder.add(accessibilitySettings, 'keyboardControls');
    }

    draw() {
        if (this.settings.showDebugInfo) {
            this.drawDebugInfo();
        }
    }

    drawDebugInfo() {
        push();
        fill(255);
        noStroke();
        textSize(12);
        textAlign(LEFT, TOP);
        
        let y = CONFIG.DRUM_MACHINE.HEIGHT + 10;
        text(`FPS: ${floor(frameRate())}`, 10, y);
        text(`Active Balls: ${balls.length}`, 10, y + 15);
        text(`Current Beat: ${this.drumMachine.currentBeat}`, 10, y + 30);
        
        if (this.handTracking.predictions.length > 0) {
            text(`Hand Confidence: ${nf(this.handTracking.predictions[0].handInViewConfidence, 1, 2)}`, 10, y + 45);
        }
        
        pop();
    }
} 