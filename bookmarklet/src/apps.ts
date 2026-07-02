// Registry of supported webmail apps. Each app knows how to recognise its own
// pages and how to extract the raw source of the currently open message.

import {gmailApp} from './gmail.ts';

export interface EmailApp {
    /** Human-readable name, e.g. "GMail". */
    name: string;
    /** Whether this app handles the given location. */
    matches(location: Location): boolean;
    /**
     * Extract the raw RFC 822 source (at least the full header block) of the
     * currently open message. Rejects if it cannot be obtained.
     */
    extract(location: Location): Promise<string>;
}

/** All supported apps, tried in order. */
export const apps: EmailApp[] = [gmailApp];

/** The first app that handles `location`, or undefined if none does. */
export function findApp(location: Location): EmailApp | undefined {
    return apps.find(app => app.matches(location));
}
