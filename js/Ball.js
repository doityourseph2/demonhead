class Ball {
    constructor(x, y, instrument) {
        // Create sprite with optimized static properties
        this.sprite = new Sprite(x, y, CONFIG.BALLS.SIZE);
        this.sprite.bounciness = CONFIG.PHYSICS.BOUNCE;
        this.sprite.friction = CONFIG.PHYSICS.FRICTION;
        this.sprite.rotationLock = true;
        this.sprite.drag = 0.05;
        this.sprite.mass = 1;
        this.sprite.collider = 'dynamic';
        
        // Disable automatic sprite drawing to handle it manually
        this.sprite.visible = false;
        
        // Cache frequently used values
        this.size = CONFIG.BALLS.SIZE;
        this.instrument = instrument;
        this.color = color(instrument.color); // Pre-create color object
        this.emoji = instrument.emoji;
        this.emojiSize = this.size * 0.6;
        
        // Grab state with optimized vectors
        this.isGrabbed = false;
        this.grabOffset = createVector(0, 0);
        this.grabForce = CONFIG.HAND_TRACKING.GRAB_FORCE;
        this.targetPos = createVector(0, 0);
        
        // Performance: Cache boundaries
        this.topBound = CONFIG.DRUM_MACHINE.HEIGHT; // Update to use drum machine height
        this.maxSpeed = 20;
    }

    update(handX, handY, isGrabbing) {
        if (this.isGrabbed && isGrabbing) {
            // Calculate target position once
            this.targetPos.set(
                handX + this.grabOffset.x,
                handY + this.grabOffset.y
            );
            
            // Optimized force calculation
            const dx = this.targetPos.x - this.sprite.x;
            const dy = this.targetPos.y - this.sprite.y;
            
            // Apply force with grab force multiplier
            this.sprite.vel.x += dx * this.grabForce;
            this.sprite.vel.y += dy * this.grabForce;
            
            // Efficient velocity limiting
            const currentSpeed = this.sprite.vel.mag();
            if (currentSpeed > this.maxSpeed) {
                this.sprite.vel.mult(this.maxSpeed / currentSpeed);
            }
        } else {
            this.isGrabbed = false;
        }

        // Check if ball hits the drum machine surface (top)
        if (this.sprite.y < this.topBound) {
            // Add instrument to drum machine for 4 segments
            drumMachine.addInstrument(this.instrument.name, false);
            return true; // Signal for removal and respawn
        }

        return false;
    }

    tryGrab(handX, handY) {
        // Optimized distance check using squared distance
        const dx = handX - this.sprite.x;
        const dy = handY - this.sprite.y;
        const distSquared = dx * dx + dy * dy;
        const radiusSquared = CONFIG.HAND_TRACKING.INTERACTION_RADIUS * CONFIG.HAND_TRACKING.INTERACTION_RADIUS;
        
        if (distSquared < radiusSquared) {
            this.isGrabbed = true;
            this.grabOffset.set(this.sprite.x - handX, this.sprite.y - handY);
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