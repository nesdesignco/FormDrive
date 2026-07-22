import React from "react";

export function GlassSwitch({ checked, onChange, label }) {
  return <button
    className="glass-switch"
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={checked}
    onClick={onChange}
  ><span className="glass-switch__thumb" /></button>;
}
