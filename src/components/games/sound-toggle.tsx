"use client";

import { useState, useEffect } from "react";

const KEY = "agy_sound_enabled";

function getEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(KEY);
  return v === null ? true : v === "true";
}

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getEnabled());
    const handler = () => setEnabled(getEnabled());
    window.addEventListener("agy_sound_toggle", handler);
    return () => window.removeEventListener("agy_sound_toggle", handler);
  }, []);

  const toggle = () => {
    const next = !enabled;
    localStorage.setItem(KEY, String(next));
    setEnabled(next);
    window.dispatchEvent(new Event("agy_sound_toggle"));
  };

  return (
    <button
      onClick={toggle}
      title={enabled ? "Mute sounds" : "Unmute sounds"}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 32,
        borderRadius: 8,
        background: enabled ? "rgba(0,194,255,0.12)" : "rgba(47,69,83,0.5)",
        border: `1px solid ${enabled ? "rgba(0,194,255,0.35)" : "rgba(47,69,83,0.7)"}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = enabled
          ? "rgba(0,194,255,0.22)"
          : "rgba(47,69,83,0.8)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = enabled
          ? "rgba(0,194,255,0.12)"
          : "rgba(47,69,83,0.5)";
      }}
    >
      {enabled ? (
        /* Speaker with waves */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={enabled ? "#00c2ff" : "#b1bad3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      ) : (
        /* Speaker muted */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b1bad3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
