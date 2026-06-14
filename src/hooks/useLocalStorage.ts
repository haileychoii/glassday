import { useEffect, useState } from "react";

type SetValue<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);

      if (saved === null) {
        return initialValue;
      }

      return JSON.parse(saved) as T;
    } catch (error) {
      console.warn(`Failed to read localStorage key: ${key}`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save localStorage key: ${key}`, error);
    }
  }, [key, value]);

  const updateValue = (newValue: SetValue<T>) => {
    setValue((prev) => {
      if (typeof newValue === "function") {
        return (newValue as (prev: T) => T)(prev);
      }

      return newValue;
    });
  };

  const resetValue = () => {
    setValue(initialValue);
    localStorage.removeItem(key);
  };

  return {
    value,
    setValue: updateValue,
    resetValue,
  };
}