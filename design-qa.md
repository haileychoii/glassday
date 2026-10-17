# Design QA: Sidebar Fold Button

## Reference

- Source screenshot: `C:\Users\jenny\AppData\Local\Temp\codex-clipboard-ec85df95-c189-460a-accd-88d2992c51c8.png`
- Target: the sidebar fold control must be circular and centered on the collapsed sidebar rail in every theme.

## Implemented Checks

- `Sidebar.tsx` continues to provide one semantic button and one Lucide panel icon for all themes.
- Shared geometry fixes width, height, minimum size, aspect ratio, padding, and radius as one square control.
- The collapsed brand row removes horizontal padding and uses a single centered grid track.
- The icon uses block layout with no margin, preventing baseline or flex alignment drift.
- Laptop mode retains its compact 22px size while preserving the same circle and center point.
- Pixel Desk's generic square-button rule now excludes the sidebar fold control.
- Theme files still own color, border, shadow, and hover surface styling.

## Automated Verification

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## Visual Verification

- The supplied defect screenshot was inspected before implementation.
- A final matching-state Chrome capture is unavailable in the current computer-use environment, so the visual comparison cannot be marked as passed.

final result: blocked
