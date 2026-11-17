import {describe, expect, it} from 'vitest';
import {buildMailLink, type MailLinkFields} from '../src/maillink.js';
import {MailLinkParseError, parseMailLink} from '../src/parse.js';

const base = 'https://example.org/mail-link/';

describe('parseMailLink', () => {
    it('inverts buildMailLink, including unknown fields', () => {
        const fields: MailLinkFields = {
            messageId: 'abc+1@host',
            subject: "O'Brien & Co: 100% = done.",
            date: 'Fri, 06 Feb 2026 17:45:30 +0000',
            from: '"Doe, John" <john@host>',
            to: 'a@host, b@host',
            whohasit: 'Jürgen',
            'x-future': 'some value',
        };
        expect(parseMailLink(buildMailLink(base, fields))).toEqual(fields);
    });

    it('parses a link with only a message-id', () => {
        expect(parseMailLink(base + '#abc%40host')).toEqual({messageId: 'abc@host'});
    });

    it('decodes + as space everywhere, including the message-id', () => {
        expect(parseMailLink(base + '#a+b&subject=c+d')).toEqual({messageId: 'a b', subject: 'c d'});
    });

    it('treats empty values as absent', () => {
        expect(parseMailLink(base + '#abc&subject=')).toEqual({messageId: 'abc'});
    });

    it('returns an object without prototype, so field names like constructor are safe', () => {
        const fields = parseMailLink(base + '#abc&constructor=x');
        expect(Object.getPrototypeOf(fields)).toBeNull();
        expect(fields.constructor).toBe('x');
        expect(parseMailLink(base + '#abc').constructor).toBeUndefined();
    });

    describe('tolerated problems (listed in parseErrors)', () => {
        it('lowercases field names', () => {
            const fields = parseMailLink(base + '#abc&Subject=Hi');
            expect(fields.subject).toBe('Hi');
            expect(fields.parseErrors).toEqual(['Field name "Subject" is not lowercase']);
        });

        it('keeps the first of repeated fields, also across case', () => {
            const fields = parseMailLink(base + '#abc&subject=one&SUBJECT=two&subject=three');
            expect(fields.subject).toBe('one');
            expect(fields.parseErrors).toHaveLength(3); // uppercase + two repetitions
        });

        it('counts an empty field as an occurrence for repetitions', () => {
            const fields = parseMailLink(base + '#abc&subject=&subject=x');
            expect(fields.subject).toBeUndefined();
            expect(fields.parseErrors).toEqual(['Ignored repeated field "subject": "x"']);
        });

        it('drops fields with invalid names', () => {
            const fields = parseMailLink(base + '#abc&__proto__=x&messageId=y&1a=z&ok=1');
            expect(fields).toEqual({
                messageId: 'abc',
                messageid: 'y',
                ok: '1',
                parseErrors: [
                    'Ignored field with invalid name "__proto__": "x"',
                    'Field name "messageId" is not lowercase',
                    'Ignored field with invalid name "1a": "z"',
                ],
            });
        });

        it('treats a lowercased "messageId" field as an ordinary field', () => {
            // Field names are lowercased, so a field cannot override the actual message-id.
            const fields = parseMailLink(base + '#abc&messageId=y');
            expect(fields.messageId).toBe('abc');
            expect(fields['messageid']).toBe('y');
        });

        it('drops fields without "="', () => {
            const fields = parseMailLink(base + '#abc&junk&subject=Hi');
            expect(fields.subject).toBe('Hi');
            expect(fields.parseErrors).toEqual(['Ignored field without "=": "junk"']);
        });

        it('keeps "=" inside a value', () => {
            expect(parseMailLink(base + '#abc&subject=a=b').subject).toBe('a=b');
        });

        it('drops fields with malformed percent-encoding', () => {
            const fields = parseMailLink(base + '#abc&subject=100%&from=me');
            expect(fields.subject).toBeUndefined();
            expect(fields.from).toBe('me');
            expect(fields.parseErrors).toEqual(['Ignored field with malformed percent-encoding: "subject=100%"']);
        });
    });

    describe('uninterpretable links (MailLinkParseError)', () => {
        it.each([
            ['not a URL', 'abc@host'],
            ['no fragment', base],
            ['empty fragment', base + '#'],
            ['empty message-id', base + '#&subject=Hi'],
            ['malformed message-id', base + '#abc%'],
        ])('%s', (_description, url) => {
            expect(() => parseMailLink(url)).toThrow(MailLinkParseError);
        });
    });
});
