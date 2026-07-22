import React from "react";
import { StudioCanvas } from "./components/scene/StudioCanvas";
import { Navigation } from "./components/ui/Navigation";
import { HeroCopy } from "./components/ui/HeroCopy";
import { ControlDeck } from "./components/ui/ControlDeck";
import { CameraControls } from "./components/ui/CameraControls";
import { InfoDialog } from "./components/ui/InfoDialog";
import { VehicleSelector } from "./components/ui/VehicleSelector";

export default function App() { return <><a className="skip-link" href="#studio-controls">Skip to controls</a><main className="app-shell"><StudioCanvas /><div className="scene-vignette" /><Navigation /><HeroCopy /><VehicleSelector /><ControlDeck /><CameraControls /><p className="gesture-hint">Drag — orbit · Scroll — zoom</p></main><InfoDialog /></>; }
