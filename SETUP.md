# Emotional Hometown - Setup & Next Steps

## ✅ What's Been Built

### 1. Intro Screen
- Auto-fades after 5 seconds
- Transitions to map

### 2. Map View (Hub)
- 5 districts with locked/hover/unlocked states
- Clickable city name to rename
- "Back to city" navigation
- Progress tracking with localStorage

### 3. Shrine District (Complete!)
- "Entering the Shrine" overlay (3 seconds)
- Intro prompt with delayed "Ready?" button
- 6 reflection questions with:
  - Large textarea inputs
  - Stacked progress cards (clickable)
  - Right-side progress bar
  - Back/Next navigation
  - Auto-save to localStorage
- Unlocks district on completion

## 📋 To Test Locally

1. **Add your fonts** to `/fonts/`:
   - Hershey-Noailles-Futura-Simplex-Regular.ttf
   - Meta-old-French.otf
   - whois-mono.otf

2. **Add district images** to `/assets/districts/`:
   - garden-locked.png, garden-hover.png, garden-unlocked.png
   - cornerstore-locked.png, cornerstore-hover.png, cornerstore-unlocked.png
   - shrine-locked.png, shrine-hover.png, shrine-unlocked.png
   - tower-locked.png, tower-hover.png, tower-unlocked.png
   - plaza-locked.png, plaza-hover.png, plaza-unlocked.png

3. **Open `index.html`** in your browser

## 🎯 Next Steps

### Immediate:
1. Test the Shrine flow completely
2. Verify all interactions work
3. Check responsive design on mobile

### To Build:
1. **Garden district** (growth) - replicate Shrine structure
2. **Cornerstore district** (comfort)
3. **Tower district** (perspective)
4. **Plaza district** (belonging)

### Features to Add:
1. **Final map view** - Show unlocked districts with user's names
2. **Save/Export** - Print or download the emotional hometown
3. **Guide modal** - Explain the experience
4. **Share functionality** - Export as image or PDF

## 🔧 Code Structure

Each district should follow this pattern:
1. Copy `districts/shrine.html` → `districts/[name].html`
2. Update colors in CSS (add new color variables)
3. Update questions in JS
4. Update district metadata (emotion, questions)

All district data is stored in localStorage with these keys:
- `districtStates` - locked/unlocked status
- `[district]-answers` - user responses
- `[district]-name` - user's name for that district
- `cityName` - overall city name

## 📝 Design System Reference

### Colors:
- Background: `#F7F2F1`
- Black: `#101010`
- Shrine Orange: `#DD6204`
- Shrine Card: `#FCEBDF`
- Progress Cards: `#E0D0C5, #D4B49D, #BE9A80, #AC8467, #9F6F4C`

### Fonts:
- **Hershey** (sans) - Headings, titles
- **Meta** (serif) - Body text, subtitles
- **Whois** (mono) - Buttons, UI elements

### Typography Scale:
- h1: 3.5rem (questions), 3rem (intro)
- h2: 1.5rem (headers)
- h3: 1.5rem (prompts), 1.2rem (subtext)
- Body: 1.1rem
- Buttons: 1rem

Ready to test! Let me know if anything needs adjustment.
