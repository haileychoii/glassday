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
