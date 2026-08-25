import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FontId = "geist" | "inter" | "merriweather" | "lora";

export const FONT_STORAGE_KEY = "hotpoint-font-preference";

export const FONT_OPTIONS: {
  id: FontId;
  label: string;
  category: "Sans-serif" | "Serif";
}[] = [
  { id: "geist", label: "Geist Sans", category: "Sans-serif" },
  { id: "inter", label: "Inter", category: "Sans-serif" },
  { id: "merriweather", label: "Merriweather", category: "Serif" },
  { id: "lora", label: "Lora", category: "Serif" },
];

interface FontState {
  font: FontId;
  setFont: (font: FontId) => void;
}

export const useFontStore = create<FontState>()(
  persist(
    (set) => ({
      font: "geist",
      setFont: (font) => {
        set({ font });
        document.documentElement.setAttribute("data-font", font);
      },
    }),
    { name: FONT_STORAGE_KEY },
  ),
);
