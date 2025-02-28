class Ball {
    constructor(x, y, instrument) {
        // Create sprite with optimized static properties
        this.sprite = new Sprite(x, y, CONFIG.BALLS.SIZE, CONFIG.BALLS.SIZE);
        this.sprite.bounciness = CONFIG.PHYSICS.BOUNCE;
        this.sprite.friction = CONFIG.PHYSICS.FRICTION;
        this.sprite.rotationLock = true;
        this.sprite.drag = 0.1; // Increased drag for smoother movement
        this.sprite.mass = 1;
        this.sprite.collider = 'dynamic';
        
        // Disable automatic sprite drawing
        this.sprite.visible = false;
        
        // Cache frequently used values
        this.size = CONFIG.BALLS.SIZE;
        this.instrument = instrument;
        this.color = color(instrument.color);
        this.emoji = instrument.emoji;
        this.emojiSize = this.size * 0.6;
        
        // Grab state with improved handling
        this.isGrabbed = false;
        this.grabOffset = createVector(0, 0);
        this.grabForce = CONFIG.HAND_TRACKING.GRAB_FORCE;
        this.targetPos = createVector(0, 0);
        this.lerpFactor = 0.2; // Smooth lerp factor for movement
        
        // Performance: Cache boundaries
        this.topBound = CONFIG.DRUM_MACHINE.HEIGHT;
        this.maxSpeed = 15; // Reduced max speed for better control
    }

    update(handX, handY, isGrabbing) {
        if (!this.sprite) return true;
        
        if (this.isGrabbed && isGrabbing) {
            // Calculate target position
            this.targetPos.set(handX + this.grabOffset.x, handY + this.grabOffset.y);
            
            // Smooth movement using lerp
            const targetX = lerp(this.sprite.x, this.targetPos.x, this.lerpFactor);
            const targetY = lerp(this.sprite.y, this.targetPos.y, this.lerpFactor);
            
            // Set velocity based on position difference
            this.sprite.vel.x = (targetX - this.sprite.x) / (1/60);
            this.sprite.vel.y = (targetY - this.sprite.y) / (1/60);
            
            // Limit velocity
            const speed = this.sprite.vel.mag();
            if (speed > this.maxSpeed) {
                this.sprite.vel.mult(this.maxSpeed / speed);
            }
            
            // Apply additional damping when grabbed
            this.sprite.vel.mult(0.95);
            
        } else if (isGrabbing) {
            this.isGrabbed = false;
        }

        // Check if ball hits the drum machine surface
        if (this.sprite.y < this.topBound) {
            drumMachine.addInstrument(this.instrument.name, false);
            return true; // Signal for removal and respawn
        }

        return false;
    }

    tryGrab(handX, handY) {
        if (!this.sprite) return false;
        
        // Early return if already grabbed
        if (this.isGrabbed) return true;
        
        // Optimized distance check using squared distance
        const dx = handX - this.sprite.x;
        const dy = handY - this.sprite.y;
        const distSquared = dx * dx + dy * dy;
        const radiusSquared = CONFIG.HAND_TRACKING.INTERACTION_RADIUS * CONFIG.HAND_TRACKING.INTERACTION_RADIUS;
        
        if (distSquared < radiusSquared) {
            this.isGrabbed = true;
            this.grabOffset.set(this.sprite.x - handX, this.sprite.y - handY);
            
            // Reset velocity when grabbed
            this.sprite.vel.x = 0;
            this.sprite.vel.y = 0;
            return true;
        }
        return false;
    }

    draw() {
        push();
        // Efficient ball drawing with cached values
        fill(this.color);
        noStroke();
        circle(this.sprite.x, this.sprite.y, this.size);
        
        // Optimized text rendering
        textAlign(CENTER, CENTER);
        textSize(this.emojiSize);
        text(this.emoji, this.sprite.x, this.sprite.y);

        // Only draw debug when necessary
        if (debugPanel.settings.showBallPhysics) {
            this.drawDebugInfo();
        }
        pop();
    }

    drawDebugInfo() {
        // Efficient debug visualization
        stroke(255, 0, 0);
        const velScale = 5;
        const endX = this.sprite.x + this.sprite.vel.x * velScale;
        const endY = this.sprite.y + this.sprite.vel.y * velScale;
        line(this.sprite.x, this.sprite.y, endX, endY);
        
        noFill();
        stroke(0, 255, 0);
        circle(this.sprite.x, this.sprite.y, this.size);
        
        noStroke();
        fill(255);
        textAlign(LEFT);
        textSize(10);
        text(`v: ${nf(this.sprite.vel.mag(), 1, 2)}`, this.sprite.x + this.size/2 + 5, this.sprite.y);
    }

    remove() {
        this.sprite.remove();
    }
} 