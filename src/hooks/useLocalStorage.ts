/**
 * ============================================================
 * [Data Hook] Glassday localStorage State Bridge
 * ============================================================
 *
 * 역할:
 * - Widget과 Context가 JSON serializable state를 localStorage에 저장하고,
 *   React state와 같은 API로 읽고 수정하게 한다.
 * - 같은 탭의 GLASSDAY_STORAGE_EVENT와 다른 탭의 native storage event를 모두 듣는다.
 *
 * 연결:
 * - Event/prefix policy: src/lib/glassdayStorage.ts
 * - Consumers: DashboardDataContext, useDashboardTabs 및 저장형 Widget 다수
 * - CloudSyncContext가 remote snapshot을 적용하면 bulk event를 통해 값이 갱신된다.
 *
 * 주의:
 * - object fallback은 누락 필드를 얕게 보완하지만 완전한 schema validator는 아니다.
 * - key 변경은 기존 사용자 데이터와 cloud snapshot 호환을 끊으므로 migration 없이
 *   임의로 변경하지 않는다.
 * ============================================================
 */
import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  GLASSDAY_STORAGE_EVENT,
  type GlassdayStorageChangeDetail,
} from "../lib/glassdayStorage";

type UseLocalStorageReturn<T> = {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  resetValue: () => void;
  removeValue: () => void;
};

const isBrowser = () => typeof window !== "undefined";

const isPlainObject = (value: unknown) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const sanitizeValue = <T,>(value: unknown, fallback: T): T => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (Array.isArray(fallback)) {
    return Array.isArray(value) ? (value as T) : fallback;
  }

  if (isPlainObject(fallback)) {
    return isPlainObject(value) ? ({ ...fallback, ...value } as T) : fallback;
  }

  return value as T;
};

/**
 * @param key 실제 localStorage key. Widget별 persistence contract로 사용된다.
 * @param initialValue 저장값이 없거나 손상되었을 때 사용할 기본값이다.
 * @returns value와 React setState 호환 setter, reset/remove action을 제공한다.
 */
export const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> => {
  const readValue = useCallback((): T => {
    if (!isBrowser()) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);

      if (item === null) {
        return initialValue;
      }

      const parsed = JSON.parse(item);
      return sanitizeValue<T>(parsed, initialValue);
    } catch (error) {
      console.warn(`useLocalStorage read error: ${key}`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(() => readValue());

  useEffect(() => {
    if (!isBrowser()) return;

    /* Same-document sync: native storage event는 현재 탭에 발생하지 않기 때문에
       glassdayStorage의 custom event를 함께 구독한다. */
    const handleStorageChange = (event: Event) => {
      const customEvent = event as CustomEvent<GlassdayStorageChangeDetail>;
      const changedKey = customEvent.detail?.key;

      if (
        customEvent.detail?.type === "bulk" ||
        changedKey === undefined ||
        changedKey === key
      ) {
        setStoredValue(readValue());
      }
    };

    /* Cross-tab sync: 같은 origin의 다른 브라우저 탭에서 바뀐 값을 반영한다. */
    const handleNativeStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === key) {
        setStoredValue(readValue());
      }
    };

    window.addEventListener(GLASSDAY_STORAGE_EVENT, handleStorageChange);
    window.addEventListener("storage", handleNativeStorage);

    return () => {
      window.removeEventListener(GLASSDAY_STORAGE_EVENT, handleStorageChange);
      window.removeEventListener("storage", handleNativeStorage);
    };
  }, [key, readValue]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      setStoredValue((prevValue) => {
        const nextValue =
          value instanceof Function ? value(prevValue) : value;

        const safeNextValue = sanitizeValue<T>(nextValue, initialValue);

        if (isBrowser()) {
          try {
            window.localStorage.setItem(key, JSON.stringify(safeNextValue));
          } catch (error) {
            console.warn(`useLocalStorage write error: ${key}`, error);
          }
        }

        return safeNextValue;
      });
    },
    [key, initialValue]
  );

  const resetValue = useCallback(() => {
    if (isBrowser()) {
      try {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      } catch (error) {
        console.warn(`useLocalStorage reset error: ${key}`, error);
      }
    }

    setStoredValue(initialValue);
  }, [key, initialValue]);

  const removeValue = useCallback(() => {
    if (isBrowser()) {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn(`useLocalStorage remove error: ${key}`, error);
      }
    }

    setStoredValue(initialValue);
  }, [key, initialValue]);

  return {
    value: storedValue,
    setValue,
    resetValue,
    removeValue,
  };
};
