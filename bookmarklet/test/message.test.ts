import {describe, it, expect} from 'vitest';
import {messageToFields} from '../src/message.ts';

const sample = [
    'Message-ID: <abc.123@example.com>',
    'Subject: =?utf-8?Q?Gr=C3=BC=C3=9Fe?=',
    'Date: Fri, 06 Feb 2026 17:45:30 +0000',
    'From: Sender Name <sender@example.com>',
    'To: a@example.com, b@example.com',
    '',
    'body text',
].join('\r\n');

describe('messageToFields', () => {
    it('extracts and normalises the fields', () => {
        const f = messageToFields(sample);
        expect(f).not.toBeNull();
        expect(f!.messageId).toBe('abc.123@example.com');
        expect(f!.subject).toBe('Grüße');
        expect(f!.date).toBe('2026-02-06T17:45:30.000Z');
        expect(f!.from).toBe('Sender Name <sender@example.com>');
        expect(f!.to).toBe('a@example.com, b@example.com');
    });

    it('returns null when there is no Message-ID', () => {
        expect(messageToFields('Subject: x\r\n\r\nbody')).toBeNull();
    });

    it('keeps an unparseable Date verbatim', () => {
        const f = messageToFields('Message-ID: <1@x>\r\nDate: not a date\r\n\r\n');
        expect(f!.date).toBe('not a date');
    });
});
