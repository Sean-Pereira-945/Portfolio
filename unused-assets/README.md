# Unused assets

These files were in `static/`, which webpack copies into every build, but nothing in the code loads them.
They were moved here (with `git mv`, so history is kept) to shrink the deploy.

- `textures/monitor/video/*` and `textures/monitor/layers/*`: the monitor screen-effect layers.
  They are only used when `SCREEN_FILTERS_ENABLED` is `true` in `src/Application/World/MonitorScreen.ts`.
  To turn the effects back on, move these back into `static/textures/monitor/` and add the video elements they need.
- `audio/radio/*`, `audio/computer/idle*.wav`, `audio/atmosphere/office.ogg`: not referenced in `src/Application/sources.ts`.
