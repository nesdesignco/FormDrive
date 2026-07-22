import React, { useLayoutEffect, useRef, useState } from "react";
import { PAINTS, STUDIOS, VEHICLES, WHEELS } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";
import { GlassSwitch } from "./GlassSwitch";

export function ControlDeck() {
  const [tab, setTab] = useState("paint");
  const [contentHeight, setContentHeight] = useState(null);
  const contentInnerRef = useRef(null);
  const store = useStudioStore();
  const parts = VEHICLES[store.vehicle].parts;
  useLayoutEffect(() => {
    const content = contentInnerRef.current;
    if (!content) return undefined;
    const updateHeight = () => setContentHeight(store.panelOpen ? content.scrollHeight : 0);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    return () => observer.disconnect();
  }, [store.panelOpen, store.vehicle, tab]);
  return <section id="studio-controls" className={`control-deck reveal ${store.panelOpen ? "" : "is-collapsed"}`} style={{ "--i": 2 }} aria-label="Vehicle customization panel">
    <div className="deck-heading"><div><span className="deck-kicker">Configuration</span><h2>{PAINTS[store.paint].label}</h2></div><button className="deck-toggle" type="button" aria-label={store.panelOpen ? "Collapse configuration" : "Expand configuration"} aria-expanded={store.panelOpen} onClick={store.togglePanel}><span>{store.panelOpen ? "Collapse" : "Expand"}</span><svg viewBox="0 0 24 24"><path d="m7 9 5 5 5-5"/></svg></button></div>
    <div className="deck-content" style={{ height: contentHeight === null ? "auto" : `${contentHeight}px` }}><div ref={contentInnerRef}><div className="tab-list tab-list--four" role="tablist" style={{ "--active-index": ["paint", "wheel", "parts", "studio"].indexOf(tab) }}>{["paint", "wheel", "parts", "studio"].map((name) => <button key={name} className={`tab-button ${tab === name ? "is-active" : ""}`} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name === "wheel" ? "Wheels" : name[0].toUpperCase() + name.slice(1)}</button>)}</div>
      {tab === "paint" && <div className="tab-panel"><div className="swatch-row">{Object.entries(PAINTS).map(([key, value]) => <button key={key} className={`swatch swatch--${key} ${store.paint === key ? "is-selected" : ""}`} aria-label={`${value.label} paint`} aria-pressed={store.paint === key} onClick={() => store.setPaint(key)} />)}</div><label className="range-field"><span><span>Finish</span><output>{store.finish < 34 ? "Gloss" : store.finish < 68 ? "Silk" : "Satin"}</output></span><input type="range" min="0" max="100" value={store.finish} onChange={(event) => store.setFinish(Number(event.target.value))} /></label></div>}
      {tab === "wheel" && <div className="tab-panel"><div className="option-list">{Object.entries(WHEELS).map(([key, value]) => <button key={key} className={`option-button ${store.wheel === key ? "is-selected" : ""}`} aria-pressed={store.wheel === key} onClick={() => store.setWheel(key)}><span>{value.label}</span><small>{value.note}</small></button>)}</div></div>}
      {tab === "parts" && <div className="tab-panel"><div className="part-grid">{Object.entries(parts).map(([key, part]) => { const open = Boolean(store.partStates[key]); return <button key={key} className={`part-button ${open ? "is-selected" : ""}`} aria-pressed={open} onClick={() => store.togglePart(key)}><span>{part.label}</span><small>{open ? "Close" : "Open"}</small></button>; })}</div><button className="close-parts" type="button" onClick={store.closeAllParts}>Close every moving part</button></div>}
      {tab === "studio" && <div className="tab-panel"><div className="option-list option-list--compact">{Object.entries(STUDIOS).map(([key, value]) => <button key={key} className={`option-button ${store.studio === key ? "is-selected" : ""}`} aria-pressed={store.studio === key} onClick={() => store.setStudio(key)}><span>{value.label}</span><small>{value.note}</small></button>)}</div><div className="switch-stack"><div className="switch-row"><span><strong>Headlights</strong><small>Projected front beams</small></span><GlassSwitch label="Toggle headlights" checked={store.headlights} onChange={store.toggleHeadlights} /></div><div className="switch-row"><span><strong>Tail lights</strong><small>Rear LED signature</small></span><GlassSwitch label="Toggle tail lights" checked={store.tailLights} onChange={store.toggleTailLights} /></div></div></div>}
    </div></div>
  </section>;
}
