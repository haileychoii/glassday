import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import "./styles";

import App from "./App.tsx";
import { applyTheme, getCurrentTheme } from "./constants/themes";

applyTheme(getCurrentTheme(), { emit: false });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);