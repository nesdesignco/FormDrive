import React from "react";
import { VEHICLES } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";

export function VehicleSelector() {
  const vehicle = useStudioStore((state) => state.vehicle);
  const pendingVehicle = useStudioStore((state) => state.pendingVehicle);
  const vehicleLoadError = useStudioStore((state) => state.vehicleLoadError);
  const requestVehicle = useStudioStore((state) => state.requestVehicle);

  return (
    <aside className="vehicle-selector reveal" style={{ "--i": 3 }} aria-label="Vehicle collection">
      <p>Collection <span>03 vehicles</span></p>
      <div>
        {Object.entries(VEHICLES).map(([key, item], index) => {
          const isActive = vehicle === key;
          const isLoading = pendingVehicle === key;
          const hasError = vehicleLoadError?.vehicle === key;
          const state = isLoading ? "loading" : hasError ? "error" : undefined;
          return (
            <button
              key={key}
              className={isActive ? "is-active" : ""}
              aria-label={`${item.label}, ${item.year}${isLoading ? ", loading" : hasError ? ", load failed, retry" : ""}`}
              aria-pressed={isActive}
              aria-busy={isLoading}
              data-state={state}
              onClick={() => requestVehicle(key)}
            >
              <span className="vehicle-preview"><img src={item.thumbnail} alt="" /></span>
              <span className="vehicle-index">0{index + 1}</span>
              <strong>{item.label}</strong>
              <small>{isLoading ? "Loading" : hasError ? "Retry" : item.year}</small>
            </button>
          );
        })}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {pendingVehicle ? `Loading ${VEHICLES[pendingVehicle].label}` : vehicleLoadError ? `${VEHICLES[vehicleLoadError.vehicle].label} could not be loaded` : ""}
      </span>
    </aside>
  );
}
