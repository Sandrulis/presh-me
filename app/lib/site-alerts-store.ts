"use client";

/** Lightweight flag: when true, browser tab may show notification favicon. */
let hasAlert = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeSiteAlerts(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getSiteAlertSnapshot() {
  return hasAlert;
}

export function setSiteHasAlert(next: boolean) {
  if (hasAlert === next) return;
  hasAlert = next;
  emit();
}
