import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  /*
   * Tauri Dev Server Contract
   * English: Tauri's devUrl points at one exact local address. Keeping Vite on
   * the same host/port prevents the desktop shell from opening a blank or
   * disconnected WebView when Vite silently falls back to another port.
   * Korean: Tauri가 바라보는 주소와 Vite 실제 주소를 고정해서, 5173이
   * 밀렸을 때 앱만 연결 실패처럼 보이는 상황을 바로 드러낸다.
   */
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
