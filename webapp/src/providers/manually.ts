import html from './manually.html?raw';
import {Provider} from "../provider.ts";
import type {ParsedFragment} from "../main.ts";

export class ManualProvider extends Provider {
    constructor() {
        super('Manually', html);
    }

    protected init(_content: HTMLDivElement): void | Promise<void> {}

    // TODO: Adaptively provide instructions
    // TODO: Strip subject of AW, Re, etc.
    dataChanged(_data: ParsedFragment | null): void | Promise<void> {}
}
