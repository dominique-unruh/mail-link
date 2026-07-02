import {describe, it, expect} from 'vitest';
import {inject} from '../inject.mjs';

describe('inject', () => {
    it('replaces double-quoted placeholders', () => {
        const out = inject('var a="@@@BASE_URL@@@",b="@@@WHOHASIT@@@";', 'https://x/', 'Alice');
        expect(out).toBe('var a="https://x/",b="Alice";');
    });

    it('replaces single-quoted placeholders', () => {
        expect(inject("x='@@@BASE_URL@@@'", 'https://x/', '')).toBe('x="https://x/"');
    });

    it('quotes values with quotes and backslashes into a valid JS literal', () => {
        const out = inject('x="@@@WHOHASIT@@@"', 'b', 'a"b\\c');
        expect(out).toBe('x="a\\"b\\\\c"');
        // The substituted literal must evaluate back to the original value.
        expect(eval(out.slice(2))).toBe('a"b\\c');
    });

    it('does not treat "$" in a value as a replacement pattern', () => {
        expect(inject('x="@@@WHOHASIT@@@"', 'b', '$1 $&')).toBe('x="$1 $&"');
    });
});
