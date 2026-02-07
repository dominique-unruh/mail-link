import type { ParsedFragment } from "../main.ts";
import {Provider} from "../provider.ts";
import html from "./thunderbird.html?raw";
import {shellEscape} from "../utils.ts";

export class ThunderbirdProvider extends Provider {
    private textarea!: HTMLElement;

    constructor() {
        super("Thunderbird", html);
    }

    protected init(): void | Promise<void> {
        this.textarea = document.getElementById('thunderbird-command') as HTMLElement;
    }

    dataChanged(parsed: ParsedFragment | null): void | Promise<void> {
        if (parsed == null) {
            this.textarea.textContent = 'thunderbird mid:your-message-id';
            return;
        }
        // Note: parsed.mid is not percent-escaped here because thunderbird (incorrectly?) does not decode the mid-URI.
        this.textarea.textContent = `thunderbird ${shellEscape("mid:" + parsed.mid)}`;
    }
}
