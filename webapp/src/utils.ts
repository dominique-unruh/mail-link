import type {HTMLLike} from "./types.ts";

export function shellEscape(str: string): string {
    if (str === '') return "''";

    // If string contains no special characters, return as-is
    if (/^[a-zA-Z0-9._\/:@+-]+$/.test(str)) {
        return str;
    }

    // Otherwise, wrap in single quotes and escape any single quotes
    return "'" + str.replace(/'/g, "'\\''") + "'";
}

export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/** Checks that there are no IDs in `container` that already occur in the document. */
export function validateNoDuplicateIds(container: HTMLElement): boolean {
    const ids = new Set<string>();
    const duplicates: string[] = [];

    // Get all elements with IDs in the new content
    const elementsWithIds = container.querySelectorAll('[id]');

    elementsWithIds.forEach(el => {
        const id = el.id;

        // Check if ID already exists in the document
        if (document.getElementById(id)) {
            duplicates.push(id);
        }

        // Check for duplicates within the new content
        if (ids.has(id)) {
            duplicates.push(id);
        }

        ids.add(id);
    });

    if (duplicates.length > 0) {
        console.error(`Duplicate IDs found: ${duplicates.join(', ')}`);
        return false;
    }
    return true;
}

export function htmlTag(name: string, ...children: ReadonlyArray<HTMLLike>): HTMLElement {
    const tag = document.createElement(name);
    for (const child of children)
        appendHtmlLike(tag, child);
    return tag;
}

export function htmlP(...children: ReadonlyArray<HTMLLike>): HTMLParagraphElement {
    return htmlTag("p", ...children) as HTMLParagraphElement;
}
export function htmlLi(...children: ReadonlyArray<HTMLLike>): HTMLLIElement {
    return htmlTag("li", ...children) as HTMLLIElement;
}
export function htmlEm(...children: ReadonlyArray<HTMLLike>): HTMLElement {
    return htmlTag("em", ...children);
}

export function insertHtmlLike(parent: HTMLElement, html: HTMLLike | null | undefined): void {
    parent.innerHTML = '';
    if (html != null)
        appendHtmlLike(parent, html);
}

export function appendHtmlLike(parent: HTMLElement, html: HTMLLike): void {
    if (Array.isArray(html) && html.length == 2) {
        const [key, value] = html;
        parent.setAttribute(key, value)
    } else if (typeof html === "string") {
        const span = document.createElement("span")
        span.innerHTML = html;
        for (const child of Array.from(span.childNodes)) {
            parent.appendChild(child);
        }
    } else if (html instanceof HTMLElement || html instanceof Text)
        parent.appendChild(html);
    else {
        console.error("appendHtmlLike with invalid argument", parent, html);
        throw Error("appendHtmlLike with invalid argument");
    }
}

export function text(text: string): Text {
    return document.createTextNode(text);
}

export function strippedSubject(subject: string): [string, string] {
    let origSubject = subject;
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
        strip("Fwd:");
        strip("AW:");
        strip("Vs:");
    }
    return [subject, origSubject.substring(0, origSubject.length-subject.length)];
}
