/** Real React/StrictMode regression harness, loaded only by tests/browser-smoke.mjs.
 * Connects to src/hooks/useLocalStorage.ts; never imported by the application.
 * 한국어: 별도 브라우저에서 연속 수정·위젯 간 동기화·복원을 검사하며 사용자 데이터는 건드리지 않는다.
 */
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useLocalStorage } from "../src/hooks/useLocalStorage";
import { batchGlassdayStorageChanges } from "../src/lib/glassdayStorage";

export function verifyStorageHook() {
  const key = "glassday.test.hook";
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let update: (value: number | ((previous: number) => number)) => void;
  let calls = 0;
  function Probe({ owner = false }: { owner?: boolean }) {
    const { value, setValue } = useLocalStorage(key, 0);
    useEffect(() => { if (owner) update = setValue; }, [owner, setValue]);
    return <output>{value}</output>;
  }
  function expectValues(expected: string) {
    const actual = [...host.querySelectorAll("output")].map(node => node.textContent).join(",");
    if (actual !== expected) throw new Error(`Hook values: ${actual}; expected ${expected}`);
  }
  try {
    flushSync(() => root.render(<StrictMode><Probe owner /><Probe /></StrictMode>));
    flushSync(() => {
      update(previous => { calls += 1; return previous + 1; });
      update(previous => { calls += 1; return previous + 1; });
    });
    expectValues("2,2");
    if (calls !== 2) throw new Error(`Updaters replayed ${calls} times`);
    flushSync(() => batchGlassdayStorageChanges(() => localStorage.setItem(key, "7")));
    expectValues("7,7");
    flushSync(() => localStorage.removeItem(key));
    expectValues("0,0");
    return { strictModeUpdaterCalls: calls, sharedConsumers: 2, restoreAndReset: "passed" };
  } finally {
    flushSync(() => root.unmount());
    host.remove();
    localStorage.removeItem(key);
  }
}
