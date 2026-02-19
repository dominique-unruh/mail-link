import html from './gmail.html?raw';
import {Provider} from "../provider.ts";
import type {HTMLLike, ParsedFragment} from "../types.ts";
import {saveOptions} from "../options.ts";

interface GmailProviderOptions {
    accountNumber?: number;
}

export class GmailProvider extends Provider {
    private linkElement!: HTMLAnchorElement;
    private autoActionCheckbox!: HTMLInputElement;
    private accountNumber!: HTMLInputElement;
    private data: ParsedFragment | null = null;
    private link: string | undefined;

    constructor() {
        super({'id': 'gmail', 'title': 'GMail (Web)', 'html': html});
    }

    protected init(): void | Promise<void> {
        this.linkElement = document.getElementById("gmail-link") as HTMLAnchorElement;
        this.autoActionCheckbox = document.getElementById("gmail-autoaction") as HTMLInputElement;
        this.accountNumber = document.getElementById("gmail-account-number") as HTMLInputElement;

        this.autoActionCheckbox.addEventListener("change", () => {
            if (this.autoActionCheckbox.checked) this.takeAutoAction();
            else this.releaseAutoAction();
        })

        this.accountNumber.addEventListener("change", () => {
            this.options().accountNumber = parseInt(this.accountNumber.value);
            saveOptions();
            this.updateLink();
        })

        this.accountNumber.value = (this.options().accountNumber || 0).toString()
    }

    dataChanged(data: ParsedFragment | null): void | Promise<void> {
        this.data = data;
        this.updateLink()
    }

    updateLink() {
        // TODO
        if (!this.data) {
            this.linkElement.href = "";
            this.linkElement.textContent = "[No message ID]";
            return;
        }
        this.link = `https://mail.google.com/mail/u/${this.accountNumber.value}#search/in:anywhere+rfc822msgid:\"${encodeURI(this.data.mid)}\"`
        this.linkElement.textContent = this.link.substring(0, 40) + "…";
        this.linkElement.href = this.link;
    }

    lostAutoAction() {
        this.autoActionCheckbox.checked = false;
    }

    gotAutoAction() {
        this.autoActionCheckbox.checked = true;
    }

    automaticActionText(): HTMLLike {
        return 'Directly search the email in GMail.';
    }

    doAutoAction(): void | Promise<void> {
        if (this.link != null)
            window.open(this.link, '_blank');
        else
            console.error("doAutoAction called without parsed fragment", this);
    }

    override options(): GmailProviderOptions {
        return super.options();
    }
}
