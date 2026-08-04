/**
 * ============================================================
 * [Figma Mapping] Application Bootstrap
 * ============================================================
 *
 * 화면 역할:
 * - React 애플리케이션을 `#root`에 연결하는 유일한 진입점이다.
 * - `styles/index.css`의 import 순서가 전체 Token, Theme, Widget CSS의
 *   cascade 순서를 결정하므로 Figma와 코드의 스타일 기준점이 된다.
 *
 * 연결 관계:
 * - Child: `src/App.tsx`
 * - Global CSS: `src/index.css`, `src/styles/index.css`
 *
 * 수정 영향:
 * - Provider나 전역 CSS import를 추가할 때는 `App.tsx`의 Provider 순서와
 *   `src/styles/index.css`의 cascade 설명을 함께 확인한다.
 * ============================================================
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
