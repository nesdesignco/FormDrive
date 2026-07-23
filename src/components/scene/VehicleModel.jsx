import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box3, Color, Euler, MathUtils, Matrix4, Vector3 } from "three";
import { PAINTS, VEHICLES, WHEELS } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";
import { useVehicleGLTF } from "../../hooks/useVehicleGLTF";

function lowestCommonAncestor(objects) {
  if (!objects.length) return null;
  const firstChain = [];
  for (let node = objects[0]; node; node = node.parent) firstChain.push(node);
  return firstChain.find((candidate) => objects.every((object) => {
    for (let node = object; node; node = node.parent) if (node === candidate) return true;
    return false;
  })) ?? null;
}

function resolvePivot(scene, definition) {
  if (definition.exact) {
    const exactMatch = scene.getObjectByName(definition.exact);
    if (exactMatch) return exactMatch;
    const normalizedTarget = definition.exact.replace(/[^a-z0-9_-]/gi, "").toLowerCase();
    let normalizedMatch = null;
    scene.traverse((object) => {
      if (!normalizedMatch && object.name.replace(/[^a-z0-9_-]/gi, "").toLowerCase() === normalizedTarget) normalizedMatch = object;
    });
    return normalizedMatch;
  }
  const objects = [];
  scene.traverse((object) => {
    if (object.isMesh && object.name.toLowerCase().startsWith(definition.prefix.toLowerCase())) objects.push(object);
  });
  let pivot = lowestCommonAncestor(objects);
  for (let level = 0; level < (definition.ascend ?? 0) && pivot?.parent && pivot.parent !== scene; level += 1) pivot = pivot.parent;
  return pivot;
}

function matchesAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
}

function isDescendant(parent, candidate) {
  for (let node = candidate; node; node = node.parent) if (node === parent) return true;
  return false;
}

function measureHeadlightAnchors(lightObjects, transform) {
  const points = [];
  const point = new Vector3();
  lightObjects.forEach((object) => {
    const positions = object.geometry?.attributes?.position;
    if (!positions) return;
    for (let index = 0; index < positions.count; index += 1) {
      point.fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld).applyMatrix4(transform);
      points.push(point.clone());
    }
  });
  if (points.length < 2) return null;
  let leftX = Math.min(...points.map(({ x }) => x));
  let rightX = Math.max(...points.map(({ x }) => x));
  let left = new Vector3();
  let right = new Vector3();
  for (let pass = 0; pass < 8; pass += 1) {
    left = new Vector3(); right = new Vector3();
    let leftCount = 0; let rightCount = 0;
    points.forEach((sample) => {
      if (Math.abs(sample.x - leftX) <= Math.abs(sample.x - rightX)) { left.add(sample); leftCount += 1; }
      else { right.add(sample); rightCount += 1; }
    });
    if (leftCount) left.multiplyScalar(1 / leftCount);
    if (rightCount) right.multiplyScalar(1 / rightCount);
    leftX = left.x; rightX = right.x;
  }
  return left.x <= right.x ? { left: left.toArray(), right: right.toArray() } : { left: right.toArray(), right: left.toArray() };
}

function VehicleModelInstance({ vehicleId }) {
  const state = useStudioStore();
  const setInitialSceneReady = useStudioStore((store) => store.setInitialSceneReady);
  const config = VEHICLES[vehicleId];
  const source = useVehicleGLTF(config.url, vehicleId === "mustang" && !state.initialSceneReady);
  const group = useRef();
  const headlightLevel = useRef(0);
  const tailLightLevel = useRef(0);

  useEffect(() => {
    let finalFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      finalFrame = window.requestAnimationFrame(setInitialSceneReady);
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (finalFrame) window.cancelAnimationFrame(finalFrame);
    };
  }, [setInitialSceneReady]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    globalThis.__formdriveMountedVehicles ??= new Set();
    globalThis.__formdriveMountedVehicles.add(vehicleId);
    globalThis.__formdriveRenderedVehicleIds = () => [...globalThis.__formdriveMountedVehicles];
    return () => globalThis.__formdriveMountedVehicles?.delete(vehicleId);
  }, [vehicleId]);
  const model = useMemo(() => {
    // All mutations belong to one fresh clone. This keeps rendered meshes,
    // materials and moving-part pivots aligned when StrictMode re-runs memos.
    const scene = source.scene.clone(true);
    const collections = { paint: new Set(), rims: new Set(), lights: new Set(), tailLights: new Set() };
    const lightObjects = new Set();
    scene.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      const clones = originals.map((material) => material.clone());
      object.material = Array.isArray(object.material) ? clones : clones[0];
      const objectName = object.name.toLowerCase();
      clones.forEach((material) => {
        const name = `${objectName} ${material.name.toLowerCase()}`;
        material.envMapIntensity = 2.45;
        if (matchesAny(name, config.paintNames)) collections.paint.add(material);
        if (matchesAny(name, config.rimNames)) collections.rims.add(material);
        if (matchesAny(name, config.lightNames)) { collections.lights.add(material); lightObjects.add(object); }
        if (matchesAny(name, config.tailLightNames)) collections.tailLights.add(material);
      });
    });

    scene.updateMatrixWorld(true);
    const pivots = Object.fromEntries(Object.entries(config.parts).map(([key, definition]) => [key, resolvePivot(scene, definition)]));
    scene.updateMatrixWorld(true);
    Object.entries(config.attachments ?? {}).forEach(([partKey, definitions]) => {
      const pivot = pivots[partKey];
      if (!pivot) return;
      definitions.forEach((definition) => {
        const attachment = resolvePivot(scene, definition);
        if (attachment && attachment !== pivot && !isDescendant(pivot, attachment)) pivot.attach(attachment);
      });
    });
    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = 5.65 / Math.max(size.x, size.z);
    scene.position.set(-center.x, -bounds.min.y, -center.z);
    scene.updateMatrixWorld(true);
    const modelRotation = new Euler(...config.rotation);
    const lightTransform = new Matrix4().makeRotationFromEuler(modelRotation).scale(new Vector3(scale, scale, scale));
    const headlightBounds = new Box3();
    lightObjects.forEach((object) => headlightBounds.expandByObject(object));
    headlightBounds.applyMatrix4(lightTransform);
    const headlightAnchors = measureHeadlightAnchors(lightObjects, lightTransform);
    const headlightGeometry = [...lightObjects].map((object) => ({
      name: object.name,
      center: new Box3().setFromObject(object).getCenter(new Vector3()).multiplyScalar(scale).applyEuler(modelRotation).toArray(),
    }));

    const rotations = Object.fromEntries(Object.entries(pivots).map(([key, pivot]) => [key, pivot?.rotation.clone()]));
    const positions = Object.fromEntries(Object.entries(pivots).map(([key, pivot]) => [key, pivot?.position.clone()]));
    const slideTargets = {};
    Object.entries(config.parts).forEach(([key, definition]) => {
      const pivot = pivots[key];
      if (definition.motion !== "slide" || !pivot?.parent) return;
      const targets = [pivot, ...(definition.companions ?? []).map((companion) => resolvePivot(scene, companion))]
        .filter((target, index, collection) => target?.parent && collection.indexOf(target) === index);
      slideTargets[key] = targets.map((target) => {
        const worldStart = target.getWorldPosition(new Vector3());
        const glassBounds = new Box3().setFromObject(target);
        const glassHeight = glassBounds.max.y - glassBounds.min.y;
        const travelDistance = Math.max(definition.travel / scale, glassHeight + 0.08 / scale);
        const localStart = target.parent.worldToLocal(worldStart.clone());
        const localEnd = target.parent.worldToLocal(worldStart.clone().add(new Vector3(0, -travelDistance, 0)));
        const materials = new Set();
        target.traverse((object) => {
          if (!object.isMesh) return;
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
        });
        return {
          target,
          base: target.position.clone(),
          travel: localEnd.sub(localStart),
          materials: [...materials].map((material) => ({
            material,
            opacity: material.opacity,
            transparent: material.transparent,
            depthWrite: material.depthWrite,
          })),
        };
      });
    });
    return {
      scene,
      scale,
      pivots,
      rotations,
      positions,
      slideTargets,
      groundContact: config.groundOffset,
      headlightGeometry,
      headlightBounds: { min: headlightBounds.min.toArray(), max: headlightBounds.max.toArray() },
      headlightAnchors,
      materials: Object.fromEntries(Object.entries(collections).map(([key, value]) => [key, [...value]])),
    };
  }, [source.scene, config]);

  useEffect(() => {
    const runtimeAnchors = { vehicle: vehicleId, ...model.headlightAnchors };
    globalThis.__formdriveHeadlightAnchors = runtimeAnchors;
    return () => {
      if (globalThis.__formdriveHeadlightAnchors === runtimeAnchors) delete globalThis.__formdriveHeadlightAnchors;
    };
  }, [model.headlightAnchors, vehicleId]);

  useEffect(() => {
    const paint = PAINTS[state.paint];
    model.materials.paint.forEach((material) => {
      material.color.set(paint.color);
      material.metalness = Math.min(paint.metalness, 0.55);
      material.roughness = 0.11 + state.finish * 0.0045;
      material.vertexColors = false;
      if (material.emissive instanceof Color) material.emissive.set("#111111");
      if ("clearcoat" in material) material.clearcoat = 1 - state.finish * 0.006;
      material.needsUpdate = true;
    });
  }, [state.paint, state.finish, model]);

  useEffect(() => {
    const wheel = WHEELS[state.wheel];
    model.materials.rims.forEach((material) => {
      material.color.set(wheel.color); material.metalness = 0.9; material.roughness = wheel.roughness; material.needsUpdate = true;
    });
  }, [state.wheel, model]);

  useEffect(() => {
    model.materials.lights.forEach((material) => {
      if (!(material.emissive instanceof Color)) material.emissive = new Color("#fff0cf");
      material.emissive.set("#fff0cf"); material.emissiveIntensity = 0; material.needsUpdate = true;
    });
    model.materials.tailLights.forEach((material) => {
      if (!(material.emissive instanceof Color)) material.emissive = new Color("#ff2338");
      material.emissive.set("#ff2338"); material.emissiveIntensity = 0; material.needsUpdate = true;
    });
  }, [model]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const sceneAudit = () => ({
      vehicle: vehicleId,
      groundOffset: config.groundOffset,
      groundContact: model.groundContact,
      lighting: {
        headlights: model.materials.lights.map((material) => material.emissiveIntensity ?? 0),
        tailLights: model.materials.tailLights.map((material) => material.emissiveIntensity ?? 0),
        geometry: model.headlightGeometry,
        bounds: model.headlightBounds,
        anchors: model.headlightAnchors,
      },
      parts: Object.fromEntries(Object.entries(config.parts).map(([key, definition]) => {
        const pivot = model.pivots[key];
        return [key, {
          resolved: Boolean(pivot),
          motion: definition.motion ?? "hinge",
          visible: pivot?.visible ?? false,
          targets: model.slideTargets[key]?.map(({ target }) => ({ name: target.name, visible: target.visible })) ?? [],
        }];
      })),
      position: group.current?.position.toArray() ?? null,
      yaw: group.current?.rotation.y ?? null,
    });
    globalThis.__formdriveSceneAudit = sceneAudit;
    globalThis.__formdriveModelScene = model.scene;
    return () => {
      if (globalThis.__formdriveSceneAudit === sceneAudit) delete globalThis.__formdriveSceneAudit;
      if (globalThis.__formdriveModelScene === model.scene) delete globalThis.__formdriveModelScene;
    };
  }, [config, model, vehicleId, state.headlights, state.tailLights]);

  useFrame((_, delta) => {
    if (group.current) globalThis.__formdriveActiveTransform = {
      position: group.current.position.toArray(),
      yaw: group.current.rotation.y - config.rotation[1],
      moving: false,
    };
    const livePaint = PAINTS[state.paint];
    model.materials.paint.forEach((material) => {
      material.color.set(livePaint.color);
      material.metalness = Math.min(livePaint.metalness, 0.55);
    });
    headlightLevel.current = MathUtils.damp(headlightLevel.current, state.headlights ? 1 : 0, state.headlights ? 6.2 : 10.5, delta);
    tailLightLevel.current = MathUtils.damp(tailLightLevel.current, state.tailLights ? 1 : 0, state.tailLights ? 7.2 : 11.5, delta);
    const headlightGlow = MathUtils.smootherstep(headlightLevel.current, 0, 1);
    const tailLightGlow = MathUtils.smootherstep(tailLightLevel.current, 0, 1);
    model.materials.lights.forEach((material) => { material.emissiveIntensity = headlightGlow * 2.7; });
    model.materials.tailLights.forEach((material) => { material.emissiveIntensity = tailLightGlow * 3.2; });
    Object.entries(config.parts).forEach(([key, definition]) => {
      const pivot = model.pivots[key];
      if (!pivot) return;
      const isOpen = Boolean(state.partStates[key]);
      if (definition.motion === "slide") {
        (model.slideTargets[key] ?? []).forEach(({ target, base, travel, materials }) => {
          const windowDamping = 1.65;
          target.position.x = MathUtils.damp(target.position.x, base.x + (isOpen ? travel.x : 0), windowDamping, delta);
          target.position.y = MathUtils.damp(target.position.y, base.y + (isOpen ? travel.y : 0), windowDamping, delta);
          target.position.z = MathUtils.damp(target.position.z, base.z + (isOpen ? travel.z : 0), windowDamping, delta);
          // Fully lowered panes belong inside the door cavity. Fade each mesh in
          // a compound pane together so imported trim layers cannot remain behind.
          const slideProgress = travel.lengthSq() > 0 ? target.position.distanceTo(base) / travel.length() : Number(isOpen);
          const glassMask = 1 - MathUtils.smootherstep(slideProgress, 0.14, 0.68);
          materials.forEach(({ material, opacity, transparent, depthWrite }) => {
            material.opacity = opacity * glassMask;
            const nextTransparent = glassMask < 0.995 || transparent;
            if (material.transparent !== nextTransparent) {
              material.transparent = nextTransparent;
              material.needsUpdate = true;
            }
            material.depthWrite = glassMask > 0.995 ? depthWrite : false;
          });
          target.visible = glassMask > 0.015;
        });
        return;
      }
      const base = model.rotations[key];
      if (!base) return;
      pivot.rotation[definition.axis] = MathUtils.damp(pivot.rotation[definition.axis], base[definition.axis] + (isOpen ? definition.angle : 0), 6.5, delta);
    });
  });

  return <group ref={group} scale={model.scale} position={[0, config.groundOffset, 0]} rotation={config.rotation}><primitive object={model.scene} /></group>;
}

export function VehicleModel() {
  const selectedVehicle = useStudioStore((state) => state.vehicle);
  return <VehicleModelInstance key={selectedVehicle} vehicleId={selectedVehicle} />;
}
