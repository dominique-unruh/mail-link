// Shared code for mail-link generation

/** Like encodeURIComponent but encodes additional characters that make the URI more suitable for
 * automatic recognition inside plain text */
export function myEncodeURIComponent(uriComponent: string): string {
    return encodeURIComponent(uriComponent)
        .replace(/'/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

/** Optionally quotes the last character of the URI to make sure the URI is more suitable for
 * automatic recognition inside plain text. E.g., doesn't end in a `.`. */
export function fixupURL(url: string): string {
    // The pattern guarantees that we don't escape anything alphanumeric (which first isn't worth
    // quoting and second might be part of an already escaped character) nor any symbols that are
    // part of not to be quoted URL parts (such as path separator /, query-string syntax elements
    // &,=, etc.)
    return url.replace(/[^a-zA-Z0-9/&#=]$/, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

/** The data of a mail-link (everything except the base URL).
 *
 * Besides `messageId` and `parseErrors` (whose names contain uppercase letters), all properties
 * are fields of the link. Field names are lowercase (as required by the mail-link format), so
 * they never collide with `messageId` or `parseErrors`. */
export interface MailLinkFields {
    /** Message-ID without surrounding `<>`. The only mandatory field. */
    messageId: string;
    /** Problems found by {@link parseMailLink} in a link it could still interpret.
     * Ignored by {@link buildMailLink}. */
    parseErrors?: string[];
    /** Subject of the email. */
    subject?: string;
    /** Sending date as an RFC 5322 (Section 3.3) timestamp; passed through verbatim. */
    date?: string;
    /** Sender: an email address or `NAME <EMAIL>`. */
    from?: string;
    /** Recipients: email addresses or `NAME <EMAIL>`, separated by ", ". */
    to?: string;
    /** Who has the email (whom to contact to get it). */
    whohasit?: string;
    /** Any other field. Field names consist of `a-z0-9-` and start with `a-z`. */
    [field: Lowercase<string>]: string | undefined;
}

/** The fields defined by the mail-link format, in the order {@link buildMailLink} emits them. */
export const KNOWN_FIELDS: readonly string[] = ['subject', 'date', 'from', 'to', 'whohasit'];

/** Valid field names according to the mail-link format. */
export const FIELD_NAME = /^[a-z][a-z0-9-]*$/;

/** Construct a mail-link URL from `baseUrl` and the given `fields`.
 *
 * The known fields are emitted first (in the order subject, date, from, to, whohasit), then all
 * other fields in property order. Empty and undefined fields are omitted; `parseErrors` is
 * ignored. Values are percent-encoded, and the last character of the result is percent-encoded
 * if it might otherwise be cut off when the link is recognized in plain text (e.g., a final `.`).
 *
 * @param baseUrl URL of the landing page that interprets mail-links (e.g.,
 *   `https://example.org/mail-link/`). Must not contain a `#`; it is used verbatim.
 * @param fields The data to encode. `messageId` is required.
 * @throws Error if `messageId` is missing or empty, or if a field has an invalid name or a
 *   non-string value (possible only by bypassing the type of `fields`). */
export function buildMailLink(baseUrl: string, fields: MailLinkFields): string {
    if (!fields.messageId || fields.messageId === "")
        throw Error("Could not determine message id");

    let url = baseUrl;

    // Start with message ID
    url += "#" + myEncodeURIComponent(fields.messageId);

    const extraFields = Object.keys(fields)
        .filter(name => name !== 'messageId' && name !== 'parseErrors' && !KNOWN_FIELDS.includes(name));
    for (const name of [...KNOWN_FIELDS, ...extraFields]) {
        // The type does not guarantee anything about properties it does not declare, so check.
        const value: unknown = (fields as unknown as Record<string, unknown>)[name];
        if (value === undefined || value === '')
            continue;
        if (!FIELD_NAME.test(name))
            throw Error(`Invalid mail-link field name: ${JSON.stringify(name)}`);
        if (typeof value !== 'string')
            throw Error(`Mail-link field ${name} is not a string`);
        url += "&" + name + "=" + myEncodeURIComponent(value);
    }

    return fixupURL(url);
}
