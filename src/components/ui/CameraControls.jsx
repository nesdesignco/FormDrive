import React from "react";
import { CAMERAS } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";

export function CameraControls() {
  const cameraView = useStudioStore((s) => s.cameraView); const setCameraView = useStudioStore((s) => s.setCameraView); const capture = useStudioStore((s) => s.capture); const openInfo = useStudioStore((s) => s.openInfo);
  return <><aside className="camera-rail reveal" style={{ "--i": 3, "--active-index": Object.keys(CAMERAS).indexOf(cameraView) }} aria-label="Camera angles">{Object.entries(CAMERAS).map(([key, value], index) => <button key={key} className={`camera-button ${cameraView === key ? "is-active" : ""}`} aria-pressed={cameraView === key} onClick={() => setCameraView(key)}><span>0{index + 1}</span>{value.label}</button>)}</aside><div className="action-cluster reveal" style={{ "--i": 4 }}><button className="round-action" type="button" aria-label="Open technical information" onClick={openInfo}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 7h.01"/></svg></button><button className="round-action" type="button" aria-label="Download studio image" onClick={capture}><svg viewBox="0 0 24 24"><path d="M8 7 9.5 5h5L16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3Z"/><circle cx="12" cy="13" r="3"/></svg></button></div></>;
}
