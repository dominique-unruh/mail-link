import "./data-table.css";
import {Provider} from "../provider.ts";
import {htmlTag, insertHtmlLike, text} from "../utils.ts";
import type {HTMLLike, ParsedFragment} from "../types.ts";

interface RowRenderer {
    renderKey: (key: string) => HTMLLike;
    renderValue: (value: string) => HTMLLike;
}

class DefaultRenderer implements RowRenderer {
    renderKey(key: string): HTMLLike {
        return text(key);
    }

    renderValue(value: string): HTMLLike {
        return text(value);
    }
}

class NamedRenderer extends DefaultRenderer {
    private name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    renderKey(): HTMLLike {
        return this.name;
    }
}

const renderers: Record<string, RowRenderer> = {
    "subject": new NamedRenderer("Subject"),
    "date": new NamedRenderer("Date"),
    "from": new NamedRenderer("Sender"),
    "to": new NamedRenderer("Recipient(s)"),
    "whohasit": new NamedRenderer("Who has the mail?"),
}

const defaultRenderer = new DefaultRenderer();

export class DataTableProvider extends Provider {
    constructor() {
        super({'id': 'data-table', 'title': 'Data Table', 'insertHere': 'data-table'});
    }

    protected init(): void | Promise<void> {}

    dataChanged(parsed: ParsedFragment | null): void | Promise<void> {
        if (!parsed) {
            this.contentDiv().innerHTML = '<p style="color: #999;">[Link is incomplete!]</p>';
            return;
        }

        const tbody = htmlTag("tbody");

        for (const [key, value] of Object.entries(parsed.params)) {
            const renderer = renderers[key] ?? defaultRenderer;
            const keyCell = htmlTag("td", renderer.renderKey(key));
            const valueCell = htmlTag("td", renderer.renderValue(value));
            tbody.appendChild(htmlTag("tr", keyCell, valueCell));
        }

        insertHtmlLike(this.contentDiv(),
            htmlTag("table", ["class", "data-table"], tbody));
    }
}
