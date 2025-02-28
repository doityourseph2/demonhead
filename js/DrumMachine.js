class DrumMachine {
    constructor() {
        this.segments = CONFIG.DRUM_MACHINE.SEGMENTS;
        this.currentBeat = 0;
        this.beatProgress = 0;
        this.instruments = new Map();
        this.sounds = new Map();
        this.isPlaying = true;
        this.lastBeatTime = 0;
        this.beatInterval = (60 / CONFIG.DRUM_MACHINE.BPM) * 1000;
        this.volume = 1.0;
        this.soundsLoaded = false;
        
        this.loadSounds();
    }

    loadSounds() {
        let loadedCount = 0;
        const totalSounds = CONFIG.BALLS.INSTRUMENTS.length;
        
        CONFIG.BALLS.INSTRUMENTS.forEach(inst => {
            loadSound(`sounds/${inst.sound}`, sound => {
                this.sounds.set(inst.name, sound);
                loadedCount++;
                if (loadedCount === totalSounds) {
                    this.soundsLoaded = true;
                    console.log('All sounds loaded');
                }
            });
        });
    }

    updateBPM(bpm) {
        CONFIG.DRUM_MACHINE.BPM = bpm;
        this.beatInterval = (60 / bpm) * 1000;
    }

    setVolume(volume) {
        this.volume = volume;
        this.sounds.forEach(sound => {
            sound.setVolume(volume);
        });
    }

    updateSegments(count) {
        const oldSegments = this.segments;
        this.segments = count;
        
        // Update existing instruments to match new segment count
        this.instruments.forEach((instrument, name) => {
            const newSegments = new Array(count).fill(false);
            for (let i = 0; i < Math.min(oldSegments, count); i++) {
                newSegments[i] = instrument.segments[i];
            }
            instrument.segments = newSegments;
        });
        
        // Reset current beat if it's beyond the new segment count
        if (this.currentBeat >= count) {
            this.currentBeat = 0;
        }
    }

    addInstrument(name, permanent = false) {
        if (!this.instruments.has(name)) {
            // Initialize segments array with false values
            const segments = new Array(this.segments).fill(false);
            
            // For temporary instruments, set next 4 segments to true
            if (!permanent) {
                const startBeat = (this.currentBeat + 1) % this.segments;
                for (let i = 0; i < 4; i++) {
                    segments[(startBeat + i) % this.segments] = true;
                }
            }
            
            this.instruments.set(name, {
                permanent,
                segments,
                playsRemaining: permanent ? -1 : 4 // Track remaining plays for temporary instruments
            });
        }
    }

    update() {
        const currentTime = millis();
        if (currentTime - this.lastBeatTime >= this.beatInterval) {
            this.lastBeatTime = currentTime;
            this.currentBeat = (this.currentBeat + 1) % this.segments;
            this.playCurrentBeat();
        }
        
        this.beatProgress = (currentTime - this.lastBeatTime) / this.beatInterval;
    }

    playCurrentBeat() {
        if (!this.soundsLoaded) return;
        
        this.instruments.forEach((instrument, name) => {
            if (instrument.segments[this.currentBeat]) {
                const sound = this.sounds.get(name);
                if (sound && sound.isLoaded()) {
                    try {
                        const clone = sound.play();
                        if (clone) {
                            clone.setVolume(this.volume);
                        }
                        
                        // For temporary instruments, clear the current segment after playing
                        if (!instrument.permanent) {
                            instrument.segments[this.currentBeat] = false;
                            instrument.playsRemaining--;
                            
                            // Remove instrument if all plays are done
                            if (instrument.playsRemaining <= 0) {
                                this.instruments.delete(name);
                            }
                        }
                    } catch (error) {
                        console.warn(`Error playing sound ${name}:`, error);
                    }
                }
            }
        });
    }

    draw() {
        push();
        translate(0, 0);
        
        // Draw segments
        const segmentWidth = CONFIG.CANVAS.WIDTH / this.segments;
        const height = CONFIG.DRUM_MACHINE.HEIGHT;
        
        // Background
        fill(30);
        noStroke();
        rect(0, 0, CONFIG.CANVAS.WIDTH, height);
        
        // Draw beat segments
        for (let i = 0; i < this.segments; i++) {
            const x = i * segmentWidth;
            
            // Segment background
            fill(i % 2 === 0 ? 40 : 35);
            rect(x, 0, segmentWidth, height);
            
            // Draw instruments in this segment
            let yOffset = 10;
            this.instruments.forEach((instrument, name) => {
                if (instrument.segments[i]) {
                    const inst = CONFIG.BALLS.INSTRUMENTS.find(inst => inst.name === name);
                    if (inst) {
                        // Draw instrument emoji with opacity based on remaining plays
                        push();
                        if (!instrument.permanent) {
                            const opacity = map(instrument.playsRemaining, 0, 4, 50, 255);
                            tint(255, opacity);
                        }
                        textSize(24);
                        text(inst.emoji, x + segmentWidth/2 - 12, yOffset + 24);
                        pop();
                        yOffset += 30;
                    }
                }
            });
        }
        
        // Draw beat line
        const beatX = (this.currentBeat + this.beatProgress) * segmentWidth;
        stroke(255, 100);
        strokeWeight(2);
        line(beatX, 0, beatX, height);
        
        pop();
    }
} 