import {buildMailLink, messageToFields} from 'mail-link';

/** Parses a raw email (RFC 822 text) and builds a mail-link with `baseUrl` as its base.
 * `whohasit`, if non-empty, names who holds the email (populates the `whohasit` field).
 * Returns `null` if the email has no Message-ID (in which case no link can be generated). */
export function emailToMailLink(raw: string, baseUrl: string, whohasit?: string): string | null {
    const fields = messageToFields(raw);
    if (!fields)
        return null;

    if (whohasit && whohasit.trim() !== '')
        fields.whohasit = whohasit.trim();

    return buildMailLink(baseUrl, fields);
}
