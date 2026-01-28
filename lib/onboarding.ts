import { LS_KEYS } from "./storageKeys";

export function hasSeenOnboarding() {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(LS_KEYS.ONBOARDING) === "1";
}

export function setSeenOnboarding() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LS_KEYS.ONBOARDING, "1");
}

export function resetOnboarding() {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(LS_KEYS.ONBOARDING);
}
