# 🎨 Pixel Art Maker

**A full-featured pixel art editor in the browser — draw, fill, undo, save to a gallery, and export your creations as PNG.**

Day 12 (featured build) of my daily coding journey — two projects shipped every day.

## What you can do
- 🖌️ **Brush, eraser, and bucket fill** (real flood-fill algorithm)
- 🎛️ **Three grid sizes**: 8×8, 16×16, 32×32
- 🌈 12-color starter palette **plus a custom color picker**
- ↩️ **Undo** (up to 50 steps) and one-click clear
- 💾 **Gallery** — save artwork, reload it later, or delete it (persists via `localStorage`)
- ⬇️ **Export as PNG** with one click
- 📱 Works with mouse *and* touch — crisp pixels on any screen

## Run it in 30 seconds
Open `index.html` in any browser. No build step, no dependencies.

**Try this:** pick 16×16, grab the bucket tool, fill the canvas black, then switch to the brush and draw a smiley face. Hit 💾 Save and ⬇ PNG.

## What I practiced
- HTML5 `<canvas>` drawing and pixel-perfect rendering
- Flood-fill algorithm with an explicit stack
- Pointer events for unified mouse + touch input
- `localStorage` for a persistent gallery
- Undo via state snapshots
- Reading pixels back with `getImageData`

## Ideas to extend it
- Sprite animation frames (flip through frames like a flipbook)
- Symmetry / mirror drawing modes
- Share art via URL hash
