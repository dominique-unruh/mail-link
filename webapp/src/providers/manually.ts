import {Provider} from "../provider.ts";
import {htmlEm, htmlLi, htmlP, htmlTag, strippedSubject, text} from "../utils.ts";
import type {MailLinkFields} from "mail-link";

export class ManualProvider extends Provider {
    static readonly uninitializedText =
        "To find an email manually, open an email link, and use the data shown and the search function of your mail program to find the email.\n" +
        "More concrete instructions will also be shown here once you do so."

    constructor() {
        super({'id': 'manual', 'title': 'Manually', 'html': ManualProvider.uninitializedText});
    }

    protected init(): void | Promise<void> {}

    dataChanged(parsed: MailLinkFields | null): void | Promise<void> {
        const div = this.contentDiv();
        if (!parsed) {
            div.textContent = ManualProvider.uninitializedText;
            return;
        }

        function quote(str: string): HTMLElement {
            const id = `str-${Math.random().toString(36).substring(2, 11)}`;
            const em = htmlEm(text(str), ["id", id]);
            const copy = htmlTag("sl-copy-button", ['from', id]);
            return htmlTag("span", em, text(" "), copy);
        }

        div.replaceChildren();

        div.appendChild(htmlP(text("To find this email manually, use your favorite mail client, and search for it manually given the information in the link:")));

        const items: HTMLLIElement[] = [];

        if (parsed.subject)
            items.push(htmlLi("Search by subject: ", quote(strippedSubject(parsed.subject)[0])));
        if (parsed.date)
            items.push(htmlLi("Search by sending date: ", quote(parsed.date)));
        if (parsed.from)
            items.push(htmlLi("Search by sender: ", quote(parsed.from)));
        if (parsed.to)
            items.push(htmlLi("Search by recipient(s): ", quote(parsed.to)));
        items.push(htmlLi("Search by message-id: ", quote(parsed.messageId),
            " (your mail software may not support this or the feature may be hidden)"));

        div.appendChild(htmlTag("ul", ...items));

        div.appendChild(htmlP(text("If you don't find it (maybe you don't actually have that email), you might try to contact the creator of this link ("),
            parsed.whohasit ? quote(parsed.whohasit) : text("if you know who that is"),
            ")."));
    }
}
