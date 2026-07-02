import {describe, it, expect} from 'vitest';
import {parseHeaders, firstHeader, decodeEncodedWords} from '../src/headers.ts';

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
});
