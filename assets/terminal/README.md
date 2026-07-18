# Animated Terminal

This folder contains the source files for the animated terminal displayed in my GitHub profile.

## Files

- `about.svg` — Self-contained SVG rendered by GitHub.
- `terminal.js` — Development animation logic.
- `styles.css` — Styling used while developing the SVG.

## Notes

GitHub does not execute JavaScript inside SVG images embedded in a README.

Therefore, `about.svg` is exported as a standalone SVG containing all animations.

The JS and CSS files exist only to make development and maintenance easier.