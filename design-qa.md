# Design QA: Pixel Desk Calendar Refinement

## Reference

- Source screenshot: `C:\Users\jenny\AppData\Local\Temp\codex-clipboard-f849712a-2a82-44de-9f87-82563adce3af.png`
- Source screenshot: `C:\Users\jenny\AppData\Local\Temp\codex-clipboard-fa5cf439-d552-400a-9af6-143a11a22fe3.png`
- Source screenshot: `C:\Users\jenny\AppData\Local\Temp\codex-clipboard-d557505b-c384-4e0d-8880-05a1b62809a5.png`
- Reference type: Defect screenshots plus the user's written target behavior, not a pixel-identical mockup.

## Environment

- Layout mode: Wide dashboard.
- Theme: Pixel Desk.
- Build validation: `npm.cmd run lint` and `npm.cmd run build` passed.
- Browser target: Codex in-app browser at `http://127.0.0.1:4173/?layout=wide`.

## Implemented Checks

- Calendar title and add action use one explicit gutter and no longer touch the widget edge.
- Week view removes the redundant date-range label because the seven day headers already show the dates.
- Week day headers and the all-day lane use compact system-calendar heights.
- Month view no longer forces a 420px desktop canvas in a narrow widget; all seven columns shrink together.
- Month rows use compact container-relative sizing and no stable scrollbar gutter, keeping left and right spacing equal.
- The current day has a persistent navy Pixel Desk focus frame and date badge.
- Saved event colors remain visible at rest; hover increases saturation and adds a navy focus outline.
- Generic Pixel button rules explicitly exclude calendar event buttons, so they cannot repaint event colors gray.

## Visual Verification

- A pre-final browser capture confirmed the compact Week geometry, hidden duplicate range label, and reduced all-day/header heights.
- The final event-color specificity correction could not be re-captured because the local browser URL was rejected by the browser security policy.
- No workaround or alternate browser surface was used after that rejection.

## Result

`blocked`
