// Parsing mail-links back into their fields.

import {FIELD_NAME, type MailLinkFields} from './maillink.js';

/** Thrown by {@link parseMailLink} if the link cannot be interpreted at all. */
export class MailLinkParseError extends Error {
    override name = 'MailLinkParseError';
}

/** Decodes an encoded part of the fragment: percent-encoded UTF-8, `+` for space.
 * Throws `URIError` on malformed percent-encoding. */
function decode(encoded: string): string {
    return decodeURIComponent(encoded.replace(/\+/g, ' '));
}

/**
 * Parses the mail-link `url` into its fields (the inverse of {@link buildMailLink}).
 *
 * Problems that still allow interpreting the link are tolerated and listed in `parseErrors`:
 * - field names with uppercase letters (converted to lowercase),
 * - invalid field names, fields without `=`, and malformed percent-encoding (field dropped),
 * - repeated fields (the first occurrence is used).
 *
 * Fields with an empty value are treated as absent.
 * The returned object has no prototype, so field names like `constructor` are safe.
 *
 * @throws MailLinkParseError if `url` is not a URL, has no fragment, or has no valid message-id.
 */
export function parseMailLink(url: string): MailLinkFields {
    let hash: string;
    try {
        hash = new URL(url).hash;
    } catch {
        throw new MailLinkParseError('Not a valid URL');
    }
    if (hash.length <= 1)
        throw new MailLinkParseError('The link has no fragment (the part after "#")');

    // Remove the leading '#'; the first part is the message-id, the rest are field=value pairs.
    const [encodedMessageId, ...parts] = hash.substring(1).split('&');

    let messageId: string;
    try {
        messageId = decode(encodedMessageId);
    } catch {
        throw new MailLinkParseError('Malformed percent-encoding in the message-id');
    }
    if (messageId === '')
        throw new MailLinkParseError('The link has no message-id');

    const fields: MailLinkFields = Object.assign(Object.create(null), {messageId});
    const errors: string[] = [];
    const seen = new Set<string>();

    for (const part of parts) {
        const eq = part.indexOf('=');
        if (eq === -1) {
            errors.push(`Ignored field without "=": ${JSON.stringify(part)}`);
            continue;
        }

        let name: string, value: string;
        try {
            name = decode(part.substring(0, eq));
            value = decode(part.substring(eq + 1));
        } catch {
            errors.push(`Ignored field with malformed percent-encoding: ${JSON.stringify(part)}`);
            continue;
        }

        const lowercase = name.toLowerCase() as Lowercase<string>;
        if (lowercase !== name)
            errors.push(`Field name ${JSON.stringify(name)} is not lowercase`);
        if (!FIELD_NAME.test(lowercase)) {
            errors.push(`Ignored field with invalid name ${JSON.stringify(name)}: ${JSON.stringify(value)}`);
            continue;
        }
        if (seen.has(lowercase)) {
            errors.push(`Ignored repeated field ${JSON.stringify(lowercase)}: ${JSON.stringify(value)}`);
            continue;
        }
        seen.add(lowercase);
        if (value === '')
            continue;

        fields[lowercase] = value;
    }

    if (errors.length > 0)
        fields.parseErrors = errors;
    return fields;
}
