import { useLoader } from "@react-three/fiber";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { useStudioStore } from "../state/useStudioStore.js";

let dracoLoader;

function configureLoader(loader) {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.5/");
  }
  loader.setDRACOLoader(dracoLoader);
  loader.setMeshoptDecoder(MeshoptDecoder);
}

function reportInitialTransfer(event) {
  if (!event.total) return;
  useStudioStore.getState().setInitialAssetTransfer({
    loadedBytes: event.loaded,
    totalBytes: event.total,
    progress: Math.min(100, (event.loaded / event.total) * 100),
  });
}

export function useVehicleGLTF(url, trackInitialTransfer = false) {
  return useLoader(
    GLTFLoader,
    url,
    configureLoader,
    trackInitialTransfer ? reportInitialTransfer : undefined,
  );
}
