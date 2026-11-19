# Glassday Code Ownership Map

This file is the compact map for changing the app without mixing runtime
responsibilities. Comments in the source files point back to this ownership
boundary.

## Runtime flow

```text
src/main.tsx
  -> src/App.tsx
     -> Web desktop: AppShell -> Sidebar + Topbar + DashboardGrid
     -> Mobile Web: MobileLayout -> MobileDashboard + MobileWidgetEditor
     -> Tauri: the same AppShell/DashboardGrid tree, with native helpers
     -> WidgetRenderer: one persistent host per widget
        -> WidgetSlot: attaches that host to the current desktop/mobile slot
           -> Widget component: owns data interaction and semantic markup
              -> src/styles/widgets/*.css: owns inner widget layout
```

## What each layer owns

| Layer | Files | Owns | Must not own |
| --- | --- | --- | --- |
| App composition | `src/App.tsx` | providers, runtime branch, modal/popout state | widget internals or CSS geometry |
| Desktop shell | `src/components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx` | Tauri/Web shell, sidebar, topbar, layout mode | widget data |
| Desktop grid | `src/components/grid/DashboardGrid.tsx`, `gridDefaults.ts` | grid coordinates, resize, reflow, saved desktop layouts | mobile card markup |
| Mobile shell | `MobileLayout.tsx`, `MobileDashboard.tsx`, `MobileWidgetEditor.tsx` | mobile navigation, ordering, touch editing | desktop grid coordinates |
| Persistent widget host | `WidgetRenderer.tsx`, `WidgetSlot.tsx`, `widgetHostContext.ts` | mounting once and moving DOM hosts | visual styling and persistence schema |
| Widget behavior | `src/components/widgets/*.tsx` and their subfolders | input, actions, widget-specific data | global header geometry |
| Shared widget frame | `GlassCard.tsx`, `src/styles/base.css`, `widget-system.css` | title, subtitle, icon slot, header/body spacing | theme-specific colors |
| Theme surface | `theme-surfaces.css`, `themes/*.css` | color, material, radius, contrast, scrollbar | ordinary widget title size and spacing |
| Widget styling | `src/styles/widgets/*.css` | inner panels, rows, charts, dense-view exceptions | app shell geometry |
| Storage/auth | `src/context`, `src/lib`, `src/constants` | local/cloud/native persistence and auth | presentational layout |
| Tauri native | `src-tauri/*`, `src/lib/nativeGlassEffect.ts`, `src/utils/tauriDesktop.ts` | native window, deep link, pin/blur, packaging | React widget layout |

## Change checklist

1. If a change affects every widget, edit `spacing-tokens.css` or
   `widget-system.css` first.
2. If a change affects only colors/material, edit the relevant theme file or
   `theme-surfaces.css`; do not add a second header geometry rule.
3. If a change affects a widget's content, edit its TSX and its matching
   `src/styles/widgets/*.css` file.
4. If a widget moves between desktop and mobile, inspect `WidgetRenderer`,
   `WidgetSlot`, and `widgetHostContext` together.
5. For Tauri changes, verify `src-tauri/tauri.conf.json` and run the frontend
   build before attempting the native installer.

## Validation order

```text
npm.cmd run lint
  -> npm.cmd run build
     -> npm.cmd run tauri -- dev
        -> npm.cmd run tauri -- build --bundles nsis
```

The last command creates an installer; it is not the same as checking the Web
preview or the local Tauri dev window.
