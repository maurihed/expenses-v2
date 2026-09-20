import {
  getCapturePreferences,
  setCapturePreferences,
  type CapturePreferences,
} from "@/lib/capturePreferences";
import { create } from "zustand";

interface CapturePreferencesState {
  prefs: CapturePreferences;
  setDefaults: (prefs: CapturePreferences) => void;
}

export const useCapturePreferences = create<CapturePreferencesState>((set) => ({
  prefs: getCapturePreferences(),
  setDefaults: (prefs) => {
    setCapturePreferences(prefs);
    set({ prefs });
  },
}));
