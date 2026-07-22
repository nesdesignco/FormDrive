import React from "react";
import { VEHICLES } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";

export function VehicleSelector() {
  const vehicle = useStudioStore((state) => state.vehicle);
  const setVehicle = useStudioStore((state) => state.setVehicle);
  return <aside className="vehicle-selector reveal" style={{ "--i": 3 }} aria-label="Vehicle collection">
    <p>Collection <span>03 vehicles</span></p>
    <div>{Object.entries(VEHICLES).map(([key, item], index) => <button key={key} className={vehicle === key ? "is-active" : ""} aria-pressed={vehicle === key} onClick={() => { if (vehicle !== key) setVehicle(key); }}><span className="vehicle-preview"><img src={item.thumbnail} alt="" /></span><span className="vehicle-index">0{index + 1}</span><strong>{item.label}</strong><small>{item.year}</small></button>)}</div>
  </aside>;
}
