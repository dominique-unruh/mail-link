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

/** The fields that can be encoded into a mail-link, besides the base URL. */
export interface MailLinkFields {
    /** Message-ID without surrounding `<>`. */
    messageId: string;
    subject?: string;
    /** Date as an RFC 5322 (Section 3.3) timestamp; passed through verbatim. */
    date?: string;
    from?: string;
    to?: string;
    whohasit?: string;
}

/** Construct a mail-link URL from `baseUrl` and the given `fields`.
 * Throws if no message id is given. */
export function buildMailLink(baseUrl: string, fields: MailLinkFields): string {
    if (!fields.messageId || fields.messageId === "")
        throw Error("Could not determine message id");

    let url = baseUrl;

    // Start with message ID
    url += "#" + myEncodeURIComponent(fields.messageId);

    // Add optional fields (order must match the spec / the resolve page expectations)
    if (fields.subject)
        url += "&subject=" + myEncodeURIComponent(fields.subject);
    if (fields.date)
        url += "&date=" + myEncodeURIComponent(fields.date);
    if (fields.from)
        url += "&from=" + myEncodeURIComponent(fields.from);
    if (fields.to)
        url += "&to=" + myEncodeURIComponent(fields.to);
    if (fields.whohasit)
        url += "&whohasit=" + myEncodeURIComponent(fields.whohasit);

    return fixupURL(url);
}
