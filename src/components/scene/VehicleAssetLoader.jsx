import React, { Component, Suspense, useCallback, useEffect } from "react";
import { VEHICLES } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";
import { useVehicleGLTF } from "../../hooks/useVehicleGLTF";

function VehicleLoadGate({ vehicleId, onReady }) {
  useVehicleGLTF(VEHICLES[vehicleId].url);

  useEffect(() => {
    onReady(vehicleId);
  }, [onReady, vehicleId]);

  return null;
}

class VehicleLoadErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function VehicleAssetLoader() {
  const pendingVehicle = useStudioStore((state) => state.pendingVehicle);
  const completeVehicleLoad = useStudioStore((state) => state.completeVehicleLoad);
  const failVehicleLoad = useStudioStore((state) => state.failVehicleLoad);
  const handleReady = useCallback((vehicleId) => {
    completeVehicleLoad(vehicleId);
  }, [completeVehicleLoad]);
  const handleError = useCallback((error) => {
    if (!pendingVehicle) return;
    failVehicleLoad(pendingVehicle, error instanceof Error ? error.message : "Vehicle asset failed to load");
  }, [failVehicleLoad, pendingVehicle]);

  if (!pendingVehicle) return null;

  return (
    <VehicleLoadErrorBoundary key={pendingVehicle} onError={handleError}>
      <Suspense fallback={null}>
        <VehicleLoadGate vehicleId={pendingVehicle} onReady={handleReady} />
      </Suspense>
    </VehicleLoadErrorBoundary>
  );
}
