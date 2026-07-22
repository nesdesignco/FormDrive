import React, { useEffect, useRef } from "react";
import { VEHICLES } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";

export function InfoDialog() {
  const ref = useRef();
  const open = useStudioStore((s) => s.infoOpen);
  const close = useStudioStore((s) => s.closeInfo);
  const vehicle = VEHICLES[useStudioStore((s) => s.vehicle)];
  useEffect(() => {
    if (open && !ref.current.open) ref.current.showModal();
    if (!open && ref.current.open) ref.current.close();
  }, [open]);
  return (
    <dialog ref={ref} className="info-dialog" onClose={close}>
      <div className="dialog-header">
        <div>
          <span className="deck-kicker">Open-source study</span>
          <h2>A real model, rendered live.</h2>
        </div>
        <button className="icon-button" onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p className="dialog-lede">
        The {vehicle.label} uses detailed PBR geometry. Available doors, hood
        and rear panel are independent original meshes animated at their
        modelled pivots.
      </p>
      <dl className="spec-sheet">
        {Object.values(VEHICLES).map((item, index) => (
          <div key={item.label}>
            <dt>Model 0{index + 1}</dt>
            <dd>{item.label}</dd>
            <span>{item.year}</span>
          </div>
        ))}
        <div>
          <dt>Body</dt>
          <dd>Textured PBR</dd>
          <span>Separate opening parts</span>
        </div>
        <div>
          <dt>Render</dt>
          <dd>Three.js WebGPU</dd>
          <span>WebGL fallback</span>
        </div>
        <div>
          <dt>Architecture</dt>
          <dd>React components</dd>
          <span>R3F + Zustand</span>
        </div>
      </dl>
      <footer className="foot-line">
        <a href="https://x.com/nesdesignco" target="_blank" rel="noreferrer noopener">
          FORMDRIVE · MADE BY ENES KAYMAZ · X @NESDESIGNCO
        </a>
      </footer>
    </dialog>
  );
}
