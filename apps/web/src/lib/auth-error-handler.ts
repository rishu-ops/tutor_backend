/**
 * Global auth-error handler.
 *
 * Decouples api.ts (plain module) from the React/Zustand store by letting the
 * app register a callback that fires whenever the API returns an
 * "Invalid or expired access token" error.
 */

type LogoutHandler = () => void;

let _handler: LogoutHandler | null = null;

export function registerAuthErrorHandler(handler: LogoutHandler) {
  _handler = handler;
}

export function unregisterAuthErrorHandler() {
  _handler = null;
}

export function triggerAuthError() {
  if (_handler) {
    _handler();
  }
}
