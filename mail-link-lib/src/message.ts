// Turn a raw RFC 822 message into mail-link fields. Kept DOM-free so it can be
// unit-tested directly.

import {parseHeaders, firstHeader, decodeEncodedWords} from './headers.js';
import type {MailLinkFields} from './maillink.js';

/** Build mail-link fields from the headers of a raw email.
 *
 * @param raw An email in RFC 5322 format: the full message or only its header section, with
 *   CRLF or LF line endings. Only the headers are read.
 * @returns The fields `messageId` (without the surrounding `<>`), `subject`, `date`, `from`, and
 *   `to`, each taken from the first occurrence of the corresponding header and omitted if the
 *   header is missing or empty. RFC 2047 encoded-words (e.g., `=?UTF-8?Q?...?=`) are decoded.
 *   Otherwise values are passed through as written: addresses are not reformatted, and `date` is
 *   the verbatim `Date` header (as required by the mail-link format). `whohasit` is never set.
 *   Returns `null` if the email has no `Message-ID` header (then no mail-link can be built). */
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
    if (date)
        // The raw Date header is already an RFC 5322 timestamp, which is exactly
        // what the mail-link format requires, so pass it through verbatim.
        fields.date = date;

    const from = firstHeader(headers, 'from');
    if (from)
        fields.from = decodeEncodedWords(from);

    const to = firstHeader(headers, 'to');
    if (to)
        fields.to = decodeEncodedWords(to);

    return fields;
}
