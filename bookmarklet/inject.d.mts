/** Replace the @@@BASE_URL@@@ / @@@WHOHASIT@@@ placeholders in `template` with
 * `baseUrl` / `whohasit`, quoted as JS string literals. See inject.mjs. */
export function inject(template: string, baseUrl: string, whohasit: string): string;
