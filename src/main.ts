import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Regisztrált felhasználók megjelenési beállításainak visszatöltése induláskor
try {
  const userType = localStorage.getItem('macroTrackerUserType');
  const hasAuthSession = Boolean(localStorage.getItem('macroTrackerAuth'));
  if (userType === 'registered' || hasAuthSession) {
    const rawPrefs = localStorage.getItem('macroTrackerPrefs');
    if (rawPrefs) {
      const prefs = JSON.parse(rawPrefs) as {
        theme?: 'light' | 'dark';
        contrast?: 'normal' | 'high';
        reduceMotion?: boolean;
        waterTargetMl?: number;
        waterGlassSizeMl?: number;
      } | null;
      if (prefs) {
        const root = document.documentElement;
        if (prefs.theme) {
          root.setAttribute('data-theme', prefs.theme);
        }
        if (prefs.contrast) {
          root.setAttribute('data-contrast', prefs.contrast);
        }
        if (typeof prefs.reduceMotion === 'boolean') {
          if (prefs.reduceMotion) {
            root.setAttribute('data-reduce-motion', 'true');
          } else {
            root.removeAttribute('data-reduce-motion');
          }
        }
        if (typeof prefs.waterTargetMl === 'number' && Number.isFinite(prefs.waterTargetMl) && prefs.waterTargetMl > 0) {
          root.setAttribute('data-water-target-ml', String(Math.round(prefs.waterTargetMl)));
        }
        if (
          typeof prefs.waterGlassSizeMl === 'number' &&
          Number.isFinite(prefs.waterGlassSizeMl) &&
          prefs.waterGlassSizeMl > 0
        ) {
          root.setAttribute('data-water-glass-ml', String(Math.round(prefs.waterGlassSizeMl)));
        }
      }
    }
  }
} catch {
  // Ha a localStorage nem elérhető, egyszerűen az alapértelmezett témát használjuk.
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
