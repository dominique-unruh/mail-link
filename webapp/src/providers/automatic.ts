import html from './automatic.html?raw';
import {Provider} from "../provider.ts";
import type {ParsedFragment} from "../main.ts";

export class AutomaticProvider extends Provider {
    private linkElement!: HTMLAnchorElement;

    constructor() {
        super({'title': 'Automatically', 'html': html});
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
        this.linkElement.textContent = data.mid;
        this.linkElement.href = data.mid;
    }
}
