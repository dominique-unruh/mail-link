interface Options {
    baseUrl: string;
    whoHasIt: string;
    includeWhoHasIt: boolean;
    includeSubject: boolean,
    includeDate: boolean,
    includeFrom: boolean,
    includeTo: boolean
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