"use client";

import { create } from "zustand";

interface CustomizeTarget {
  productId: string;
  /** When editing an existing cart line */
  lineKey?: string;
}

interface UIState {
  customizing: CustomizeTarget | null;
  openCustomize: (target: CustomizeTarget) => void;
  closeCustomize: () => void;
}

export const useUI = create<UIState>()((set) => ({
  customizing: null,
  openCustomize: (customizing) => set({ customizing }),
  closeCustomize: () => set({ customizing: null }),
}));
