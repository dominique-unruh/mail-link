// Parsing mail-links back into their parts.

/** A parsed mail-link: the message-id and the remaining `key=value` fields of the fragment. */
export interface ParsedMailLink {
    mid: string;
    params: Record<string, string>;
}

/** Parses the fragment of the mail-link `url`. Returns `null` if the URL has no fragment. */
export function parseMailLink(url: string): ParsedMailLink | null {
    const hash = new URL(url).hash;
    if (!hash || hash.length <= 1)
        return null;

    // Remove the leading '#'
    const fragment = hash.substring(1);

    // Split by '&'
    const parts = fragment.split('&');

    if (parts.length === 0) {
        return null;
    }

    // First part is the mid
    const mid = decodeURIComponent(parts[0]);

    // Rest are key=value pairs
    const params: Record<string, string> = {};

    for (let i = 1; i < parts.length; i++) {
        const pair = parts[i].split('=');
        if (pair.length === 2) {
            const key = decodeURIComponent(pair[0].replace(/\+/g, ' '));
            // noinspection UnnecessaryLocalVariableJS
            const value = decodeURIComponent(pair[1].replace(/\+/g, ' '));
            params[key] = value;
        }
    }

    return { mid, params };
}
