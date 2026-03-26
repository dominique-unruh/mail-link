export const enum PrivacyNoticeOptions {
    notAccepted = 0,
    accepted = 1,
}

export interface Options {
    baseUrl: string;
    whoHasIt: string;
    includeWhoHasIt: boolean;
    includeSubject: boolean,
    includeDate: boolean,
    includeFrom: boolean,
    includeTo: boolean,
    /** Configures different formats for the text of the link */
    presentation: string,
    /** Whether the user accepted the privacy notice. `privacyNoticeAccepted` means accepted.
     * (In future versions, the number that means "accepted" can increase.
     * This way, we show the privacy notice again if added privacy concerns need to be accepted.)
     **/
    privacyNotice: PrivacyNoticeOptions,
}

declare global {
     namespace browser.messengerUtilities {
        /** https://thunderbird-webextension-apis.readthedocs.io/en/stable/messengerUtilities.html#parsemailboxstring-mailboxstring-preservegroups */
        function parseMailboxString(mailboxString: string, preserveGroups?: boolean): Promise<Array<ParsedMailbox>>;
        /** https://thunderbird-webextension-apis.readthedocs.io/en/stable/messengerUtilities.html#parsedmailbox */
        interface ParsedMailbox {
            email?: string;
            group?: Array<ParsedMailbox>;
            name?: string;
        }
    }
}

export const presentationKeywords = new Set(["%", ",", "from", "to", "date", "subject"])
export const presentationKeywordRegex = /%(%|,|[a-zA-Z0-9]+)/g;

export const defaultBaseUrl = "https://qis.rwth-aachen.de/people/unruh/tools/mail-link/";
export const defaultPresentation =
    "Email from %from\n" +
    "Email for %to\n" +
    "Email from %date\n"

export const defaultOptions: Options = {
    baseUrl: defaultBaseUrl,
    whoHasIt: "",
    includeWhoHasIt: true,
    includeSubject: true,
    includeDate: true,
    includeFrom: true,
    includeTo: true,
    presentation: defaultPresentation,
    privacyNotice: PrivacyNoticeOptions.notAccepted,
};
