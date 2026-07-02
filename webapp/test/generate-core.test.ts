import {describe, expect, it} from 'vitest';
import {emailToMailLink, formatAddress} from '../src/generate-core.ts';

const base = 'https://example.org/mail-link/';

/** Builds a raw RFC 822 email from header lines plus an (ignored) body. */
function rawEmail(headers: string): string {
    return headers.trimStart() + '\n\nThis body text must be ignored.\n';
}

describe('formatAddress', () => {
    it('formats "Name <address>" when a display name is present', () => {
        expect(formatAddress({name: 'Sender Name', address: 's@host'})).toBe('Sender Name <s@host>');
    });

    it('returns just the address when there is no display name', () => {
        expect(formatAddress({address: 's@host'})).toBe('s@host');
        expect(formatAddress({name: '', address: 's@host'})).toBe('s@host');
    });
});

describe('emailToMailLink', () => {
    it('builds a link from headers and ignores the body', async () => {
        const url = await emailToMailLink(rawEmail(`
Message-ID: <abc@host>
Subject: Hello world
Date: Fri, 06 Feb 2026 17:45:30 +0000
From: Sender Name <s@host>
To: Recipient <r@host>`), base);

        expect(url).toBe(
            base +
            '#abc%40host' +
            '&subject=Hello%20world' +
            '&date=Fri%2C%2006%20Feb%202026%2017%3A45%3A30%20%2B0000' +
            '&from=Sender%20Name%20%3Cs%40host%3E' +
            '&to=Recipient%20%3Cr%40host%3E',
        );
        expect(url).not.toContain('body');
    });

    it('decodes an RFC 2047 encoded-word subject', async () => {
        const url = await emailToMailLink(rawEmail(`
Message-ID: <abc@host>
Subject: =?UTF-8?Q?Caf=C3=A9?=`), base);

        // "Café" as percent-encoded UTF-8.
        expect(url).toContain('&subject=Caf%C3%A9');
    });

    it('decodes a non-ASCII From display name', async () => {
        const url = await emailToMailLink(rawEmail(`
Message-ID: <abc@host>
From: =?UTF-8?B?w4TDtsO8?= <u@host>`), base);

        // "Äöü" as percent-encoded UTF-8.
        expect(url).toContain('&from=%C3%84%C3%B6%C3%BC%20%3Cu%40host%3E');
    });

    it('joins multiple recipients with ", "', async () => {
        const url = await emailToMailLink(rawEmail(`
Message-ID: <abc@host>
To: a@host, b@host`), base);

        expect(url).toContain('&to=a%40host%2C%20b%40host');
    });

    it('adds a whohasit field when a name is given', async () => {
        const url = await emailToMailLink(rawEmail(`
Message-ID: <abc@host>`), base, 'Jane Doe');

        expect(url).toContain('&whohasit=Jane%20Doe');
    });

    it('omits whohasit when the name is empty or whitespace', async () => {
        const url = await emailToMailLink(rawEmail(`
Message-ID: <abc@host>`), base, '   ');

        expect(url).not.toContain('whohasit');
    });

    it('returns null when there is no Message-ID', async () => {
        const url = await emailToMailLink(rawEmail(`
Subject: No id here
From: s@host`), base);

        expect(url).toBeNull();
    });
});
