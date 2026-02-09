import type {Provider} from "../provider.ts";

import {AutomaticProvider} from "./automatic.ts";
import {ManualProvider} from "./manually.ts";
import {ThunderbirdProvider} from "./thunderbird.ts";
import {DataTableProvider} from "./data-table.ts";

export let providers: ReadonlyArray<Provider> = [
    new AutomaticProvider(),
    new ManualProvider(),
    new ThunderbirdProvider(),
    new DataTableProvider(),
];

