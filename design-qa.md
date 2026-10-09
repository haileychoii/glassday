# Design QA: Aurora Calendar Refinement

## Reference

- Source screenshot: `C:\Users\jenny\OneDrive\사진\스크린샷\스크린샷 2026-10-09 130355.png`
- Source screenshot: `C:\Users\jenny\OneDrive\사진\스크린샷\스크린샷 2026-10-09 130413.png`
- Source screenshot: `C:\Users\jenny\OneDrive\사진\스크린샷\스크린샷 2026-10-09 130326.png`
- Source screenshot: `C:\Users\jenny\AppData\Local\Temp\codex-clipboard-ee2ad7d9-bcb8-4abe-bb96-da6ab9721983.png`
- Implementation capture: Codex IAB tab 2 at `http://127.0.0.1:4173/?layout=wide` (session-local browser capture; IAB does not create a workspace screenshot file).
- Reference type: Defect screenshots plus the user's written target behavior, not a pixel-identical mockup.

## Environment

- Viewports checked: `1221x972`, `855x745`, and the browser default viewport.
- Layout mode: Wide dashboard.
- Theme: Aurora.
- Density: Desktop dashboard density with two widget columns.

## Interaction Checks

- Day / Week / Month controls remain separated and readable.
- Week Edit control uses content width and does not leave a large empty trailing area.
- Week timeline keeps the dark Aurora glass surface and readable hour/half-hour guides.
- Month `+2` overflow opens beside its date cell rather than at the page edge.
- Overflow preview remains interactive long enough to select an event.
- Selecting a hidden event opens the Calendar Event editor for that exact event.
- Browser console error check: no errors.

## Visual Findings And Fixes

- Before: generic Calendar fallbacks forced a bright Week surface over Aurora.
  After: a final Aurora bridge restores dark translucent Week and Month surfaces.
- Before: transformed dashboard coordinates displaced the fixed month preview.
  After: the preview renders through a body portal and clamps to the viewport near the pointer.
- Before: the Week Edit control stretched across the toolbar grid.
  After: it spans the toolbar row structurally but keeps `fit-content` width.
- Before: dark outer shadows made Aurora borders look black and heavy.
  After: shell, card, panel, topbar, and sidebar edges use softer lilac-white glass borders and lighter shadows.

## Result

`passed`

