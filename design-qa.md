# Design QA: Pixel Desk Month Height

## Reference

- Source screenshot: `C:\Users\jenny\AppData\Local\Temp\codex-clipboard-96101e97-da94-47b5-a713-3368109dd3c2.png`
- Reference type: Defect screenshot plus the user's written target behavior, not a pixel-identical mockup.

## Environment

- Layout mode: Wide dashboard.
- Theme: Pixel Desk.
- Build validation: `npm.cmd run build` and `git diff --check` passed.
- Browser target: Google Chrome, as previously requested by the user.

## Implemented Checks

- The month board now accepts the remaining height supplied by `CalendarWidget.tsx` instead of sizing itself only to its content.
- The weekday header remains fixed at 24px while the six calendar weeks share all remaining vertical space.
- Each week preserves its event-lane minimum height, preventing event labels from collapsing or overlapping.
- When the widget is shorter than the minimum required by all six weeks, only the month grid scrolls vertically.

## Visual Verification

- The CSS flex and grid hierarchy was inspected against the rendered defect: `calendar-view-body` provides available height, `calendar-month-board` consumes it, and `calendar-month-weeks` distributes it.
- Final Chrome capture is unavailable in the current computer-use environment, so visual verification cannot be marked as passed.

## Result

`blocked`
