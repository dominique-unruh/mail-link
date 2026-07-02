// Turn a raw RFC 822 message into mail-link fields. Kept DOM-free so it can be
// unit-tested directly.

import {parseHeaders, firstHeader, decodeEncodedWords} from './headers.ts';
import type {MailLinkFields} from '../../shared/maillink.ts';

/** Build mail-link fields from a raw message, or null if it has no Message-ID. */
export function messageToFields(raw: string): MailLinkFields | null {
    const headers = parseHeaders(raw);

    // The Message-ID header carries surrounding <>; the mail-link uses the bare id.
    const messageId = firstHeader(headers, 'message-id')?.replace(/^<(.*)>$/, '$1').trim();
    if (!messageId)
        return null;

    const fields: MailLinkFields = {messageId};

    const subject = firstHeader(headers, 'subject');
    if (subject)
        fields.subject = decodeEncodedWords(subject);

    const date = firstHeader(headers, 'date');
    if (date) {
        // Normalise to ISO 8601 when parseable (matching the webapp), else verbatim.
        const parsed = new Date(date);
        fields.date = isNaN(parsed.getTime()) ? date : parsed.toISOString();
    }

    const from = firstHeader(headers, 'from');
    if (from)
        fields.from = decodeEncodedWords(from);

    const to = firstHeader(headers, 'to');
    if (to)
        fields.to = decodeEncodedWords(to);

    return fields;
}
