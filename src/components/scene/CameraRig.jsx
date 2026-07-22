import React, { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import { CAMERAS } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";

export function CameraRig() {
  const ref = useRef(); const camera = useThree((s) => s.camera); const view = useStudioStore((s) => s.cameraView);
  const desiredPosition = useRef(new Vector3(...CAMERAS.hero.position));
  const desiredTarget = useRef(new Vector3(...CAMERAS.hero.target));
  const animating = useRef(false);

  useEffect(() => {
    const preset = CAMERAS[view];
    desiredPosition.current.set(...preset.position);
    desiredTarget.current.set(...preset.target);
    animating.current = true;
  }, [view]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const audit = () => ({
      view,
      animating: animating.current,
      position: camera.position.toArray(),
      target: ref.current?.target.toArray() ?? null,
    });
    globalThis.__formdriveCameraAudit = audit;
    globalThis.__formdriveCameraObject = camera;
    return () => {
      if (globalThis.__formdriveCameraAudit === audit) delete globalThis.__formdriveCameraAudit;
      if (globalThis.__formdriveCameraObject === camera) delete globalThis.__formdriveCameraObject;
    };
  }, [camera, view]);

  useFrame((_, delta) => {
    if (!animating.current || !ref.current) return;
    camera.position.x = MathUtils.damp(camera.position.x, desiredPosition.current.x, 4.8, delta);
    camera.position.y = MathUtils.damp(camera.position.y, desiredPosition.current.y, 4.8, delta);
    camera.position.z = MathUtils.damp(camera.position.z, desiredPosition.current.z, 4.8, delta);
    ref.current.target.x = MathUtils.damp(ref.current.target.x, desiredTarget.current.x, 5.2, delta);
    ref.current.target.y = MathUtils.damp(ref.current.target.y, desiredTarget.current.y, 5.2, delta);
    ref.current.target.z = MathUtils.damp(ref.current.target.z, desiredTarget.current.z, 5.2, delta);
    ref.current.update();
    if (camera.position.distanceTo(desiredPosition.current) < 0.006 && ref.current.target.distanceTo(desiredTarget.current) < 0.006) {
      camera.position.copy(desiredPosition.current);
      ref.current.target.copy(desiredTarget.current);
      ref.current.update();
      animating.current = false;
    }
  });

  return <OrbitControls
    ref={ref}
    makeDefault
    enableDamping
    dampingFactor={0.055}
    enablePan={false}
    minDistance={4.1}
    maxDistance={13}
    minPolarAngle={Math.PI * 0.22}
    maxPolarAngle={Math.PI * 0.48}
    onStart={() => { animating.current = false; }}
  />;
}
