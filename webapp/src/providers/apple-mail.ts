import html from './apple-mail.html?raw';
import {Provider} from "../provider.ts";
import type {HTMLLike, ParsedFragment} from "../types.ts";

export class AppleMailProvider extends Provider {
    private linkElement!: HTMLAnchorElement;
    private autoActionCheckbox!: HTMLInputElement;
    private uri: string | undefined;

    constructor() {
        super({'id': 'apple-mail', 'title': 'Apple Mail (Desktop & Mobile)', 'html': html});
    }

    protected init(): void | Promise<void> {
        this.linkElement = document.getElementById("apple-mail-link") as HTMLAnchorElement;
        this.autoActionCheckbox = document.getElementById("apple-mail-autoaction") as HTMLInputElement;

        this.autoActionCheckbox.addEventListener("change", () => {
            if (this.autoActionCheckbox.checked) this.takeAutoAction();
            else this.releaseAutoAction();
        })
    }

    dataChanged(data: ParsedFragment | null): void | Promise<void> {
        if (!data) {
            this.uri = undefined;
            this.linkElement.removeAttribute("href");
            this.linkElement.textContent = "[No message ID]";
            return;
        }
        this.uri = appleMailURI(data.mid);
        this.linkElement.textContent = this.uri;
        this.linkElement.href = this.uri;
    }

    lostAutoAction() {
        this.autoActionCheckbox.checked = false;
    }

    gotAutoAction() {
        this.autoActionCheckbox.checked = true;
    }

    automaticActionText(): HTMLLike {
        return 'Directly open the email in Apple Mail (see "Apple Mail (Desktop)" below).';
    }

    doAutoAction(): void | Promise<void> {
        if (this.uri != null)
            window.location.href = this.uri;
        else
            console.error("doAutoAction called without parsed fragment", this);
    }
}

/**
 * Builds an Apple Mail `message:` URL for a message id.
 *
 * Apple Mail expects the *full* RFC 5322 message id including the surrounding
 * angle brackets, percent-escaped, e.g.
 *   message://%3C8FC05601-5177-4FD3-BFAD-9513FE467D0C%40cs.rwth-aachen.de%3E
 * Our `mid` is stored without the angle brackets, so we add them back and
 * escape the whole thing in one go (this also escapes the `@` as `%40`, as in
 * the example above).
 *
 * @param mid message id without surrounding `<>`
 */
export function appleMailURI(mid: string): string {
    return "message://" + encodeURIComponent("<" + mid + ">");
}
