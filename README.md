# Musical Body Bubbles

An interactive audio-visual experience that combines motion tracking with music visualization. Users can interact with musical bubbles using their body movements, creating an engaging and immersive experience.

## 🎮 Features

- Real-time body tracking using PoseNet
- Dynamic bubble generation synchronized with music beats
- Interactive particle effects
- Customizable visual settings through dat.GUI interface
- Real-time audio analysis and beat detection
- Score tracking system
- Debug mode for performance monitoring

## 🛠 Technical Requirements

- Modern web browser with WebGL support
- Webcam access
- Audio playback capability
- Recommended minimum resolution: 1280x720

## 📚 Dependencies

The project uses the following libraries:

- p5.js (v1.4.0) - For graphics and animation
- p5.sound.min.js - For audio analysis
- ml5.js (v0.12.2) - For PoseNet motion tracking
- dat.GUI (v0.7.9) - For interactive controls

## 🚀 Getting Started

1. Clone or download the repository
2. Ensure all files are in the same directory:

   - index.html
   - style.css
   - sketch.js
   - README.md

3. Start a local server (required for webcam access)

   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Python 2
   python -m SimpleHTTPServer 8000
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## 🎯 How to Play

1. Allow camera access when prompted
2. Wait for PoseNet to initialize
3. Click "Choose Music File" in the dat.GUI interface
4. Select an audio file to play
5. Move your hands to interact with the bubbles
6. Pop bubbles to score points!

## 🎛 Controls & Settings

### Game Controls

- Score display (read-only)

### Audio Settings

- Beat Sensitivity (0-300)
- Beat Smoothing (0-1)
- Beat Multiplier (0.1-3)
- Music file upload

### Bubble Settings

- Spawn Direction (Top/Bottom)
- Bubble Size (10-50)
- Opacity (0-1)
- Min/Max Speed
- Particle Count
- Color Settings:
  - Hue Range
  - Saturation
  - Brightness

### Debug Settings

- Debug Mode toggle
- Video feed visibility
- Video opacity
- Hand tracking confidence threshold

## 🎨 Visual Customization

The interface can be customized through the dat.GUI panel:

1. Adjust bubble colors using the Color Settings
2. Modify bubble size and opacity
3. Change spawn direction and speed
4. Fine-tune particle effects

## 🔧 Troubleshooting

### Common Issues:

1. **Camera Not Working**

   - Ensure camera permissions are granted
   - Check if another application is using the camera
   - Refresh the page

2. **Audio Not Playing**

   - Check if the file format is supported (.mp3, .wav)
   - Ensure audio permissions are granted
   - Try a different audio file

3. **Performance Issues**

   - Reduce video opacity or hide video
   - Lower particle count
   - Adjust beat sensitivity
   - Enable debug mode to monitor FPS

4. **PoseNet Not Loading**
   - Check internet connection (required for initial model load)
   - Clear browser cache and refresh
   - Try a different browser

## 🔍 Debug Mode

Enable debug mode to view:

- FPS counter
- Active bubble count
- Audio energy levels
- Hand tracking visualization

## 🎵 Audio Tips

For best results:

- Use high-quality audio files
- Songs with clear beats work best
- Adjust beat sensitivity to match the music
- Fine-tune smoothing for consistent bubble generation

## 🎮 Performance Tips

1. Optimal Settings:

   - Video Opacity: 127
   - Particle Count: 10
   - Beat Sensitivity: 230
   - Hand Confidence: 0.2

2. For Better Performance:
   - Reduce particle count
   - Lower video opacity
   - Increase minimum beat interval
   - Reduce bubble size

## 📝 File Structure

```
demonhead3/
├── index.html      # Main HTML file
├── style.css       # Styling and animations
├── sketch.js       # Game logic and interactions
└── README.md       # Documentation
```

## 🤝 Contributing

Feel free to fork and submit pull requests. For major changes, please open an issue first.

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- p5.js community
- ml5.js team
- dat.GUI contributors
