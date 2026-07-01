import {describe, expect, it} from 'vitest';
// construct-url.ts has no top-level browser.* side effects, so it is importable here.
import {constructUrl, formatRFC5322} from '../src/construct-url.ts';
import {defaultOptions, Options} from '../src/common.ts';

const base = 'https://example.org/mail-link/';

// A plain object standing in for a Thunderbird MessageHeader (only the fields constructUrl reads).
function fakeMessage(overrides: Record<string, unknown> = {}): any {
    return {
        headerMessageId: 'abc@host',
        subject: 'Hi',
        date: new Date('2026-02-06T17:45:30Z'),
        author: 'Sender <s@host>',
        recipients: ['a@host', 'b@host'],
        ...overrides,
    };
}

function options(overrides: Partial<Options> = {}): Options {
    return {...defaultOptions, baseUrl: base, whoHasIt: '', ...overrides};
}

describe('formatRFC5322 (TZ=UTC)', () => {
    it('formats a date as an RFC 5322 timestamp', () => {
        expect(formatRFC5322(new Date('2026-02-06T17:45:30Z')))
            .toBe('Fri, 6 Feb 2026 17:45:30 +0000');
    });
});

describe('constructUrl', () => {
    it('encodes all included fields in the spec order', () => {
        expect(constructUrl(fakeMessage(), options())).toBe(
            base +
            '#abc%40host' +
            '&subject=Hi' +
            '&date=Fri%2C%206%20Feb%202026%2017%3A45%3A30%20%2B0000' +
            '&from=Sender%20%3Cs%40host%3E' +
            '&to=a%40host%2C%20b%40host',
        );
    });

    it('omits a field when its include-flag is off', () => {
        expect(constructUrl(fakeMessage(), options({includeSubject: false})))
            .not.toContain('&subject=');
        expect(constructUrl(fakeMessage(), options({includeDate: false})))
            .not.toContain('&date=');
        expect(constructUrl(fakeMessage(), options({includeFrom: false})))
            .not.toContain('&from=');
        expect(constructUrl(fakeMessage(), options({includeTo: false})))
            .not.toContain('&to=');
    });

    it('adds whohasit when configured', () => {
        expect(constructUrl(fakeMessage(), options({whoHasIt: 'Someone'})))
            .toContain('&whohasit=Someone');
    });

    it('throws when the message has no id', () => {
        expect(() => constructUrl(fakeMessage({headerMessageId: ''}), options()))
            .toThrow(/message id/);
    });
});
