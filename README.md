# Emotional Hometown

From Rita: this is my capstone project where users build an emotional map of their life: five districts, each tied to a feeling, each holding real places from the person's memory. As you go along, you answer a few questions per district, watch your city unlock, then revisit it as a journal, a memory constellation, or a printed receipt. Showcased at the Sam Fox School Communication Design BFA Showcase in April 2026.

## Setup

### 1. Add font files
Place these in `/fonts`:
- `Hershey-Noailles-Futura-Simplex-Regular.ttf`
- `Meta-old-French.otf`
- `whois-mono.otf`

### 2. Add district images
Place these in `/assets/districts/`, one set per district (`garden`, `cornerstore`, `shrine`, `tower`, `plaza`):
- `{district}-locked.png`
- `{district}-hover.png`
- `{district}-unlocked.png`
- `{district}-skin2.png`, `{district}-skin3.png` These are alternate looks, selectable once unlocked.
- `{district}.png` This is the default skin thumbnail.

Also needed in `/assets/districts/`:
- `train.png`, `trainboard.png` choo choo time.
- `meow1.png`, `meow2.png`, `meow3.png` LMAO these names yea its archie the owl.

And in `/assets/`:
- `radio.png` tell em turn it up tell em turn it up.

### 3. Add audio files
Place these in `/assets/sounds/`:
- Background tracks referenced in `js/audio.js` (gentle guitar, melancholic ambient, midwest emo (this oen is for Elena))
- `chime1.wav`, `chime2.wav`, `chime3.wav` ding...

### 4. Run the project
Open `index.html` in a browser to start from the landing page, or `map.html` to go straight to the city.

## File structure

```
emotional-hometown/
├── index.html                    # landing/intro page
├── map.html                      # the city map (hub)
├── print.html                    # printable city receipt (thermal printer via WebUSB)
├── fonts/                        # font files
├── css/
│   ├── style.css                 # design system, global styles, custom cursor
│   ├── map.css                   # map view styles
│   ├── district.css              # shared styles for all district question flows
│   ├── customize.css             # shared styles for all district customize pages
│   ├── achievements.css          # achievement toast + panel styles
│   ├── guide-additions.css       # onboarding guide (mascot, spotlight, bubbles)
│   └── mobile-overlay.css        # "best viewed on desktop" mobile blocker
├── js/
│   ├── map.js                    # map state, districts, share/visit mode, memory views
│   ├── district.js               # shared setup for every district page (back button, entrance, etc.)
│   ├── customize.js               # shared logic for every district customize page
│   ├── garden.js, cornerstore.js,
│   │   shrine.js, tower.js, plaza.js  # per-district questions and completion flow
│   ├── achievements.js           # achievement definitions, unlocking, toast, panel
│   ├── audio.js                  # background music, radio station, sound effects
│   ├── guide.js                  # onboarding walkthroughs (map + customize pages)
│   ├── train.js                  # the wandering train / train board feature
│   ├── printer.js                # builds and sends the city receipt to a thermal printer
│   └── cursor-loader.js          # custom cursor, page transitions, loading bar
├── assets/
│   ├── districts/                # district images (locked/hover/unlocked/skins), train, meow images
│   └── sounds/                   # background music + chimes
└── districts/
    ├── garden.html, garden-customize.html
    ├── cornerstore.html, cornerstore-customize.html
    ├── shrine.html, shrine-customize.html
    ├── tower.html, tower-customize.html
    └── plaza.html, plaza-customize.html
```

## District states

- **Locked** shrine, garden, etc. show the locked illustration until the person answers all its questions.
- **Hover** (locked only) shows the hover illustration and reveals the emotion label.
- **Unlocked** shows the unlocked illustration (or a chosen alternate skin), label always visible, clicking opens the customize page instead of the question flow.

## Districts

| District | Emotion |
|---|---|
| Garden | Growth |
| Cornerstore | Routine |
| Shrine | Reverence |
| Tower | Solitude |
| Plaza | Community |

Each district asks the same six-question shape: a place, a feeling specific to that district's emotion, a sensory memory, a "what would be lost," and a name for the district.

## Core features

- **Map** — the five districts, a settings panel (dark mode, randomize layout, sound), and an achievements button.
- **Customize pages** — per-district journal of past entries, a memory constellation view, and an album view for photos/songs.
- **Memories picker** — from the map, a "See memories" panel offering three views: Topography (rings of recency per district), Constellation (word frequencies across all districts), and Report (stats + most frequent words, with a Print button).
- **Share** — generates a city code; a friend can paste it into "Friend cities" to view a read-only version of your map and constellation. (Currently a work-in-progress feature — a banner in the Share modal notes this.)
- **Achievements** — unlockable for exploring, completing, returning to, and naming districts, plus city-wide milestones. Toasts only appear on the map page; district and customize pages record achievements silently.
- **Train** — occasionally appears on the map as a place to jot down a passing thought, either pinned to a district or kept at the "station" (train board) for later.
- **Guide** — an onboarding walkthrough (a bird mascot) on first visit to the map and to each customize page, with a condensed summary on repeat visits.
- **Print** — the Report view's Print button opens `print.html`, which can send a formatted receipt to a Rongta RP326 thermal printer over WebUSB (Chrome/Edge only). Shout out to my receipt printer <3

## Browser support notes

- The site uses a custom cursor and hides the native one everywhere (`cursor: none !important`), so it's designed for pointer/mouse use a mobile overlay tells phone/tablet visitors to switch to desktop.
- WebUSB printing (`print.html`) only works in Chromium-based browsers (Chrome, Edge); other browsers will see a clear "not supported" message instead of a broken button.