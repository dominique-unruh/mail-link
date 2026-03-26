/* Creating a title for a mail-link as rich text. */

import {Options, presentationKeywordRegex, presentationKeywords} from "./common.js";
import MessageHeader = browser.messages.MessageHeader;

function toDate(d: string | number | globalThis.Date | null): globalThis.Date | null {
    if (d == null) return null;
    return d instanceof globalThis.Date ? d : new globalThis.Date(d);
}

async function nameFromAddress(address: string | null): Promise<string | null> {
    if (address == null) return null;
    const parsed = (await browser.messengerUtilities.parseMailboxString(address))[0];
    if (parsed == null) return null;
    if (parsed.name != null) return parsed.name;
    if (parsed.email != null) return parsed.email;
    return null;
}

export async function makeLinkTitle(message: MessageHeader, options: Options): Promise<string> {
    const presentations =
        options.presentation.split("\n").map(s => s.trim()).filter(s => s != "")

    const senderName = await nameFromAddress(message.author);
    const recipientName = await nameFromAddress(message.recipients[0]);

    let title = "Email"; // Fallback

    for (const presentation of presentations) {
        try {
            console.log(`Constructing title from template ${presentation}.`)
            var skip = false;
            function useOrSkip(str: string | null | undefined): string { if (str==null) { skip = true; return "INVALID"; } else return str; }
            const result = presentation.replace(presentationKeywordRegex, (_, keyword: string) => {
                if (!presentationKeywords.has(keyword))
                    throw Error(`Unknown keyword ${keyword}`);
                if (keyword == '%') return '%';
                if (keyword == ',') return '';
                if (keyword == 'from') return useOrSkip(senderName);
                if (keyword == 'to') return useOrSkip(recipientName);
                if (keyword == 'subject') return useOrSkip(message.subject);
                if (keyword == 'date') return useOrSkip(toDate(message.date)?.toLocaleDateString())
                throw Error(`Unknown keyword ${keyword}, but listed in presentationKeywords. Internal error!`);
            });
            if (!skip) {
                title = result;
                break;
            }
        } catch (e) {
            console.error("makeLinkTitle", message, e);
        }
    }

    console.log(`Link title: ${title}`);
    return title;
}
