// Minimal but standards-conformant RFC 5322 header parsing, plus RFC 2047
// encoded-word decoding. Kept dependency-free and small so the bundled
// bookmarklet stays well under Firefox's bookmark-URL size limit.

/** Parsed headers: lower-cased field name -> field bodies, in order of appearance. */
export type Headers = Map<string, string[]>;

/**
 * Parse the header section of an RFC 5322 message. Accepts a full message
 * (headers followed by a blank line and a body) or a header-only string.
 * Handles both CRLF and LF line endings and unfolds folded header values.
 */
export function parseHeaders(message: string): Headers {
    // The header section ends at the first empty line.
    const end = message.search(/\r?\n\r?\n/);
    const block = end === -1 ? message : message.slice(0, end);

    // Unfolding (RFC 5322 §2.2.3): a header value may be split across lines by
    // inserting CRLF before whitespace. Remove that CRLF, keeping the whitespace.
    const unfolded = block.replace(/\r?\n(?=[ \t])/g, '');

    const headers: Headers = new Map();
    for (const line of unfolded.split(/\r?\n/)) {
        const colon = line.indexOf(':');
        if (colon <= 0)
            continue; // blank or malformed line (no field name)
        const name = line.slice(0, colon).trim().toLowerCase();
        const body = line.slice(colon + 1).trim();
        const existing = headers.get(name);
        if (existing)
            existing.push(body);
        else
            headers.set(name, [body]);
    }
    return headers;
}

/** The first value of the named header (case-insensitive), or undefined. */
export function firstHeader(headers: Headers, name: string): string | undefined {
    return headers.get(name.toLowerCase())?.[0];
}

/** Bytes of a binary string (each char code is one byte, as produced by atob). */
function bytesOf(binary: string): Uint8Array {
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/**
 * Decode RFC 2047 encoded-words (`=?charset?B?...?=` / `=?charset?Q?...?=`) found
 * in a header value. Undecodable words are left verbatim.
 */
export function decodeEncodedWords(value: string): string {
    const word = /=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/;

    // Whitespace separating two adjacent encoded-words is not part of the text
    // (RFC 2047 §6.2); collapse it so decoded words join seamlessly.
    const joined = value.replace(
        new RegExp(`(${word.source})\\s+(?=${word.source})`, 'g'),
        '$1',
    );

    return joined.replace(new RegExp(word.source, 'g'), (match, charset, enc, text) => {
        try {
            let bytes: Uint8Array;
            if (enc.toUpperCase() === 'B') {
                bytes = bytesOf(atob(text.replace(/\s+/g, '')));
            } else {
                // Q-encoding: '_' means space, '=XX' is a hex byte.
                const decoded = text
                    .replace(/_/g, ' ')
                    .replace(/=([0-9A-Fa-f]{2})/g, (_m: string, h: string) =>
                        String.fromCharCode(parseInt(h, 16)));
                bytes = bytesOf(decoded);
            }
            return new TextDecoder(charset).decode(bytes);
        } catch {
            return match;
        }
    });
}
