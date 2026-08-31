type AuthEvent = { type: "expired" } | { type: "logged-out" };

const listeners: Array<(event: AuthEvent) => void> = [];

export function onAuthEvent(fn: (event: AuthEvent) => void): () => void {
  listeners.push(fn);
  return () => {
    const index = listeners.indexOf(fn);
    if (index >= 0) listeners.splice(index, 1);
  };
}

export function emitAuthExpired(): void {
  listeners.forEach((fn) => fn({ type: "expired" }));
}

export function emitAuthLoggedOut(): void {
  listeners.forEach((fn) => fn({ type: "logged-out" }));
}