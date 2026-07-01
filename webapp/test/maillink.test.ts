import {describe, expect, it} from 'vitest';
// The shared module lives outside the webapp; the webapp's Vitest is its runner.
import {buildMailLink, fixupURL, myEncodeURIComponent} from '../../shared/maillink.ts';

describe('myEncodeURIComponent', () => {
    it("encodes ' as %27 (unlike plain encodeURIComponent)", () => {
        expect(myEncodeURIComponent("O'Brien")).toBe('O%27Brien');
    });

    it('encodes the fragment-breaking characters space, & and =', () => {
        expect(myEncodeURIComponent('a b')).toBe('a%20b');
        expect(myEncodeURIComponent('a&b')).toBe('a%26b');
        expect(myEncodeURIComponent('a=b')).toBe('a%3Db');
    });
});

describe('fixupURL', () => {
    it('escapes a trailing punctuation character', () => {
        expect(fixupURL('https://x/#id.')).toBe('https://x/#id%2E');
        expect(fixupURL('https://x/#id)')).toBe('https://x/#id%29');
    });

    it('leaves a trailing alphanumeric or URL-structural character untouched', () => {
        expect(fixupURL('https://x/#id')).toBe('https://x/#id');
        expect(fixupURL('https://x/path/')).toBe('https://x/path/');
        expect(fixupURL('https://x/#a=b')).toBe('https://x/#a=b');
    });
});

describe('buildMailLink', () => {
    const base = 'https://example.org/mail-link/';

    it('puts the message id (without <>) first, then fields in the spec order', () => {
        const url = buildMailLink(base, {
            messageId: 'abc@host',
            subject: 'Café time',
            date: '2026-02-06T17:45:30.000Z',
            from: 'Sender Name <s@host>',
            to: 'a@host, b@host',
            whohasit: 'Someone',
        });
        expect(url).toBe(
            base +
            '#abc%40host' +
            '&subject=Caf%C3%A9%20time' +
            '&date=2026-02-06T17%3A45%3A30.000Z' +
            '&from=Sender%20Name%20%3Cs%40host%3E' +
            '&to=a%40host%2C%20b%40host' +
            '&whohasit=Someone',
        );
    });

    it('omits fields that are absent', () => {
        expect(buildMailLink(base, {messageId: 'abc@host', subject: 'Hi'})).toBe(
            base + '#abc%40host&subject=Hi',
        );
        expect(buildMailLink(base, {messageId: 'abc@host'})).toBe(base + '#abc%40host');
    });

    it('throws when the message id is missing', () => {
        expect(() => buildMailLink(base, {messageId: ''})).toThrow(/message id/);
    });
});
