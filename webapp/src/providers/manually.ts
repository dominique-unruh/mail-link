import {Provider} from "../provider.ts";
import {htmlEm, htmlLi, htmlP, htmlTag} from "../utils.ts";
import type {ParsedFragment} from "../types.ts";

export class ManualProvider extends Provider {
    static readonly uninitializedText =
        "To find an email manually, open an email link, and use the data shown and the search function of your mail program to find the email.\n" +
        "More concrete instructions will also be shown here once you do so."

    constructor() {
        super({'id': 'manual', 'title': 'Manually', 'html': ManualProvider.uninitializedText});
    }

    protected init(): void | Promise<void> {}

    dataChanged(parsed: ParsedFragment | null): void | Promise<void> {
        const div = this.contentDiv();
        if (!parsed) {
            div.textContent = ManualProvider.uninitializedText;
            return;
        }

        function quote(str: string): HTMLElement {
            const id = `str-${Math.random().toString(36).substring(2, 11)}`;
            const em = htmlEm(str, ["id", id]);
            const copy = htmlTag("sl-copy-button", ['from', id]);
            return htmlTag("span", em, " ", copy);
        }

        div.replaceChildren();

        div.appendChild(htmlP("To find this email manually, use your favorite mail client, and search for it manually given the information in the link:"));

        const items: HTMLLIElement[] = [];

        if (parsed.params["subject"])
            items.push(htmlLi("Search by subject: ", quote(ManualProvider.strippedSubject(parsed.params["subject"]))));
        if (parsed.params["date"])
            items.push(htmlLi("Search by sending date: ", quote(parsed.params["date"])));
        if (parsed.params["from"])
            items.push(htmlLi("Search by sender: ", quote(parsed.params["from"])));
        if (parsed.params["to"])
            items.push(htmlLi("Search by recipient(s): ", quote(parsed.params["to"])));
        items.push(htmlLi("Search by message-id: ", quote(parsed.mid),
            " (your mail software may not support this or the feature may be hidden)"));

        div.appendChild(htmlTag("ul", ...items));

        div.appendChild(htmlP("If you don't find it (maybe you don't actually have that email), you might try to contact the creator of this link (",
            parsed.params["whohasit"] ? quote(parsed.params["whohasit"]) : "if you know who that is",
            ")."));
    }

    static strippedSubject(subject: string): string {
        var changed = true;
        function strip(prefix: string) {
            subject = subject.trimStart();
            if (subject.startsWith(prefix)) {
                subject = subject.substring(prefix.length);
                changed = true;
            }
        }
        while (changed) {
            changed = false;
            strip("Re:");
            strip("AW:");
            strip("Vs:");
        }
        return subject;
    }
}
