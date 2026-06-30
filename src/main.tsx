import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import "./styles";

import App from "./App.tsx";
import { applyTheme, getCurrentTheme } from "./constants/themes";

const injectForceDashboardStyles = () => {
  if (typeof document === "undefined") return;

  const existing = document.getElementById("glassday-force-dashboard-style");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "glassday-force-dashboard-style";

  style.textContent = `
    .bg-glass-gradient,
    .glass-panel,
    .liquid-shell,
    .app-shell,
    .dashboard-shell,
    .workspace-shell,
    .desktop-shell,
    .app-layout,
    .dashboard-layout,
    .workspace-layout,
    .desktop-layout {
      min-width: 0 !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }

    .glass-panel,
    .liquid-shell,
    .app-shell,
    .dashboard-shell,
    .workspace-shell,
    .desktop-shell,
    .app-layout,
    .dashboard-layout,
    .workspace-layout,
    .desktop-layout {
      display: flex !important;
      position: relative !important;
    }

    .bg-glass-gradient::before,
    .bg-glass-gradient::after,
    .glass-panel::before,
    .glass-panel::after,
    .liquid-shell::before,
    .liquid-shell::after,
    .app-shell::before,
    .app-shell::after,
    .dashboard-shell::before,
    .dashboard-shell::after,
    .workspace-shell::before,
    .workspace-shell::after,
    .desktop-shell::before,
    .desktop-shell::after {
      pointer-events: none !important;
      z-index: 0 !important;
    }

    .app-sidebar,
    .sidebar,
    .topbar,
    main,
    .app-main,
    .dashboard-main,
    .workspace-main,
    .app-content,
    .dashboard-content,
    .workspace-content {
      position: relative !important;
      z-index: 2 !important;
    }

    main,
    .app-main,
    .dashboard-main,
    .workspace-main,
    .app-content,
    .dashboard-content,
    .workspace-content {
      flex: 1 1 auto !important;
      width: auto !important;
      height: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .dashboard-tab-space {
      position: relative !important;
      z-index: 5 !important;
      flex: 1 1 auto !important;
      width: 100% !important;
      height: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      padding: 24px !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .dashboard-edit-canvas {
      position: relative !important;
      z-index: 6 !important;
      flex: 1 1 auto !important;
      width: 100% !important;
      height: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      display: block !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .dashboard-grid-shell,
    .dashboard-grid-wrapper,
    .dashboard-grid-stage,
    .dashboard-grid-container {
      position: relative !important;
      z-index: 7 !important;
      width: 100% !important;
      height: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      display: block !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .react-grid-layout {
      position: relative !important;
      z-index: 8 !important;
      width: 100% !important;
      min-width: 0 !important;
      min-height: calc(100vh - 190px) !important;
      display: block !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    .react-grid-item {
      position: absolute !important;
      z-index: 9 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-width: 0 !important;
      min-height: 0 !important;
      overflow: visible !important;
      pointer-events: auto !important;
      box-sizing: border-box !important;
    }

    .react-grid-item > * {
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    .react-grid-item > .glass-card,
    .react-grid-item .glass-card {
      position: relative !important;
      z-index: 10 !important;

      width: calc(100% - 16px) !important;
      height: calc(100% - 16px) !important;
      min-width: 0 !important;
      min-height: 0 !important;

      margin: 8px !important;

      display: grid !important;
      grid-template-rows: auto minmax(0, 1fr) !important;

      visibility: visible !important;
      opacity: 1 !important;

      color: hsl(var(--foreground, 250 36% 20%) / 0.92) !important;
      background: hsl(0 0% 100% / 0.42) !important;
      border: 1px solid hsl(0 0% 100% / 0.62) !important;
      box-shadow:
        inset 0 1px 0 hsl(0 0% 100% / 0.72),
        0 18px 48px -36px hsl(245 34% 28% / 0.24) !important;

      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    html[data-theme="glass-dark"] .react-grid-item > .glass-card,
    body[data-theme="glass-dark"] .react-grid-item > .glass-card,
    html.theme-glass-dark .react-grid-item > .glass-card,
    body.theme-glass-dark .react-grid-item > .glass-card,
    html[data-theme="glass-dark"] .react-grid-item .glass-card,
    body[data-theme="glass-dark"] .react-grid-item .glass-card,
    html.theme-glass-dark .react-grid-item .glass-card,
    body.theme-glass-dark .react-grid-item .glass-card {
      color: hsl(220 32% 94% / 0.94) !important;
      background: hsl(226 34% 12% / 0.54) !important;
      border: 1px solid hsl(210 100% 94% / 0.2) !important;
      box-shadow:
        inset 0 1px 0 hsl(0 0% 100% / 0.14),
        0 24px 58px -34px hsl(230 70% 4% / 0.8) !important;
    }

    .react-grid-item .glass-card > * {
      min-width: 0 !important;
      box-sizing: border-box !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    .react-grid-item .glass-card-body,
    .react-grid-item .glass-card > div:last-child {
      min-width: 0 !important;
      min-height: 0 !important;
      visibility: visible !important;
      opacity: 1 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
    }

    .react-grid-item .glass-card h1,
    .react-grid-item .glass-card h2,
    .react-grid-item .glass-card h3,
    .react-grid-item .glass-card h4,
    .react-grid-item .glass-card p,
    .react-grid-item .glass-card span,
    .react-grid-item .glass-card small,
    .react-grid-item .glass-card strong,
    .react-grid-item .glass-card button,
    .react-grid-item .glass-card input,
    .react-grid-item .glass-card textarea,
    .react-grid-item .glass-card select,
    .react-grid-item .glass-card svg {
      visibility: visible !important;
      opacity: 1 !important;
    }
  `;

  document.head.appendChild(style);
};

applyTheme(getCurrentTheme(), { emit: false });
injectForceDashboardStyles();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);