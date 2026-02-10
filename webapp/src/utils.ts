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

export function htmlTag<T extends HTMLElement>(name: string, ...children: ReadonlyArray<HTMLElement | Text | string | string[]>): T {
    const tag = document.createElement(name) as T;
    for (const child of children) {
        if (Array.isArray(child)) {
            const [key, value] = child;
            tag.setAttribute(key, value)
        } else if (typeof child === "string")
           tag.appendChild(document.createTextNode(child));
        else
            tag.appendChild(child);
    }
    return tag;
}

export function htmlP(...children: ReadonlyArray<HTMLElement | Text | string | string[]>): HTMLParagraphElement {
    return htmlTag<HTMLParagraphElement>("p", ...children);
}
export function htmlLi(...children: ReadonlyArray<HTMLElement | Text | string | string[]>): HTMLLIElement {
    return htmlTag<HTMLLIElement>("li", ...children);
}
export function htmlEm(...children: ReadonlyArray<HTMLElement | Text | string | string[]>): HTMLElement {
    return htmlTag("em", ...children);
}

export function insertHtmlLike(parent: HTMLElement, html: HTMLLike | null | undefined): void {
    if (html == null)
        parent.innerHTML = '';
    else if (typeof html === 'string') {
        parent.innerHTML = html;
    } else {
        parent.appendChild(html);
    }
}