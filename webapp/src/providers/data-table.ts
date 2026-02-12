import "./data-table.css";
import {Provider} from "../provider.ts";
import {htmlTag, insertHtmlLike, strippedSubject, text} from "../utils.ts";
import type {HTMLLike, ParsedFragment} from "../types.ts";
import {SlCopyButton} from "@shoelace-style/shoelace";

interface RowRenderer {
    renderKey: (key: string, value: string) => HTMLLike;
    renderValue: (key: string, value: string) => HTMLLike;
}

class DefaultRenderer implements RowRenderer {
    renderKey(key: string, _value: string): HTMLLike {
        return text(key);
    }

    renderValue(key: string, value: string): HTMLLike {
        return DefaultRenderer.textWithCopyButton(key, text(value));
    }

    static textWithCopyButton(key: string, html: HTMLLike): HTMLLike {
        let id = `data-table-${key}-value-span`;
        let textSpan = htmlTag("span", html, ['id', id]);
        let copyButton = htmlTag("sl-copy-button", ['from', id]) as SlCopyButton;
        return htmlTag("span", textSpan, text(' '), copyButton);
    }
}

class NamedRenderer extends DefaultRenderer {
    private name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    renderKey(_key: string, _value: string): HTMLLike {
        return text(this.name);
    }
}

class RecipientRenderer extends DefaultRenderer {
    renderKey(_key: string, value: string): HTMLLike {
        if (value.includes(', '))
            return text("Recipients");
        else
            return text("Recipient");
    }
}

class SubjectRenderer extends DefaultRenderer {
    renderKey(_key: string, _value: string): HTMLLike {
        return text("Subject");
    }
    renderValue(key: string, value: string): HTMLLike {
        let [subject, prefix] = strippedSubject(value);
        return htmlTag("span",
            htmlTag("span", text(prefix), ['class', 'data-table-grayed']),
            SubjectRenderer.textWithCopyButton(key, text(subject)));
    }
}

const renderers: Record<string, RowRenderer> = {
    "subject": new SubjectRenderer(),
    "date": new NamedRenderer("Date"),
    "from": new NamedRenderer("Sender"),
    "to": new RecipientRenderer(),
    "whohasit": new NamedRenderer("Who has the mail?"),
}

const defaultRenderer = new DefaultRenderer();

/*class MessageIdRenderer extends DefaultRenderer {
    renderKey(key: string, _value: string): HTMLLike {
        return text("Message-ID");
    }
    renderValue(key: string, value: string): HTMLLike {
        let link = "mid:" + value;
        let href = htmlTag("a", link, ['href', link]);
        return MessageIdRenderer.textWithCopyButton(key, href);
    }
}*/

const messageIdRenderer = new NamedRenderer("Message-ID");

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
            const keyCell = htmlTag("td", renderer.renderKey(key, value));
            const valueCell = htmlTag("td", renderer.renderValue(key, value));
            tbody.appendChild(htmlTag("tr", keyCell, valueCell));
        }

        const keyCell = htmlTag("td", messageIdRenderer.renderKey("--message-id", parsed.mid));
        const valueCell = htmlTag("td", messageIdRenderer.renderValue("--message-id", parsed.mid));
        tbody.appendChild(htmlTag("tr", keyCell, valueCell));

        insertHtmlLike(this.contentDiv(),
            htmlTag("table", ["class", "data-table"], tbody));
    }
}
