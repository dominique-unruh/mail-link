import type {Provider} from "../provider.ts";

import {AutomaticProvider} from "./automatic.ts";
import {ManualProvider} from "./manually.ts";
import {ThunderbirdProvider} from "./thunderbird.ts";
import {DataTableProvider} from "./data-table.ts";
import {GmailProvider} from "./gmail.ts";

export let providers: ReadonlyArray<Provider> = [
    new AutomaticProvider(),
    new ManualProvider(),
    new ThunderbirdProvider(),
    new DataTableProvider(),
    new GmailProvider(),
];

export function getProvider(id: string): Provider | null {
    return providers.find(provider => provider.id() === id) || null;
}