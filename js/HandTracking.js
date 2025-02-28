class HandTracking {
    constructor() {
        // Initialize properties
        this.predictions = [];
        this.isGrabbing = false;
        this.handX = 0;
        this.handY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.scale = 1.0;
        
        // Camera view settings
        this.cameraViewSize = {
            width: 320,
            height: 240
        };
        this.cameraViewPosition = {
            x: CONFIG.CANVAS.WIDTH - this.cameraViewSize.width - 20,
            y: CONFIG.CANVAS.HEIGHT - this.cameraViewSize.height - 20
        };

        // Visualization settings
        this.interactionRadius = 50;
        this.grabHistory = [];
        this.maxHistoryLength = 10;
        
        // Initialize handpose model
        this.initializeHandpose();
    }

    async initializeHandpose() {
        try {
            // Create video element for handpose
            this.video = capture;
            
            // Load handpose model
            this.model = await ml5.handpose(this.video, () => {
                console.log('HandPose Model Loaded');
                
                // Start detecting
                this.model.on('predict', results => {
                    this.predictions = results;
                    this.updateHandState();
                });
            });
            
        } catch (error) {
            console.error('Error initializing handpose:', error);
        }
    }

    setOffset(axis, value) {
        if (axis === 'x') this.xOffset = value;
        if (axis === 'y') this.yOffset = value;
    }

    setScale(value) {
        this.scale = value;
    }

    calculateGrabScore(prediction) {
        // Get fingertip positions
        const thumbTip = prediction.annotations.thumb[3];
        const indexTip = prediction.annotations.indexFinger[3];
        const middleTip = prediction.annotations.middleFinger[3];
        const ringTip = prediction.annotations.ringFinger[3];
        const pinkyTip = prediction.annotations.pinky[3];
        
        // Get palm center
        const palmBase = prediction.annotations.palmBase[0];
        
        // Calculate average distance from fingertips to palm
        const fingerDistances = [
            dist(thumbTip[0], thumbTip[1], palmBase[0], palmBase[1]),
            dist(indexTip[0], indexTip[1], palmBase[0], palmBase[1]),
            dist(middleTip[0], middleTip[1], palmBase[0], palmBase[1]),
            dist(ringTip[0], ringTip[1], palmBase[0], palmBase[1]),
            dist(pinkyTip[0], pinkyTip[1], palmBase[0], palmBase[1])
        ];
        
        // Calculate average finger spread
        const avgDistance = fingerDistances.reduce((a, b) => a + b) / fingerDistances.length;
        const normalizedDistance = avgDistance / (capture.width * 0.2); // Normalize to screen width
        
        // Return grab score (0 = closed hand, 1 = open hand)
        return constrain(normalizedDistance, 0, 1);
    }

    updateHandState() {
        if (this.predictions.length > 0) {
            const prediction = this.predictions[0];
            
            // Get hand position (palm base)
            const palmBase = prediction.annotations.palmBase[0];
            
            // Apply scale and offset to hand position, and flip X coordinate
            this.handX = map(capture.width - palmBase[0], 0, capture.width, 0, CONFIG.CANVAS.WIDTH) * this.scale + this.xOffset;
            this.handY = map(palmBase[1], 0, capture.height, 0, CONFIG.CANVAS.HEIGHT) * this.scale + this.yOffset;
            
            // Calculate grab state using finger positions
            const grabScore = this.calculateGrabScore(prediction);
            this.isGrabbing = grabScore < CONFIG.HAND_TRACKING.GRAB_THRESHOLD &&
                             prediction.handInViewConfidence > CONFIG.HAND_TRACKING.CONFIDENCE_THRESHOLD;

            // Update grab history for trail effect
            if (this.isGrabbing) {
                this.grabHistory.push({ x: this.handX, y: this.handY });
                if (this.grabHistory.length > this.maxHistoryLength) {
                    this.grabHistory.shift();
                }
            } else {
                this.grabHistory = [];
            }

            // Debug output
            if (debugPanel.settings.showDebugInfo) {
                console.log('Grab Score:', grabScore);
            }
        }
    }

    getHandPosition() {
        return {
            x: this.handX,
            y: this.handY,
            isGrabbing: this.isGrabbing,
            confidence: this.predictions.length > 0 ? this.predictions[0].handInViewConfidence : 0
        };
    }

    drawCameraView() {
        push();
        // Draw camera background
        fill(0);
        stroke(255);
        rect(
            this.cameraViewPosition.x,
            this.cameraViewPosition.y,
            this.cameraViewSize.width,
            this.cameraViewSize.height
        );
        
        // Draw camera feed (flipped horizontally)
        if (capture.loadedmetadata) {
            push();
            translate(this.cameraViewPosition.x + this.cameraViewSize.width, this.cameraViewPosition.y);
            scale(-1, 1);
            image(
                capture,
                0,
                0,
                this.cameraViewSize.width,
                this.cameraViewSize.height
            );
            pop();
        }
        
        // Draw hand tracking overlay
        if (this.predictions.length > 0) {
            const prediction = this.predictions[0];
            
            push();
            translate(this.cameraViewPosition.x + this.cameraViewSize.width, this.cameraViewPosition.y);
            scale(-1, 1);
            
            // Draw all keypoints
            stroke(0, 255, 0);
            strokeWeight(4);
            noFill();
            
            // Draw hand skeleton
            this.drawHandSkeleton(prediction);
            
            // Draw grab indicator
            if (this.isGrabbing) {
                stroke(255, 0, 0);
                noFill();
                const palmBase = prediction.annotations.palmBase[0];
                const handX = map(palmBase[0], 0, capture.width, 0, this.cameraViewSize.width);
                const handY = map(palmBase[1], 0, capture.height, 0, this.cameraViewSize.height);
                circle(handX, handY, 30);
            }
            pop();
        }
        
        pop();
    }

    drawHandSkeleton(prediction) {
        // Draw palm
        const palm = prediction.annotations.palmBase;
        this.drawKeypoint(palm[0]);

        // Draw thumb
        const thumb = prediction.annotations.thumb;
        this.drawFingerLines(thumb);

        // Draw fingers
        const fingers = [
            prediction.annotations.indexFinger,
            prediction.annotations.middleFinger,
            prediction.annotations.ringFinger,
            prediction.annotations.pinky
        ];

        fingers.forEach(finger => {
            this.drawFingerLines(finger);
        });
    }

    drawFingerLines(finger) {
        for (let i = 0; i < finger.length - 1; i++) {
            const x1 = map(finger[i][0], 0, capture.width, 
                this.cameraViewPosition.x, 
                this.cameraViewPosition.x + this.cameraViewSize.width);
            const y1 = map(finger[i][1], 0, capture.height,
                this.cameraViewPosition.y,
                this.cameraViewPosition.y + this.cameraViewSize.height);
            const x2 = map(finger[i + 1][0], 0, capture.width,
                this.cameraViewPosition.x,
                this.cameraViewPosition.x + this.cameraViewSize.width);
            const y2 = map(finger[i + 1][1], 0, capture.height,
                this.cameraViewPosition.y,
                this.cameraViewPosition.y + this.cameraViewSize.height);
            
            line(x1, y1, x2, y2);
            this.drawKeypoint([finger[i][0], finger[i][1]]);
        }
        this.drawKeypoint([finger[finger.length - 1][0], finger[finger.length - 1][1]]);
    }

    drawKeypoint(point) {
        const x = map(point[0], 0, capture.width,
            this.cameraViewPosition.x,
            this.cameraViewPosition.x + this.cameraViewSize.width);
        const y = map(point[1], 0, capture.height,
            this.cameraViewPosition.y,
            this.cameraViewPosition.y + this.cameraViewSize.height);
        
        circle(x, y, 5);
    }

    drawMainCanvas() {
        if (this.predictions.length > 0 && debugPanel.settings.showHandVisuals) {
            push();
            
            // Draw interaction zone
            noFill();
            stroke(255, 255, 255, 50);
            circle(this.handX, this.handY, this.interactionRadius * 2);
            
            // Draw grab history trail
            if (this.grabHistory.length > 1) {
                beginShape();
                noFill();
                strokeWeight(2);
                for (let i = 0; i < this.grabHistory.length; i++) {
                    const alpha = map(i, 0, this.grabHistory.length - 1, 50, 255);
                    stroke(255, 0, 0, alpha);
                    vertex(this.grabHistory[i].x, this.grabHistory[i].y);
                }
                endShape();
            }
            
            // Draw hand cursor
            stroke(255);
            strokeWeight(2);
            noFill();
            
            // Draw hand position indicator with dynamic feedback
            if (this.isGrabbing) {
                // Grab state
                stroke(255, 0, 0);
                fill(255, 0, 0, 100);
                circle(this.handX, this.handY, 40);
                
                // Draw "grab" text
                fill(255);
                noStroke();
                textSize(14);
                textAlign(CENTER);
                text("GRAB", this.handX, this.handY - 30);
            } else {
                // Normal state
                stroke(255);
                noFill();
                circle(this.handX, this.handY, 30);
            }
            
            // Draw confidence indicator
            const confidence = this.predictions[0].handInViewConfidence;
            fill(255);
            noStroke();
            textSize(12);
            textAlign(CENTER);
            text(`${nf(confidence * 100, 0, 1)}%`, this.handX, this.handY + 30);
            
            // Draw nearest ball indicator if in range
            if (debugPanel.settings.showNearestBall) {
                this.drawNearestBallIndicator();
            }
            
            pop();
        }
    }

    drawNearestBallIndicator() {
        let nearestBall = null;
        let nearestDist = Infinity;
        
        balls.forEach(ball => {
            const d = dist(this.handX, this.handY, ball.sprite.x, ball.sprite.y);
            if (d < nearestDist) {
                nearestDist = d;
                nearestBall = ball;
            }
        });
        
        if (nearestBall && nearestDist < this.interactionRadius) {
            stroke(255, 255, 0);
            strokeWeight(1);
            line(this.handX, this.handY, nearestBall.sprite.x, nearestBall.sprite.y);
            
            // Draw distance indicator
            fill(255, 255, 0);
            noStroke();
            textSize(10);
            const midX = (this.handX + nearestBall.sprite.x) / 2;
            const midY = (this.handY + nearestBall.sprite.y) / 2;
            text(`${nf(nearestDist, 0, 1)}px`, midX, midY);
        }
    }

    draw() {
        if (!debugPanel.settings.showHandTracking) return;
        
        // Draw camera view with hand tracking
        if (debugPanel.settings.showCameraView) {
            this.drawCameraView();
        }
        
        // Draw main canvas visualizations
        this.drawMainCanvas();
    }
} 