declare const enum PrivacyNoticeOptions {
    notAccepted = 0,
    accepted = 1,
}

interface Options {
    baseUrl: string;
    whoHasIt: string;
    includeWhoHasIt: boolean;
    includeSubject: boolean,
    includeDate: boolean,
    includeFrom: boolean,
    includeTo: boolean,
    /** Whether the user accepted the privacy notice. `privacyNoticeAccepted` means accepted.
     * (In future versions, the number that means "accepted" can increase.
     * This way, we show the privacy notice again if added privacy concerns need to be accepted.)
     **/
    privacyNotice: PrivacyNoticeOptions,
}

declare namespace browser.messengerUtilities {
    /** https://thunderbird-webextension-apis.readthedocs.io/en/stable/messengerUtilities.html#parsemailboxstring-mailboxstring-preservegroups */
    function parseMailboxString(mailboxString: string, preserveGroups?: boolean): Promise<Array<ParsedMailbox>>;
    /** https://thunderbird-webextension-apis.readthedocs.io/en/stable/messengerUtilities.html#parsedmailbox */
    interface ParsedMailbox {
        email?: string;
        group?: Array<ParsedMailbox>;
        name?: string;
    }
}