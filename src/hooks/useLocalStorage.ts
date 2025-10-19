import { useEffect, useRef, useState } from 'react';

type InitialValue<T> = T | (() => T);

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

const isBrowser = typeof window !== 'undefined';

const readValue = <T,>(key: string, initialValue: InitialValue<T>): T => {
  if (!isBrowser) {
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
    }
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  } catch (error) {
    console.warn(`Failed to read localStorage key "${key}":`, error);
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  }
};

export const useLocalStorage = <T,>(key: string, initialValue: InitialValue<T>): [T, SetValue<T>] => {
  const initialRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState<T>(() => readValue(key, initialRef.current));

  const setValue: SetValue<T> = (value) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      if (isBrowser) {
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.warn(`Failed to set localStorage key "${key}":`, error);
        }
      }
      return valueToStore;
    });
  };

  useEffect(() => {
    if (!isBrowser) {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(`Failed to parse localStorage event for key "${key}":`, error);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  useEffect(() => {
    setStoredValue(readValue(key, initialRef.current));
  }, [key]);

  return [storedValue, setValue];
};
