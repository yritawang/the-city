# Your City is Always Being Built
## Setup Instructions

### 1. Add Font Files
Place these font files in the `/fonts` directory:
- `Hershey-Noailles-Futura-Simplex-Regular.ttf`
- `Meta-old-French.otf`
- `whois-mono.otf`

### 2. Add District Images
Place district images in `/assets/districts/` with this naming convention:
- `garden-locked.png`, `garden-hover.png`, `garden-unlocked.png`
- `cornerstore-locked.png`, `cornerstore-hover.png`, `cornerstore-unlocked.png`
- `shrine-locked.png`, `shrine-hover.png`, `shrine-unlocked.png`
- `tower-locked.png`, `tower-hover.png`, `tower-unlocked.png`
- `plaza-locked.png`, `plaza-hover.png`, `plaza-unlocked.png`
- 'train.png', 'trainboard.png'

### 3. Run the Project
Open `index.html` in a browser to start the experience.

## File Structure
```
emotional-hometown/
├── index.html              # Intro screen
├── map.html                # Map view (hub)
├── fonts/                  # Font files
├── css/
│   ├── style.css          # Design system & global styles
│   ├── intro.css          # Intro screen styles
│   └── map.css            # Map view styles
├── js/
│   ├── intro.js           # Intro screen logic
│   └── map.js             # Map view logic & state management
├── assets/
│   └── districts/         # District images (locked, hover, unlocked)
└── districts/             # Individual district flows (coming next)
```

## District States
- **Locked**: Shows locked image, 40% opacity
- **Hover**: Shows hover image, 70% opacity, emotion label appears
- **Unlocked**: Shows unlocked image, 100% opacity, label visible

## Next Steps
1. Build Shrine district flow (`districts/shrine.html`)
2. Add reflection questions for Shrine
3. Create completion flow that unlocks the district
