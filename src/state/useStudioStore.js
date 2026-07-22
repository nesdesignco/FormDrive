import { create } from "zustand";

export const useStudioStore = create((set, get) => ({
  vehicle: "mustang", paint: "ivory", finish: 12, wheel: "turbine", studio: "noir", cameraView: "hero",
  headlights: true, tailLights: true, partStates: {},
  panelOpen: true, infoOpen: false, renderer: null,
  setVehicle: (vehicle) => set({ vehicle, partStates: {}, cameraView: "hero" }),
  setPaint: (paint) => set({ paint }), setFinish: (finish) => set({ finish }),
  setWheel: (wheel) => set({ wheel }), setStudio: (studio) => set({ studio }),
  setCameraView: (cameraView) => set({ cameraView }), toggleHeadlights: () => set((s) => ({ headlights: !s.headlights })), toggleTailLights: () => set((s) => ({ tailLights: !s.tailLights })),
  togglePart: (part) => set((state) => ({ partStates: { ...state.partStates, [part]: !state.partStates[part] } })),
  closeAllParts: () => set({ partStates: {} }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })), openInfo: () => set({ infoOpen: true }), closeInfo: () => set({ infoOpen: false }),
  setRenderer: (renderer) => set({ renderer }),
  capture: () => { const renderer = get().renderer; if (!renderer) return; const link = document.createElement("a"); link.download = `formdrive-${get().vehicle}-${get().paint}.png`; link.href = renderer.domElement.toDataURL("image/png"); link.click(); },
}));
