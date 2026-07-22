import React from "react";
import { useStudioStore } from "../../state/useStudioStore";

export function Navigation() {
  const setCameraView = useStudioStore((s) => s.setCameraView);
  return (
    <nav className="nav-pill reveal" aria-label="FORMDRIVE" style={{ "--i": 0 }}>
      <button className="wordmark" type="button" onClick={() => setCameraView("hero")}>
        FORMDRIVE
      </button>
      <span className="nav-divider" aria-hidden="true" />
      <span className="brand-credit">MADE BY ENES KAYMAZ</span>
      <a className="brand-link" href="https://x.com/nesdesignco" target="_blank" rel="noreferrer noopener" aria-label="NESDESIGNCO on X">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" /></svg>
        <span className="sr-only">@NESDESIGNCO</span>
      </a>
      <a
        className="brand-link"
        href="https://github.com/nesdesignco"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="NESDESIGNCO on GitHub"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.29-5.14-1.25-5.14-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.7 10.7 0 0 1 5.64 0c2.15-1.46 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98a4.35 4.35 0 0 1 1.16 3.02c0 4.32-2.64 5.27-5.15 5.55.4.35.76 1.04.76 2.1v3.13c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" />
        </svg>
        <span className="sr-only">NESDESIGNCO on GitHub</span>
      </a>
    </nav>
  );
}
