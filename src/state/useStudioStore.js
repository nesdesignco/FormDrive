import { create } from "zustand";

export const useStudioStore = create((set, get) => ({
  vehicle: "mustang",
  pendingVehicle: null,
  vehicleLoadError: null,
  paint: "ivory",
  finish: 12,
  wheel: "turbine",
  studio: "noir",
  cameraView: "hero",
  headlights: true,
  tailLights: true,
  partStates: {},
  panelOpen: true,
  infoOpen: false,
  renderer: null,
  initialSceneReady: false,
  initialAssetProgress: 0,
  initialAssetLoadedBytes: 0,
  initialAssetTotalBytes: 0,
  requestVehicle: (vehicle) => {
    if (vehicle === get().vehicle || vehicle === get().pendingVehicle) return;
    set({ pendingVehicle: vehicle, vehicleLoadError: null });
  },
  completeVehicleLoad: (vehicle) => {
    if (get().pendingVehicle !== vehicle) return;
    set({
      vehicle,
      pendingVehicle: null,
      vehicleLoadError: null,
      partStates: {},
      cameraView: "hero",
    });
  },
  failVehicleLoad: (vehicle, message) => {
    if (get().pendingVehicle !== vehicle) return;
    set({
      pendingVehicle: null,
      vehicleLoadError: { vehicle, message },
    });
  },
  setPaint: (paint) => set({ paint }),
  setFinish: (finish) => set({ finish }),
  setWheel: (wheel) => set({ wheel }),
  setStudio: (studio) => set({ studio }),
  setCameraView: (cameraView) => set({ cameraView }),
  toggleHeadlights: () => set((state) => ({ headlights: !state.headlights })),
  toggleTailLights: () => set((state) => ({ tailLights: !state.tailLights })),
  togglePart: (part) => set((state) => ({
    partStates: { ...state.partStates, [part]: !state.partStates[part] },
  })),
  closeAllParts: () => set({ partStates: {} }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  openInfo: () => set({ infoOpen: true }),
  closeInfo: () => set({ infoOpen: false }),
  setRenderer: (renderer) => set({ renderer }),
  setInitialSceneReady: () => set({ initialSceneReady: true }),
  setInitialAssetTransfer: ({ loadedBytes, totalBytes, progress }) => set({
    initialAssetLoadedBytes: loadedBytes,
    initialAssetTotalBytes: totalBytes,
    initialAssetProgress: progress,
  }),
  capture: () => {
    const renderer = get().renderer;
    if (!renderer) return;
    const link = document.createElement("a");
    link.download = `formdrive-${get().vehicle}-${get().paint}.png`;
    link.href = renderer.domElement.toDataURL("image/png");
    link.click();
  },
}));
