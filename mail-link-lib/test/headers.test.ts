import {describe, it, expect} from 'vitest';
import {parseHeaders, firstHeader, decodeEncodedWords} from '../src/headers.js';

describe('parseHeaders', () => {
    it('parses headers and stops at the blank line before the body', () => {
        const msg = 'Subject: Hi\r\nFrom: a@b\r\n\r\nBody: not a header\r\n';
        const h = parseHeaders(msg);
        expect(firstHeader(h, 'subject')).toBe('Hi');
        expect(firstHeader(h, 'from')).toBe('a@b');
        expect(firstHeader(h, 'body')).toBeUndefined();
    });

    it('unfolds folded header values', () => {
        const msg = 'Subject: line one\r\n  line two\r\n\r\n';
        expect(firstHeader(parseHeaders(msg), 'subject')).toBe('line one  line two');
    });

    it('accepts LF-only line endings', () => {
        const msg = 'Message-ID: <1@x>\nSubject: Hi\n\nbody';
        expect(firstHeader(parseHeaders(msg), 'message-id')).toBe('<1@x>');
    });

    it('is case-insensitive and keeps the first occurrence', () => {
        const msg = 'Message-ID: <1@x>\r\nMESSAGE-ID: <2@x>\r\n\r\n';
        expect(firstHeader(parseHeaders(msg), 'message-id')).toBe('<1@x>');
    });
});

describe('decodeEncodedWords', () => {
    it('decodes Q-encoded UTF-8', () => {
        expect(decodeEncodedWords('=?utf-8?Q?Gr=C3=BC=C3=9Fe?=')).toBe('Grüße');
    });

    it('decodes B-encoded UTF-8', () => {
        expect(decodeEncodedWords('=?UTF-8?B?w6Q=?=')).toBe('ä');
    });

    it('treats Q-encoded underscore as space', () => {
        expect(decodeEncodedWords('=?utf-8?Q?a_b?=')).toBe('a b');
    });

    it('joins adjacent encoded-words, dropping separating whitespace', () => {
        expect(decodeEncodedWords('=?utf-8?Q?a?=  =?utf-8?Q?b?=')).toBe('ab');
    });

    it('leaves plain text and undecodable words untouched', () => {
        expect(decodeEncodedWords('Hello world')).toBe('Hello world');
    });

    it('reassembles a multibyte character split across B-encoded words', () => {
        // "Preis 5€ ok" with the 3 bytes of € (E2 82 AC) split 2+1 across the words.
        const first = btoa('Preis 5\xE2\x82');
        const second = btoa('\xAC ok');
        expect(decodeEncodedWords(`=?UTF-8?B?${first}?= =?UTF-8?B?${second}?=`)).toBe('Preis 5€ ok');
    });

    it('reassembles a multibyte character split across Q-encoded words', () => {
        expect(decodeEncodedWords('=?utf-8?Q?Gr=C3?= =?UTF-8?Q?=BC=C3=9Fe?=')).toBe('Grüße');
    });

    it('ignores an RFC 2231 language suffix on the charset', () => {
        expect(decodeEncodedWords('=?UTF-8*de?Q?Gr=C3=BC=C3=9Fe?=')).toBe('Grüße');
    });

    it('decodes adjacent words with different charsets separately', () => {
        expect(decodeEncodedWords('=?ISO-8859-1?Q?M=FCller?= =?UTF-8?Q?_=C3=A4?=')).toBe('Müller ä');
    });

    it('keeps text around encoded-words', () => {
        expect(decodeEncodedWords('Re: =?UTF-8?Q?Gr=C3=BC=C3=9Fe?= (2)')).toBe('Re: Grüße (2)');
    });

    it('leaves words with an unknown charset or invalid base64 verbatim', () => {
        expect(decodeEncodedWords('=?x-unknown?Q?abc?=')).toBe('=?x-unknown?Q?abc?=');
        expect(decodeEncodedWords('=?UTF-8?Q?a?= =?UTF-8?B?***?= =?UTF-8?Q?b?=')).toBe('a=?UTF-8?B?***?=b');
    });
});
