import automaticHtml from './automatic.html?raw';
import {Provider} from "../provider.ts";
import type {ParsedFragment} from "../main.ts";

export class AutomaticProvider extends Provider {
    private linkElement!: HTMLAnchorElement;

    constructor() {
        super('Automatically', automaticHtml);
    }

    protected init(_content: HTMLDivElement): void | Promise<void> {
        this.linkElement = document.getElementById("automatic-mid-link") as HTMLAnchorElement;
    }

    dataChanged(data: ParsedFragment | null): void | Promise<void> {
        if (data == null) {
            this.linkElement.href = "";
            this.linkElement.textContent = "[No message ID]";
            return;
        }
        this.linkElement.textContent = data.mid;
        this.linkElement.href = data.mid;
    }
}
