import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type UseLocalStorageReturn<T> = {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  removeValue: () => void;
};

const isBrowser = () => typeof window !== "undefined";

const isObject = (value: unknown) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const sanitizeValue = <T,>(value: unknown, fallback: T): T => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (Array.isArray(fallback)) {
    return Array.isArray(value) ? (value as T) : fallback;
  }

  if (isObject(fallback)) {
    return isObject(value) ? ({ ...fallback, ...value } as T) : fallback;
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
    removeValue,
  };
};