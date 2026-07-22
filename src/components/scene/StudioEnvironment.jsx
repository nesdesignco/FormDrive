import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { STUDIOS } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";

export function StudioEnvironment() {
  const studio = STUDIOS[useStudioStore((s) => s.studio)];
  const renderer = useThree((state) => state.gl);
  useEffect(() => { renderer.toneMappingExposure = studio.exposure; }, [renderer, studio]);
  return <>
    <color attach="background" args={[studio.background]} />
    <fog attach="fog" args={[studio.background, 16, 42]} />
    <hemisphereLight args={["#fff1dc", "#4a5260", 1.05]} />
    <ambientLight color="#fff1df" intensity={0.58} />
    <directionalLight position={[6, 8, 5]} color={studio.key} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.00012} />
    <directionalLight position={[-5, 5, -4]} color={studio.fill} intensity={1.65} />
    <directionalLight position={[0, 4, -7]} color="#ffffff" intensity={0.9} />
    <spotLight position={[0, 9, 2]} color="#fff7e9" intensity={52} angle={0.62} penumbra={0.8} castShadow />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[24, 96]} /><meshPhysicalMaterial color={studio.floor} metalness={0.34} roughness={0.28} clearcoat={0.45} /></mesh>
    <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[4.6, 0.025, 8, 128]} /><meshStandardMaterial color="#d6c9ab" metalness={0.66} roughness={0.34} /></mesh>
  </>;
}
