const CONFIG = {
    CANVAS: {
        WIDTH: 1024,
        HEIGHT: 768
    },
    DRUM_MACHINE: {
        HEIGHT: 120,
        SEGMENTS: 4,
        BPM: 120,
        backgroundColor: '#1E1E1E'
    },
    BALLS: {
        COUNT: 9,
        SIZE: 40,
        INSTRUMENTS: [
            { name: 'kick', emoji: '🥁', color: '#FF6B6B', sound: 'kick.mp3' },
            { name: 'snare', emoji: '🪘', color: '#4ECDC4', sound: 'snare.mp3' },
            { name: 'hihat', emoji: '🎪', color: '#45B7D1', sound: 'hihat.mp3' },
            { name: 'clap', emoji: '👏', color: '#96CEB4', sound: 'clap.mp3' },
            { name: 'tom', emoji: '🥁', color: '#FFEEAD', sound: 'tom.mp3' },
            { name: 'crash', emoji: '💥', color: '#D4A5A5', sound: 'crash.mp3' },
            { name: 'percussion', emoji: '🎵', color: '#9B9B9B', sound: 'percussion.mp3' },
            { name: 'shaker', emoji: '🎼', color: '#FFD93D', sound: 'shaker.mp3' },
            { name: 'cymbal', emoji: '🎶', color: '#6C5B7B', sound: 'cymbal.mp3' }
        ]
    },
    PHYSICS: {
        GRAVITY: 0.5,
        BOUNCE: 0.7,
        FRICTION: 0.05
    },
    HAND_TRACKING: {
        CONFIDENCE_THRESHOLD: 0.7,
        GRAB_THRESHOLD: 0.35,
        MIN_FINGER_DISTANCE: 30,
        MAX_FINGER_DISTANCE: 150,
        INTERACTION_RADIUS: 80,
        GRAB_FORCE: 0.8
    },
    ACCESSIBILITY: {
        HIGH_CONTRAST_COLORS: {
            background: '#000000',
            foreground: '#FFFFFF',
            accent: '#FFD700'
        },
        LARGE_TEXT_SCALE: 1.5,
        REDUCED_MOTION: {
            ballSpeed: 0.5,
            animationDuration: 0.5
        }
    }
}; 