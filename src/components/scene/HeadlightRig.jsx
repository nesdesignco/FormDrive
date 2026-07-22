import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, ClampToEdgeWrapping, Color, LinearFilter, MathUtils } from "three";
import { HEADLIGHT_RIGS } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";

const WARMUP_COLOR = new Color("#ffd29b");
const RUNNING_COLOR = new Color("#fff3d2");

function createHeadlightCookie() {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const context = canvas.getContext("2d");
  const image = context.createImageData(canvas.width, canvas.height);
  const smoothstep = (value, start, end) => {
    const normalized = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return normalized * normalized * (3 - (2 * normalized));
  };
  for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) {
    const horizontal = ((x / (canvas.width - 1)) * 2) - 1;
    const vertical = y / (canvas.height - 1);
    const cutoff = smoothstep(vertical, 0.34, 0.405);
    const lateral = Math.exp(-Math.pow(Math.abs(horizontal) * 1.18, 4.2));
    const hotspot = Math.exp(-((horizontal * horizontal) / 0.115) - (Math.pow(vertical - 0.58, 2) / 0.09));
    const lowerFade = 1 - smoothstep(vertical, 0.82, 1);
    const value = Math.round(255 * cutoff * lateral * lowerFade * (0.42 + (0.58 * hotspot)));
    const offset = ((y * canvas.width) + x) * 4;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = ClampToEdgeWrapping; texture.wrapT = ClampToEdgeWrapping;
  texture.minFilter = LinearFilter; texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function ProjectedBeam({ vehicle, side, position, target, intensity, enabled, cookie, delay = 0 }) {
  const light = useRef();
  const targetObject = useRef();
  const elapsed = useRef(0);

  useEffect(() => {
    if (light.current && targetObject.current) light.current.target = targetObject.current;
  }, []);

  useEffect(() => { elapsed.current = 0; }, [enabled]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    globalThis.__formdriveBeamAudits ??= {};
    const audit = () => ({
      position: light.current?.position.toArray() ?? null,
      target: targetObject.current?.position.toArray() ?? null,
      intensity: light.current?.intensity ?? null,
      angle: light.current?.angle ?? null,
      penumbra: light.current?.penumbra ?? null,
      decay: light.current?.decay ?? null,
    });
    globalThis.__formdriveBeamAudits[side] = audit;
    globalThis.__formdriveBeamAudit = () => Object.fromEntries(Object.entries(globalThis.__formdriveBeamAudits).map(([key, value]) => [key, value()]));
    return () => {
      if (globalThis.__formdriveBeamAudits?.[side] === audit) delete globalThis.__formdriveBeamAudits[side];
    };
  }, [side]);

  useFrame((_, delta) => {
    if (!light.current) return;
    const measuredRig = globalThis.__formdriveHeadlightAnchors;
    const measuredAnchor = measuredRig?.vehicle === vehicle ? measuredRig[side] : null;
    if (measuredAnchor && targetObject.current) {
      light.current.position.fromArray(measuredAnchor);
      light.current.position.z += 0.12;
      targetObject.current.position.set(
        measuredAnchor[0],
        Math.min(-0.06, measuredAnchor[1] - 0.82),
        measuredAnchor[2] + 8.4,
      );
    }
    elapsed.current += delta;
    const active = enabled && Boolean(measuredAnchor) && elapsed.current >= delay;
    const targetIntensity = active ? intensity : 0;
    light.current.intensity = MathUtils.damp(light.current.intensity, targetIntensity, active ? 5.8 : 10.5, delta);
    const level = intensity > 0 ? MathUtils.clamp(light.current.intensity / intensity, 0, 1) : 0;
    light.current.color.copy(WARMUP_COLOR).lerp(RUNNING_COLOR, MathUtils.smootherstep(level, 0.15, 0.92));
    light.current.angle = MathUtils.damp(light.current.angle, active ? 0.22 : 0.15, 7.5, delta);
    light.current.penumbra = MathUtils.damp(light.current.penumbra, active ? 0.72 : 0.9, 7.5, delta);
  });

  return <>
    <object3D ref={targetObject} position={target} />
    <spotLight
      ref={light}
      position={position}
      color="#fff1c9"
      intensity={0}
      distance={13}
      decay={2}
      angle={0.22}
      penumbra={0.72}
      map={cookie}
      castShadow
      shadow-mapSize={[512, 512]}
      shadow-bias={-0.00018}
      shadow-camera-near={0.12}
      shadow-camera-far={13}
    />
  </>;
}

export function HeadlightRig() {
  const group = useRef();
  const vehicle = useStudioStore((state) => state.vehicle);
  const enabled = useStudioStore((state) => state.headlights);
  const rig = HEADLIGHT_RIGS[vehicle];
  const cookie = useMemo(createHeadlightCookie, []);
  useEffect(() => () => cookie.dispose(), [cookie]);
  useFrame(() => {
    const transform = globalThis.__formdriveActiveTransform;
    if (!group.current || !transform) return;
    group.current.position.fromArray(transform.position);
    group.current.rotation.y = transform.yaw;
  });

  return <group ref={group}>
    <ProjectedBeam key={`${vehicle}-left`} vehicle={vehicle} side="left" position={rig.left} target={rig.leftTarget} intensity={rig.intensity} enabled={enabled} cookie={cookie} delay={0.025} />
    <ProjectedBeam key={`${vehicle}-right`} vehicle={vehicle} side="right" position={rig.right} target={rig.rightTarget} intensity={rig.intensity} enabled={enabled} cookie={cookie} delay={0.07} />
  </group>;
}
