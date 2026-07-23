import React, { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useStudioStore } from "../../state/useStudioStore";

const MINIMUM_DISPLAY_MS = 900;
const EXIT_DURATION_MS = 720;
const PROGRESS_TRAVEL_MS = 1800;
const LOADER_CACHE_KEY = "formdrive:studio-ready:v1";

export function InitialLoadingScreen() {
  const [shouldBypassLoader] = useState(() => {
    try {
      return window.localStorage.getItem(LOADER_CACHE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (shouldBypassLoader) return null;

  return <TrackedInitialLoadingScreen />;
}

function TrackedInitialLoadingScreen() {
  const { active, progress, errors, loaded, total } = useProgress();
  const renderer = useStudioStore((state) => state.renderer);
  const initialSceneReady = useStudioStore((state) => state.initialSceneReady);
  const initialAssetProgress = useStudioStore((state) => state.initialAssetProgress);
  const initialAssetLoadedBytes = useStudioStore((state) => state.initialAssetLoadedBytes);
  const initialAssetTotalBytes = useStudioStore((state) => state.initialAssetTotalBytes);
  const startedAt = useRef(performance.now());
  const targetProgress = useRef(0);
  const displayedProgress = useRef(0);
  const sceneReady = useRef(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const hasError = errors.length > 0;
  const assetsSettled = !active && (total === 0 || loaded >= total);
  targetProgress.current = initialSceneReady
    ? 100
    : Math.min(96, Math.max(0, initialAssetProgress || progress));
  sceneReady.current = initialSceneReady;
  const visibleProgress = Math.round(animatedProgress);
  const canEnterStudio = Boolean(
    renderer
    && initialSceneReady
    && assetsSettled
    && !hasError
    && animatedProgress >= 99.9
  );
  const progressLabel = String(visibleProgress).padStart(2, "0");
  const loadedMegabytes = (initialAssetLoadedBytes / 1_048_576).toFixed(1);
  const totalMegabytes = initialAssetTotalBytes
    ? (initialAssetTotalBytes / 1_048_576).toFixed(1)
    : null;
  const status = hasError
    ? "ASSET LOAD INTERRUPTED"
    : initialSceneReady && animatedProgress >= 99.9
      ? "FINAL FRAME READY"
      : initialSceneReady || initialAssetProgress >= 100
        ? "CALIBRATING MATERIALS"
        : "LOADING VEHICLE GEOMETRY";

  useEffect(() => {
    let animationFrame;
    let previousTime = performance.now();

    const advance = (time) => {
      const elapsed = Math.min(64, time - previousTime);
      previousTime = time;
      const nextProgress = Math.min(
        targetProgress.current,
        displayedProgress.current + ((elapsed / PROGRESS_TRAVEL_MS) * 100),
      );

      if (nextProgress !== displayedProgress.current) {
        displayedProgress.current = nextProgress;
        setAnimatedProgress(nextProgress);
      }

      if (displayedProgress.current < 100 || !sceneReady.current) {
        animationFrame = window.requestAnimationFrame(advance);
      }
    };

    animationFrame = window.requestAnimationFrame(advance);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    if (!canEnterStudio) return undefined;

    try {
      window.localStorage.setItem(LOADER_CACHE_KEY, "1");
      document.documentElement.classList.add("formdrive-cached");
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }

    const remaining = Math.max(0, MINIMUM_DISPLAY_MS - (performance.now() - startedAt.current));
    const completeTimer = window.setTimeout(() => setIsComplete(true), remaining);
    const dismissTimer = window.setTimeout(() => setIsDismissed(true), remaining + EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(completeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [canEnterStudio]);

  if (isDismissed) return null;

  return (
    <section
      className={`loading-screen${isComplete ? " is-complete" : ""}${hasError ? " has-error" : ""}`}
      data-testid="initial-loader"
      aria-label="FormDrive studio loading"
      aria-busy={!isComplete}
      aria-live="polite"
    >
      <header className="loading-header">
        <span className="loading-wordmark">FORMDRIVE</span>
        <span className="loading-edition">REALTIME AUTOMOTIVE STUDIO</span>
      </header>

      <div className="loading-hero" aria-hidden="true">
        <span>INITIALIZING / 01</span>
        <p>Shape takes form.</p>
      </div>

      <div className="loading-telemetry">
        <div className="loading-status">
          <span>{status}</span>
          <strong>{progressLabel}</strong>
        </div>
        <div
          className="loading-rule"
          role="progressbar"
          aria-label="Loading studio assets"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={visibleProgress}
        >
          <span style={{ "--loading-progress": visibleProgress / 100 }} />
        </div>
        <div className="loading-meta" aria-hidden="true">
          <span>WEBGPU / WEBGL</span>
          <span>{totalMegabytes ? `${loadedMegabytes} / ${totalMegabytes} MB` : "FORMDRIVE © 2026"}</span>
        </div>
        {hasError && (
          <button className="loading-retry" type="button" onClick={() => window.location.reload()}>
            Reload studio
          </button>
        )}
      </div>
    </section>
  );
}
