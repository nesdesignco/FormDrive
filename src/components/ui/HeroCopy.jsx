import React from "react";
import { VEHICLES } from "../../config/studioConfig";
import { useStudioStore } from "../../state/useStudioStore";
export function HeroCopy() { const vehicle = VEHICLES[useStudioStore((state) => state.vehicle)]; return <header className="hero-copy reveal" style={{ "--i": 1 }}><p className="model-line">{vehicle.eyebrow} <span>{vehicle.year}</span></p><h1>Shape the drive.</h1><p>Choose a car, change its finish, then open every available body panel in real time.</p></header>; }
