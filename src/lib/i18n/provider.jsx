"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dictionaries, en } from "./dictionaries";

const I18nContext = createContext(null);

const STORAGE_KEY = "ulfa.locale";

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState("en");

  // Restore saved locale on mount. Reading localStorage must happen after
  // hydration (it is unavailable during SSR), so this is a valid sync-from-
  // external-system effect.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of persisted preference
    if (saved === "en" || saved === "ar") setLocaleState(saved);
  }, []);

  const dir = locale === "ar" ? "rtl" : "ltr";

  // Keep the document element in sync so native text alignment + scrollbars flip.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "en" ? "ar" : "en";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key) => dictionaries[locale][key] ?? en[key] ?? key,
    [locale],
  );

  const pick = useCallback(
    (enValue, arValue) => (locale === "ar" && arValue ? arValue : enValue),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, dir, setLocale, toggleLocale, t, pick }),
    [locale, dir, setLocale, toggleLocale, t, pick],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
