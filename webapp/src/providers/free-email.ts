import html from './free-email.html?raw';
import {Provider} from "../provider.ts";
import type {HTMLLike, ParsedFragment} from "../types.ts";
import {strippedSubject} from "../utils.ts";

export class FreeEmailProvider extends Provider {
    private linkElement!: HTMLAnchorElement;
    private autoActionCheckbox!: HTMLInputElement;
    private data: ParsedFragment | null = null;
    private link: string | undefined;

    constructor() {
        super({'id': 'free-email', 'title': 'FreeEmail (Android)', 'html': html});
    }

    protected init(): void | Promise<void> {
        this.linkElement = document.getElementById("free-email-link") as HTMLAnchorElement;
        this.autoActionCheckbox = document.getElementById("free-email-autoaction") as HTMLInputElement;

        this.autoActionCheckbox.addEventListener("change", () => {
            if (this.autoActionCheckbox.checked) this.takeAutoAction();
            else this.releaseAutoAction();
        })
    }

    dataChanged(data: ParsedFragment | null): void | Promise<void> {
        this.data = data;
        this.updateLink();
    }

    updateLink() {
        if (!this.data) {
            this.link = undefined;
            this.linkElement.removeAttribute("href");
            this.linkElement.textContent = "[No message data]";
            return;
        }

        const params = this.data.params;
        const subject = params["subject"] ? strippedSubject(params["subject"])[0] : "";

        // FreeEmail can only search by subject here, so a message with no
        // subject gives us nothing to search for -- show a notice instead
        // of a link that would open an empty search.
        if (!subject) {
            this.link = undefined;
            this.linkElement.removeAttribute("href");
            this.linkElement.textContent = "[No subject to search for]";
            return;
        }

        this.link = freeEmailSearchURI(subject);
        this.linkElement.textContent = this.link.substring(0, 35) + "…";
        this.linkElement.href = this.link;
    }

    lostAutoAction() {
        this.autoActionCheckbox.checked = false;
    }

    gotAutoAction() {
        this.autoActionCheckbox.checked = true;
    }

    automaticActionText(): HTMLLike {
        return 'Directly search the email in the FreeEmail app.';
    }

    doAutoAction(): void | Promise<void> {
        if (this.link != null)
            window.open(this.link, '_blank');
        else
            console.error("doAutoAction called without parsed fragment", this);
    }
}

/**
 * ================================================================
 * freeEmailSearchURI -- builds a FairEmail "search" deep link
 * ================================================================
 *
 * This whole file is derived from reading FairEmail's actual source
 * (ActivitySearch, ActivityView, and BoundaryCallbackMessages.
 * SearchCriteria), not from documentation -- FairEmail's query
 * language isn't documented anywhere. The comments below explain the
 * *why* behind each construction choice, since none of this is
 * obvious from the outside and small changes (word order, an extra
 * "+", an extra "//") silently break it.
 */

const SEARCH_SCHEME = "eu.faircode.email.search";
const PACKAGE_NAME = "eu.faircode.email";

// The five field-restricting, AND'd, case-sensitive prefixes FairEmail's
// parser recognizes via a plain `word.startsWith(prefix)` check on each
// individual whitespace-delimited token. A bare prefix with nothing
// after it (e.g. just "to:") does NOT trigger -- FairEmail requires
// `word.length > prefix.length`.
const RESERVED_FIELD_PREFIXES = ["from:", "to:", "cc:", "bcc:", "keyword:"];

// jsoup: is a different kind of hazard: FairEmail checks
// `query.startsWith("jsoup:")` against the ENTIRE decoded query string,
// not per word. Since the subject is now the whole query, this is a
// real risk only for the subject's very first word.
const JSOUP_PREFIX = "jsoup:";

/**
 * Checks whether a single whitespace-delimited word would be misparsed
 * by FairEmail's tokenizer (`for (String w : search.trim().split("\\s+"))`)
 * instead of being treated as literal subject text.
 *
 * A word is "dangerous" if:
 *
 *  1. It starts with "+", "-", or "?" AND is longer than 1 character.
 *     These are FairEmail's per-word require / exclude / optional
 *     modifiers. Using any of them switches the ENTIRE subject/body
 *     match from "one continuous phrase" to "AND/OR/NOT of separate
 *     single-word substring checks" (and also disables the generic
 *     sender/recipient/keyword fallback search) -- not what we want
 *     for a plain subject phrase.
 *     A LONE "+", "-", or "?" is safe: FairEmail requires
 *     `w.length > 1`, so a single punctuation character falls through
 *     to being treated as an ordinary word.
 *
 *  2. It starts with one of the five reserved field prefixes
 *     (`from:`, `to:`, `cc:`, `bcc:`, `keyword:`) AND has at least one
 *     character after the colon. A subject containing a word like
 *     "to:Data" (e.g. from "Introduction to:Data science") would
 *     otherwise be silently pulled out of the subject phrase and
 *     turned into an unintended AND'd recipient constraint.
 *
 *  3. -- only for the very first subject word (position 0 of the whole
 *     query) -- it starts with "jsoup:" and has characters after it.
 *     Elsewhere in the subject this is harmless, since jsoup: is checked
 *     against the whole query string, not per word.
 *
 * Deliberately NOT flagged (these are safe and common, so we don't
 * want false positives): a word merely CONTAINING one of the reserved
 * strings without starting with it ("info@to-example.com", "Re:",
 * "10:30"), and case variants ("From:", "TO:") since FairEmail's check
 * is case-sensitive.
 */
function isDangerousSubjectWord(word: string, isQueryStart: boolean): boolean {
    if (word.length > 1 && (word.startsWith("+") || word.startsWith("-") || word.startsWith("?"))) {
        return true;
    }

    if (RESERVED_FIELD_PREFIXES.some((p) => word.length > p.length && word.startsWith(p))) {
        return true;
    }

    if (isQueryStart && word.length > JSOUP_PREFIX.length && word.startsWith(JSOUP_PREFIX)) {
        return true;
    }

    return false;
}

/**
 * Truncates the subject at the first dangerous word, discarding that
 * word and everything after it, rather than trying to escape it.
 *
 * FairEmail's query grammar has NO quoting/escaping mechanism at all --
 * there is no way to write a literal "+launch" or "to:something" as
 * plain text once it appears as its own whitespace-delimited word.
 * Truncating is the only correct option: it trades search precision
 * (a shorter, more ambiguous phrase) for a guarantee that we never
 * accidentally inject an unintended operator into the query.
 *
 * @param subject   raw, user-supplied subject text
 * @returns the safe, truncated phrase, or null if even the very first
 *          word was dangerous (nothing safe remains to search for)
 */
function sanitizeSubject(subject: string): string | null {
    // Normalize whitespace up front. FairEmail's tokenizer splits on
    // `\s+` (any run of whitespace counts as one separator), and when it
    // reconstructs the surviving free-text words it always rejoins them
    // with a single space -- so a single-spaced version of the subject
    // is what actually ends up being searched regardless of the original
    // spacing.
    const normalized = subject.trim().replace(/\s+/g, " ");
    if (normalized.length === 0) return null;

    const words = normalized.split(" ");
    const safeWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
        // The subject is the entire query, so only its first word can ever
        // land at position 0 (where the jsoup: special case applies).
        if (isDangerousSubjectWord(words[i], i === 0)) {
            break; // stop BEFORE the dangerous word -- discard it and everything after
        }
        safeWords.push(words[i]);
    }

    return safeWords.length > 0 ? safeWords.join(" ") : null;
}

/**
 * Builds a FairEmail "search" deep link (an Android `intent:` URL) that
 * searches for a given subject.
 *
 * NOTE: this used to also emit `from:`/`to:` field constraints, but
 * FairEmail does not honor complex (field-restricted) searches launched
 * from an intent link -- it requires a folder to be selected first, so
 * those constraints silently break the search. We therefore build a
 * plain free-text query from the subject alone.
 *
 * ================================================================
 * HOW FAIREMAIL INTERPRETS THIS QUERY
 * ================================================================
 * (reverse-engineered from BoundaryCallbackMessages.SearchCriteria)
 *
 * - The subject text has no dedicated "subject:" operator. The phrase
 *   we place in the query is OR'd -- as one whole, unbroken phrase, see
 *   below -- against Subject, Body, Keywords, and (since there are no
 *   from:/to: tokens) also Senders/Recipients. There is no way to
 *   restrict it to the Subject field alone.
 *
 * - As long as no word in the query starts with "+", "-", or "?", the
 *   subject phrase is matched as ONE CONTINUOUS SUBSTRING (adjacent
 *   words, in that order) rather than as an independently OR/AND-matched
 *   bag of words. This function never introduces those modifier
 *   characters itself, and `sanitizeSubject` truncates away any that the
 *   caller's input happens to contain -- so the resulting subject search
 *   is always a true continuous-phrase match.
 *
 * - FairEmail's grammar has no quoting/escaping mechanism at all --
 *   see `sanitizeSubject`'s doc comment for how this function copes
 *   with that (truncation, not escaping).
 *
 * ================================================================
 * WHY THE intent: URL IS QUOTED THE WAY IT IS
 * ================================================================
 *
 * FairEmail's ActivitySearch parses the incoming Android Uri like this:
 *   query = Uri.decode(uri.toString().substring(SEARCH_SCHEME.length() + 1));
 * i.e. it treats everything after "eu.faircode.email.search:" as one
 * single opaque, percent-encoded blob and decodes it directly. This
 * only works if the URI is OPAQUE ("scheme:opaque-part"), not
 * hierarchical ("scheme://authority/path").
 *
 * Chrome/webviews resolve `intent://...#Intent;...;end` links by first
 * reconstructing a URI from the part between "intent:" and
 * "#Intent;", and THEN substituting in the scheme from the fragment.
 * Writing "intent://foo#Intent;scheme=eu.faircode.email.search;...;end"
 * makes Android reconstruct "eu.faircode.email.search://foo" -- an
 * unwanted "//" that shifts everything after the colon by two
 * characters and corrupts FairEmail's naive substring-based parsing
 * (FairEmail opens, but with an empty/garbled search).
 *
 * The fix: omit the "//" after "intent:" entirely, so the opaque part
 * passes straight through untouched:
 *   intent:<percent-encoded-query>#Intent;scheme=...;package=...;end
 * This resolves to exactly "eu.faircode.email.search:<query>", which
 * is exactly what ActivitySearch expects.
 *
 * The query itself is percent-encoded exactly once, as a whole, via
 * `encodeURIComponent` -- this is what `Uri.decode(...)` on FairEmail's
 * side reverses. Encoding word-by-word instead would be wrong: spaces
 * between tokens need to survive as literal spaces (or %20) in the
 * decoded string, since FairEmail's tokenizer itself splits on them.
 *
 * @param subject free-text subject search; see the extensive notes
 *                above on how/where this is matched, and how dangerous
 *                words get truncated away
 * @returns a ready-to-use `intent:` URL that opens FairEmail's search
 */
export function freeEmailSearchURI(subject: string): string {
    const query = sanitizeSubject(subject) ?? "";
    const encodedQuery = encodeURIComponent(query);

    // No "//" after "intent:" -- see the extensive comment above for
    // exactly why that's what keeps FairEmail's opaque-URI parsing intact.
    return `intent:${encodedQuery}#Intent;scheme=${SEARCH_SCHEME};package=${PACKAGE_NAME};end`;
}