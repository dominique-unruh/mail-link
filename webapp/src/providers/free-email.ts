


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
// not per word. So it's only a real risk for the very first word we
// ever place in the assembled query -- i.e. only when the subject ends
// up being the first (and possibly only) thing in the query, which
// happens only when both `from` and `to` are absent.
const JSOUP_PREFIX = "jsoup:";

/**
 * Extracts a bare email address out of either:
 *   - "Display Name <email@example.com>"
 *   - "email@example.com"
 *
 * FairEmail's from:/to: tokens do a plain substring/prefix match
 * against the message's actual From/To header text, so feeding it a
 * display name alongside the address would just make the match
 * stricter (and probably wrong, since header formatting varies) -- we
 * always want just the bare address.
 */
function extractEmailAddress(raw: string): string {
    const angleMatch = raw.match(/<([^<>]+)>/);
    return (angleMatch ? angleMatch[1] : raw).trim();
}

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
 *  3. -- only if this word could land at position 0 of the ENTIRE
 *     assembled query (i.e. only for the first subject word, and only
 *     when there is no from:/to: token ahead of it) -- it starts with
 *     "jsoup:" and has characters after it. Elsewhere in the subject
 *     this is harmless, since jsoup: is checked against the whole
 *     query string, not per word.
 *
 * Deliberately NOT flagged (these are safe and common, so we don't
 * want false positives): a word merely CONTAINING one of the reserved
 * strings without starting with it ("info@to-example.com", "Re:",
 * "10:30"), and case variants ("From:", "TO:") since FairEmail's check
 * is case-sensitive. Note that a Gmail-style "+" tag inside an email
 * address (e.g. someone+newsletter@example.com) is never at risk here
 * anyway -- addresses go through the from:/to: tokens built directly
 * from `from`/`to` params, never through this subject-word check.
 */
function isDangerousSubjectWord(word: string, isPotentialQueryStart: boolean): boolean {
    if (word.length > 1 && (word.startsWith("+") || word.startsWith("-") || word.startsWith("?"))) {
        return true;
    }

    if (RESERVED_FIELD_PREFIXES.some((p) => word.length > p.length && word.startsWith(p))) {
        return true;
    }

    if (isPotentialQueryStart && word.length > JSOUP_PREFIX.length && word.startsWith(JSOUP_PREFIX)) {
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
 * @param subject               raw, user-supplied subject text
 * @param subjectIsFirstToken   whether this subject would become the
 *                              very first token of the final assembled
 *                              query -- true only when both `from` and
 *                              `to` are absent/empty. Needed to decide
 *                              whether the jsoup: special case applies
 *                              to this subject's first word.
 * @returns the safe, truncated phrase, or null if even the very first
 *          word was dangerous (nothing safe remains to search for)
 */
function sanitizeSubject(subject: string, subjectIsFirstToken: boolean): string | null {
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
        // Only the very first subject word can ever land at position 0 of
        // the whole query, and only if nothing precedes it.
        const isThisWordPotentialQueryStart = subjectIsFirstToken && i === 0;
        if (isDangerousSubjectWord(words[i], isThisWordPotentialQueryStart)) {
            break; // stop BEFORE the dangerous word -- discard it and everything after
        }
        safeWords.push(words[i]);
    }

    return safeWords.length > 0 ? safeWords.join(" ") : null;
}

/**
 * Builds a FairEmail "search" deep link (an Android `intent:` URL) that
 * searches for a given subject / sender / (single) recipient.
 *
 * ================================================================
 * HOW FAIREMAIL INTERPRETS THIS QUERY
 * ================================================================
 * (reverse-engineered from BoundaryCallbackMessages.SearchCriteria)
 *
 * - `from:<email>` is a genuine, field-restricted, AND'd constraint --
 *   the message's From header must contain <email>. Works exactly as
 *   you'd expect, no caveats.
 *
 * - `to:<email>` is ALSO AND'd and field-restricted, but it ONLY
 *   checks the To header. FairEmail has no operator meaning "in To OR
 *   Cc OR Bcc": its one and only implicit OR-across-fields fallback
 *   reuses the exact same free-text string that also feeds the
 *   subject/body search, so it cannot be combined with an independent
 *   subject phrase (which is exactly what we want here). Practical
 *   consequence: if the address you're looking for was actually a
 *   Cc/Bcc recipient rather than a direct To recipient, this query
 *   will NOT find that message.
 *
 * - The subject text has no dedicated "subject:" operator. Whatever
 *   phrase we place in the query is OR'd -- as one whole, unbroken
 *   phrase, see below -- against Subject, Body, and Keywords (and,
 *   only if `from`/`to` are both absent, also against Senders/
 *   Recipients). There is no way to restrict it to the Subject field
 *   alone.
 *
 * - As long as no word in the final query starts with "+", "-", or
 *   "?", the subject phrase is matched as ONE CONTINUOUS SUBSTRING
 *   (adjacent words, in that order) rather than as an independently
 *   OR/AND-matched bag of words. This function never introduces those
 *   modifier characters itself, and `sanitizeSubject` truncates away
 *   any that the caller's input happens to contain -- so the resulting
 *   subject search is always a true continuous-phrase match.
 *
 * - Token order matters for a subtle reason. FairEmail rebuilds the
 *   "free text" portion of the query by re-concatenating only the
 *   non-operator (bare) words, in their original order -- but its
 *   reconstruction loop adds a stray joining space for every operator
 *   token it strips out, UNLESS that operator token appears before any
 *   bare word has been emitted yet. Putting `from:`/`to:` BEFORE the
 *   subject words (as this function does) avoids that, so the subject
 *   phrase always reconstructs with clean single spaces and no
 *   corrupting interior gaps.
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
 * @param subject free-text subject search (may be null); see the
 *                extensive notes above on how/where this is matched,
 *                and how dangerous words get truncated away
 * @param from    sender, as "email@x.com" or "Name <email@x.com>"
 *                (may be null)
 * @param to      recipient, as "email@x.com" or "Name <email@x.com>"
 *                (may be null); only the To field is checked, not
 *                Cc/Bcc -- see notes above
 * @returns a ready-to-use `intent:` URL that opens FairEmail's search
 */
export function freeEmailSearchURI(
    subject: string | null,
    from: string | null,
    to: string | null
): string {
    const tokens: string[] = [];

    // Field-restricted tokens go FIRST -- see the query-reconstruction
    // note above for why this is what keeps the subject phrase (appended
    // last) free of stray interior spaces.
    if (from) {
        const fromEmail = extractEmailAddress(from);
        if (fromEmail) tokens.push(`from:${fromEmail}`);
    }

    if (to) {
        const toEmail = extractEmailAddress(to);
        // NOTE: only ever matches the To header -- see the function's doc
        // comment for why an OR-across-To/Cc/Bcc check isn't possible here.
        if (toEmail) tokens.push(`to:${toEmail}`);
    }

    if (subject) {
        // The subject can only land at query-position 0 if we haven't
        // pushed any from:/to: token above -- that's the one case where
        // the jsoup: special-case inside sanitizeSubject actually matters.
        const subjectIsFirstToken = tokens.length === 0;
        const safeSubject = sanitizeSubject(subject, subjectIsFirstToken);
        if (safeSubject) tokens.push(safeSubject);
    }

    const query = tokens.join(" ");
    const encodedQuery = encodeURIComponent(query);

    // No "//" after "intent:" -- see the extensive comment above for
    // exactly why that's what keeps FairEmail's opaque-URI parsing intact.
    return `intent:${encodedQuery}#Intent;scheme=${SEARCH_SCHEME};package=${PACKAGE_NAME};end`;
}