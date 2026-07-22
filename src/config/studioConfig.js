const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export const PAINTS = {
  obsidian: { label: "Obsidian", color: "#171615", metalness: 0.78 },
  silver: { label: "Liquid silver", color: "#b9bbb6", metalness: 0.92 },
  copper: { label: "Burgundy", color: "#651f2a", metalness: 0.58 },
  ivory: { label: "Ivory", color: "#e5dcc4", metalness: 0.55 },
  blue: { label: "Midnight blue", color: "#102b54", metalness: 0.76 },
};

export const VEHICLES = {
  mustang: {
    eyebrow: "FORD MUSTANG GT", year: "2005", label: "Mustang GT", note: "American muscle", thumbnail: assetUrl("models/mustang-preview.jpg"),
    url: assetUrl("models/mustang-2005.glb"), rotation: [0, -0.08, 0], groundOffset: -0.015,
    parts: {
      leftDoor: { label: "Left door", prefix: "leftdoor_", ascend: 1, axis: "y", angle: -1.02 },
      rightDoor: { label: "Right door", prefix: "rightdoor_", ascend: 1, axis: "y", angle: 1.02 },
      leftWindow: { label: "Left window", exact: "leftdoor_Glass_Clear_0", companions: [{ exact: "leftdoor_Material_#217_0" }], motion: "slide", travel: 0.34 },
      rightWindow: { label: "Right window", exact: "rightdoor_Material_#300_0", motion: "slide", travel: 0.34 },
      hood: { label: "Hood", prefix: "hood_", ascend: 1, axis: "z", angle: -0.9 },
      trunk: { label: "Trunk", prefix: "trunk_", ascend: 1, axis: "z", angle: 0.82 },
    },
    attachments: { trunk: [{ prefix: "rearbadge_" }] },
    paintNames: ["carpaint"], rimNames: ["frdperofrmcrim", "aluminium_clean2", "aluminium_clean3"], lightNames: ["headlight"], tailLightNames: ["tailight_reddrk", "tailight_redglass"],
  },
  tesla: {
    eyebrow: "TESLA MODEL 3", year: "2018", label: "Model 3", note: "Electric sedan", thumbnail: assetUrl("models/tesla-preview.jpg"),
    url: assetUrl("models/tesla-model-3-2018.glb"), rotation: [0, Math.PI, 0], groundOffset: -0.025,
    parts: {
      leftDoor: { label: "Front left", exact: "door_lf_dummy", axis: "z", angle: -1.08 },
      rearLeftDoor: { label: "Rear left", exact: "door_lr_dummy", axis: "z", angle: -1.02 },
      rightDoor: { label: "Front right", exact: "door_rf_dummy", axis: "z", angle: 1.08 },
      rearRightDoor: { label: "Rear right", exact: "door_rr_dummy", axis: "z", angle: 1.02 },
      leftWindow: { label: "Front L glass", exact: "door_lf_glass0_0", motion: "slide", travel: 0.31 },
      rearLeftWindow: { label: "Rear L glass", exact: "door_lr_glass0_0", motion: "slide", travel: 0.27 },
      rightWindow: { label: "Front R glass", exact: "door_rf_glass0_0", motion: "slide", travel: 0.31 },
      rearRightWindow: { label: "Rear R glass", exact: "door_rr_glass0_0", motion: "slide", travel: 0.27 },
      hood: { label: "Front trunk", exact: "bonnet_dummy", axis: "x", angle: 0.58 },
      trunk: { label: "Rear trunk", exact: "boot_dummy", axis: "x", angle: -0.82 },
    },
    paintNames: ["primary", "paint_black", "putih_putih0_0", "putih002_putih0_0"], rimNames: ["wheels"], lightNames: ["right_front_light", "left_front_light", "foglight_r", "foglight_l"], tailLightNames: ["right_rear_light", "left_rear_light", "breaklight_l"],
  },
  concept: {
    eyebrow: "K15 CONCEPT COUPÉ", year: "2021", label: "K15 Concept", note: "Technical coupé", thumbnail: assetUrl("models/concept-preview.jpg"),
    url: assetUrl("models/car-concept.glb"), rotation: [0, 0.08, 0], groundOffset: -0.16,
    parts: {
      leftDoor: { label: "Left door", exact: "BodyDoorLColor1", axis: "z", angle: -1.0 },
      rightDoor: { label: "Right door", exact: "BodyDoorRColor1", axis: "z", angle: 1.0 },
      leftWindow: { label: "Left window", exact: "BodyDoorLWindow", motion: "slide", travel: 0.3 },
      rightWindow: { label: "Right window", exact: "BodyDoorRWindow", motion: "slide", travel: 0.3 },
      hood: { label: "Hood", exact: "BodyHood", axis: "x", angle: 0.82 },
      trunk: { label: "Rear hatch", exact: "BodyRearPanelsColor1", axis: "x", angle: -0.72 },
    },
    paintNames: ["paint 1", "paint 2", "color1", "color2"], rimNames: ["rim"], lightNames: ["headlight"], tailLightNames: ["brakelight"],
  },
};

export const STUDIOS = {
  dusk: { label: "Dusk", note: "Warm daylight", background: "#50433a", floor: "#786b5e", key: "#ffd1a1", fill: "#c7d7ff", exposure: 1.08 },
  gallery: { label: "Gallery", note: "Bright soft white", background: "#454c51", floor: "#77736d", key: "#fff4df", fill: "#dae7ff", exposure: 1.04 },
  noir: { label: "Noir", note: "Crisp contrast", background: "#292a2b", floor: "#4d4c49", key: "#ffc5a4", fill: "#a5b9dd", exposure: 0.96 },
};

export const CAMERAS = {
  hero: { label: "Studio", position: [6.8, 3.1, 7.6], target: [0, 0.78, 0] },
  front: { label: "Front", position: [0.2, 1.8, 8.8], target: [0, 0.75, 0] },
  profile: { label: "Profile", position: [7.9, 1.55, 0.2], target: [0.5, 0.72, 0] },
  detail: { label: "Detail", position: [2.4, 1.75, 3.2], target: [0.5, 0.85, 0] },
};

export const WHEELS = {
  turbine: { label: "Turbine 21", note: "Smoked alloy", color: "#6f706d", roughness: 0.17 },
  monoblock: { label: "Mono 20", note: "Pure metal", color: "#b7b8b5", roughness: 0.1 },
  carbon: { label: "Carbon 22", note: "Carbon black", color: "#171817", roughness: 0.32 },
};

export const HEADLIGHT_RIGS = {
  mustang: { left: [-0.84, 0.67, 2.48], right: [1, 0.67, 2.48], leftTarget: [-1.04, -0.08, 10], rightTarget: [1.2, -0.08, 10], intensity: 96 },
  tesla: { left: [-0.72, 0.72, 2.55], right: [0.72, 0.72, 2.55], leftTarget: [-0.96, -0.06, 10], rightTarget: [0.96, -0.06, 10], intensity: 90 },
  concept: { left: [-0.86, 0.61, 2.5], right: [0.86, 0.61, 2.5], leftTarget: [-1.08, -0.08, 10], rightTarget: [1.08, -0.08, 10], intensity: 100 },
};
