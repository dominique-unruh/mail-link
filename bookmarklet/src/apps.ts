// Registry of supported webmail apps. Each app knows how to recognise its own
// pages, list the messages present, and extract the raw source of a chosen one.

import {gmailApp} from './gmail.ts';

/** A message the user can pick from a conversation. */
export interface MessageChoice {
    /** Text shown to the user in the chooser. */
    label: string;
    /** App-specific identifier the extractor uses to fetch this message. */
    id: string;
    /** Emphasise this entry (e.g. a currently-open message). Best-effort. */
    emphasize: boolean;
}

export interface EmailApp {
    /** Human-readable name, e.g. "GMail". */
    name: string;
    /** Whether this app handles the given location. */
    matches(location: Location): boolean;
    /** List the messages currently available on the page (may be empty). */
    listMessages(location: Location): MessageChoice[];
    /**
     * Extract the raw RFC 822 source (at least the full header block) of the
     * message identified by `id` (a value from one of this app's MessageChoices).
     */
    extract(location: Location, id: string): Promise<string>;
}

/** All supported apps, tried in order. */
export const apps: EmailApp[] = [gmailApp];

/** The first app that handles `location`, or undefined if none does. */
export function findApp(location: Location): EmailApp | undefined {
    return apps.find(app => app.matches(location));
}
