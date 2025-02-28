# Interactive Drum Machine Installation

An immersive drum machine installation that uses hand tracking to create music through physical interaction with virtual instruments.

## 🎵 Features

- Hand-tracked interaction with virtual drum instruments
- Physics-based ball movement and collision
- Real-time beat sequencing
- Visual feedback for hand tracking and interactions
- Debug panel for fine-tuning and visualization options

## 🖐️ How to Interact

1. **Setup Your Space**

   - Ensure good lighting in your room
   - Position yourself about 1-2 feet away from your camera
   - Make sure your hand is clearly visible in the camera view

2. **Hand Gestures**

   - **Open Hand**: Move freely without grabbing balls
   - **Closed Hand**: Grab and move balls
   - **Quick Release**: "Throw" balls to create dynamic movements

3. **Playing with Balls**

   - Approach a ball with your hand
   - Close your fingers to grab (make a fist)
   - Move the ball while keeping your hand closed
   - Release by opening your hand
   - Each ball represents a different drum sound
   - Balls create sounds when colliding with the drum machine

4. **Tips for Better Interaction**
   - Make clear, deliberate hand gestures
   - Keep your hand within the camera's field of view
   - Watch the camera preview to understand your hand's position
   - Use the debug panel to adjust sensitivity if needed

## ⚙️ Configuration

The installation can be fine-tuned through the debug panel:

- **Hand Tracking**

  - Confidence Threshold: 0.7 (default)
  - Grab Threshold: 0.35 (lower = easier to grab)
  - Interaction Radius: 80 pixels
  - Grab Force: 0.8 (affects ball movement)

- **Visual Feedback**
  - Camera preview toggle
  - Hand tracking visualization
  - Debug information
  - Nearest ball indicator

## 🎨 Instruments

The installation includes 9 different drum instruments:

- 🥁 Kick
- 🪘 Snare
- 🎪 Hi-hat
- 👏 Clap
- 🥁 Tom
- 💥 Crash
- 🎵 Percussion
- 🎼 Shaker
- 🎶 Cymbal

## 🔧 Troubleshooting

If you're having trouble interacting with the balls:

1. **Hand Not Detected**

   - Check your lighting
   - Ensure your hand is clearly visible
   - Try moving closer/further from the camera

2. **Can't Grab Balls**

   - Make more pronounced grabbing gestures
   - Ensure your hand is close enough to the ball
   - Check the debug panel for grab score
   - Adjust grab threshold if needed

3. **Balls Not Responding**
   - Verify hand tracking is working (camera preview)
   - Make sure you're within interaction radius
   - Try adjusting the grab force in config
   - Check for any console errors

## 🎮 Debug Panel

Use the debug panel to:

- Toggle camera view
- Show/hide hand tracking visualization
- Display grab scores and confidence values
- Adjust interaction parameters
- Monitor performance

## 🔄 Updates

The installation is continuously being improved. Check back for:

- New instruments
- Enhanced interaction methods
- Performance optimizations
- Additional visual feedback
