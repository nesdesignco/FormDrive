import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from "three";
import { CameraRig } from "./CameraRig";
import { HeadlightRig } from "./HeadlightRig";
import { StudioEnvironment } from "./StudioEnvironment";
import { VehicleAssetLoader } from "./VehicleAssetLoader";
import { VehicleModel } from "./VehicleModel";
import { useStudioStore } from "../../state/useStudioStore";

export function StudioCanvas() {
  const setRenderer = useStudioStore((s) => s.setRenderer);
  const createRenderer = async (props) => {
    const options = { ...props, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" };
    let renderer;
    if (navigator.gpu) {
      try {
        const { WebGPURenderer } = await import("three/webgpu");
        renderer = new WebGPURenderer(options);
        await renderer.init();
      } catch {
        renderer = new WebGLRenderer(options);
      }
    } else {
      renderer = new WebGLRenderer(options);
    }
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    return renderer;
  };
  return <div className="scene" aria-label="Interactive three-dimensional vehicle studio"><Canvas shadows dpr={[1, 1.8]} camera={{ fov: 36, near: 0.1, far: 120, position: [6.8, 3.1, 7.6] }} gl={createRenderer} onCreated={({ gl }) => { setRenderer(gl); document.documentElement.dataset.renderer = gl.isWebGPURenderer ? "webgpu" : "webgl"; }}><Suspense fallback={null}><StudioEnvironment /><VehicleModel /><HeadlightRig /></Suspense><VehicleAssetLoader /><CameraRig /></Canvas></div>;
}
