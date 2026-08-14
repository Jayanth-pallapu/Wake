"use client";
import { useState, useEffect, useCallback, useRef } from "react";
export function useFullscreen() {
  const ref = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (!ref.current) return;
    if (!document.fullscreenElement) {
      ref.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);
  return { ref, isFullscreen, toggleFullscreen };
}
