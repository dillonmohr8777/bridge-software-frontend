"use client";

import { useSyncExternalStore } from "react";
import { isUnifiedReviewHost, lockedTheme } from "@/lib/direction-lock";
import { DirectionLockChip } from "./DirectionLockChip";
import { ThemeSwitcher } from "./ThemeSwitcher";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return isUnifiedReviewHost(window.location.hostname);
}

function getServerSnapshot() {
  return false;
}

export function HeaderDirectionControl() {
  const unified = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (unified || lockedTheme) {
    return <DirectionLockChip />;
  }
  return <ThemeSwitcher compact />;
}
