import html from './automatic.html?raw';
import {Provider} from "../provider.ts";
import type {ParsedFragment} from "../types.ts";

export class AutomaticProvider extends Provider {
    private linkElement!: HTMLAnchorElement;

    constructor() {
        super({'id': 'automatic', 'title': 'Automatically', 'html': html});
    }

    protected init(): void | Promise<void> {
        this.linkElement = document.getElementById("automatic-mid-link") as HTMLAnchorElement;
    }

    dataChanged(data: ParsedFragment | null): void | Promise<void> {
        if (!data) {
            this.linkElement.href = "";
            this.linkElement.textContent = "[No message ID]";
            return;
        }
        // TODO: Theoretically, the mid should be percent-escaped here. But at least Thunderbird expects a non-escaped mid here. Should we make this configurable?
        const uri = "mid:" + data.mid;
        this.linkElement.textContent = uri;
        this.linkElement.href = uri;
    }
}
