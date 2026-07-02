// Concise console logging with a common prefix, so the bookmarklet's steps are
// visible in the webmail page's devtools console.
export function log(...args: unknown[]): void {
    console.log('[mail-link]', ...args);
}
