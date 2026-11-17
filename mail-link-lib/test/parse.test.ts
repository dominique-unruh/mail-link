import {describe, expect, it} from 'vitest';
import {buildMailLink} from '../src/maillink.js';
import {parseMailLink} from '../src/parse.js';

const base = 'https://example.org/mail-link/';

describe('parseMailLink', () => {
    it('inverts buildMailLink', () => {
        const fields = {
            messageId: 'abc+1@host',
            subject: "O'Brien & Co: 100% = done.",
            date: 'Fri, 06 Feb 2026 17:45:30 +0000',
            from: '"Doe, John" <john@host>',
            to: 'a@host, b@host',
            whohasit: 'Jürgen',
        };
        expect(parseMailLink(buildMailLink(base, fields))).toEqual({
            mid: 'abc+1@host',
            params: {
                subject: "O'Brien & Co: 100% = done.",
                date: 'Fri, 06 Feb 2026 17:45:30 +0000',
                from: '"Doe, John" <john@host>',
                to: 'a@host, b@host',
                whohasit: 'Jürgen',
            },
        });
    });

    it('parses a link with only a message-id', () => {
        expect(parseMailLink(base + '#abc%40host')).toEqual({mid: 'abc@host', params: {}});
    });

    it('keeps unknown fields', () => {
        expect(parseMailLink(base + '#abc%40host&future=x')?.params).toEqual({future: 'x'});
    });

    it('returns null for a URL without fragment', () => {
        expect(parseMailLink(base)).toBeNull();
        expect(parseMailLink(base + '#')).toBeNull();
    });
});
