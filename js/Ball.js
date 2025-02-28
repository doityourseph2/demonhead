class Ball {
    constructor(x, y, instrument) {
        // Create sprite with static properties
        this.sprite = new Sprite(x, y, CONFIG.BALLS.SIZE);
        this.sprite.bounciness = CONFIG.PHYSICS.BOUNCE;
        this.sprite.friction = CONFIG.PHYSICS.FRICTION;
        this.sprite.rotationLock = true;
        this.sprite.drag = 0.05;
        this.sprite.mass = 1;
        this.sprite.collider = 'dynamic';
        
        // Cache frequently used values
        this.size = CONFIG.BALLS.SIZE;
        this.instrument = instrument;
        this.color = instrument.color;
        this.emoji = instrument.emoji;
        
        // Grab state
        this.isGrabbed = false;
        this.grabOffset = createVector(0, 0);
        this.grabForce = CONFIG.HAND_TRACKING.GRAB_FORCE;
        
        // Performance optimization: Pre-calculate text size
        this.emojiSize = this.size * 0.6;
    }

    update(handX, handY, isGrabbing) {
        if (this.isGrabbed && isGrabbing) {
            // Calculate target position
            const targetX = handX + this.grabOffset.x;
            const targetY = handY + this.grabOffset.y;
            
            // Apply force towards target position with optimized calculations
            const dx = targetX - this.sprite.x;
            const dy = targetY - this.sprite.y;
            
            // Apply force with grab force multiplier
            this.sprite.vel.x += dx * this.grabForce;
            this.sprite.vel.y += dy * this.grabForce;
            
            // Optimize velocity limiting
            const currentSpeed = this.sprite.vel.mag();
            if (currentSpeed > 20) {
                const scale = 20 / currentSpeed;
                this.sprite.vel.mult(scale);
            }
        } else {
            this.isGrabbed = false;
        }

        // Check if ball hits sides
        if (this.sprite.x < 0 || this.sprite.x > CONFIG.CANVAS.WIDTH) {
            const permanent = this.sprite.x < CONFIG.CANVAS.WIDTH / 2;
            drumMachine.addInstrument(this.instrument.name, permanent);
            return true; // Signal for removal
        }

        return false;
    }

    tryGrab(handX, handY) {
        // Optimize distance calculation
        const dx = handX - this.sprite.x;
        const dy = handY - this.sprite.y;
        const d = sqrt(dx * dx + dy * dy);
        
        if (d < CONFIG.HAND_TRACKING.INTERACTION_RADIUS) {
            this.isGrabbed = true;
            this.grabOffset.x = this.sprite.x - handX;
            this.grabOffset.y = this.sprite.y - handY;
            return true;
        }
        return false;
    }

    draw() {
        push();
        // Draw ball with cached values
        fill(this.color);
        noStroke();
        circle(this.sprite.x, this.sprite.y, this.size);
        
        // Draw emoji with cached size
        textSize(this.emojiSize);
        textAlign(CENTER, CENTER);
        text(this.emoji, this.sprite.x, this.sprite.y);

        // Only draw debug info if necessary
        if (debugPanel.settings.showBallPhysics) {
            this.drawDebugInfo();
        }
        
        pop();
    }

    drawDebugInfo() {
        stroke(255, 0, 0);
        const velScale = 5;
        line(
            this.sprite.x,
            this.sprite.y,
            this.sprite.x + this.sprite.vel.x * velScale,
            this.sprite.y + this.sprite.vel.y * velScale
        );
        
        noFill();
        stroke(0, 255, 0);
        circle(this.sprite.x, this.sprite.y, this.size);
        
        noStroke();
        fill(255);
        textSize(10);
        textAlign(LEFT);
        text(`v: ${nf(this.sprite.vel.mag(), 1, 2)}`, this.sprite.x + this.size/2 + 5, this.sprite.y);
    }

    remove() {
        this.sprite.remove();
    }
} 