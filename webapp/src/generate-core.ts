import PostalMime from 'postal-mime';
import {buildMailLink, type MailLinkFields} from '../../shared/maillink.ts';

/** Formats a parsed address as `Name <address>` (or just the address if there is no display name). */
export function formatAddress(addr: {name?: string; address?: string}): string {
    if (addr.name && addr.name !== '')
        return `${addr.name} <${addr.address ?? ''}>`;
    return addr.address ?? '';
}

/** Parses a raw email (RFC 822 text) and builds a mail-link with `baseUrl` as its base.
 * `whohasit`, if non-empty, names who holds the email (populates the `whohasit` field).
 * Returns `null` if the email has no Message-ID (in which case no link can be generated). */
export async function emailToMailLink(raw: string, baseUrl: string, whohasit?: string): Promise<string | null> {
    const email = await PostalMime.parse(raw);

    const messageId = email.messageId?.trim();
    if (!messageId)
        return null;

    const fields: MailLinkFields = {
        // The Message-ID header comes with surrounding <>; the mail-link format uses the bare id.
        messageId: messageId.replace(/^<(.*)>$/, '$1'),
    };

    if (email.subject)
        fields.subject = email.subject;
    if (email.date)
        fields.date = email.date;
    if (email.from)
        fields.from = formatAddress(email.from);
    if (email.to && email.to.length > 0)
        fields.to = email.to.map(formatAddress).join(', ');
    if (whohasit && whohasit.trim() !== '')
        fields.whohasit = whohasit.trim();

    return buildMailLink(baseUrl, fields);
}
