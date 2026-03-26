// noinspection ExceptionCaughtLocallyJS

import {makeLinkTitle, makeLinkTitles, makeSpecificLinkTitle} from './maketitle.js';
import {defaultOptions, Options, PrivacyNoticeOptions} from "./common.js";
import Tab = browser.tabs.Tab;

/** Returns options, or redirects user to options page and returns null */
async function getOptions() {
  // Get options from storage
  let options = await browser.storage.sync.get(defaultOptions) as Options;

  if (!options.baseUrl || options.baseUrl === "" || options.privacyNotice != PrivacyNoticeOptions.accepted) {
    console.log("Need to show options page", options);
    await browser.runtime.openOptionsPage();
    return null;
  }

  return options;
}

async function copyMessageLink(tab: Tab, presentation: string|null) {
  try {
    // Get the displayed message
    let message = (await browser.messageDisplay.getDisplayedMessage(tab.id!))!;

    if (!message)
      throw Error("No message displayed");

    const options = await getOptions();
    if (options == null) return;

    // Construct the URL
    let url = constructUrl(message, options);

    const linkTitle =
        (presentation == null) ? await makeLinkTitle(message, options) :
            (await makeSpecificLinkTitle(message, presentation))[1];

    await urlToClipboard(url, linkTitle);

    // Show notification
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: "Copy Message Link",
      message:
          (presentation == null) ?
            "Message link copied to clipboard!\n(Right click button for more options.)" :
              "Message link copied to clipboard!",
    });
  } catch (error) {
    console.error("Error copying message link:", error);
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: "Copy Message Link",
      message: "Error: " + (error as Error).message
    });
  }
}

browser.messageDisplayAction.onClicked.addListener(async (tab, _info) => {
  await copyMessageLink(tab, null);
});

browser.menus.onShown.addListener(async (info, tab) => {
  console.log("onShown", info);

  let message = (await browser.messageDisplay.getDisplayedMessage(tab.id!))!;

  const options = await getOptions();
  if (options == null) return;

  for (const id of info.menuIds)
    if (String(id).startsWith("copy-message-link-"))
      browser.menus.remove(id);

/*  browser.menus.create({
    id: "copy-message-link-copy-as",
    enabled: false,
    title: "Copy as:"
  })*/

  let someValid = false;
  for await (const [valid, config, title] of makeLinkTitles(message, options)) {
    browser.menus.create({
      id: `copy-message-link-title-${config}`,
      title: `📋 ${title}`,
      enabled: valid,
    })
    if (valid) someValid = true;
  }

  if (!someValid)
    browser.menus.create({
      id: `copy-message-link-title-Email`,
      title: `📋 Email`,
    })

  browser.menus.refresh();
})

browser.menus.onClicked.addListener(async (info, tab) => {
  if (tab?.id == null) return;
  const menuItemId = String(info.menuItemId);
  if (menuItemId.startsWith("copy-message-link-title-")) {
    const message = await browser.messageDisplay.getDisplayedMessage(tab.id);
    if (!message) return;
    const presentation = menuItemId.substring("copy-message-link-title-".length);
    copyMessageLink(tab, presentation);
  }
})

/** Like encodeURIComponent but encodes additional characters that make the URI more suitable for automatic recognition inside plain text */
function myEncodeURIComponent(uriComponent: string) {
  return encodeURIComponent(uriComponent)
      .replace(/'/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

/** Optionally quotes the last character of the URI to make sure the URI is more suitable for automatic recognition inside plain text.
 * E.g., doesn't end in a `.`. */
function fixupURL(url: string) {
  // The pattern guarantees that we don't escape anything alphanumeric (which first isn't worth quoting and second might be part of an already escaped character)
  // nor any symbols that are part of not to be quoted URL parts (such as path separator /, query-string syntax elements &,=, etc.)
  return url.replace(/[^a-zA-Z0-9/&#=]$/, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

/** Construct the URL linking to email `message`.
 */
function constructUrl(message: browser.messages.MessageHeader, options: Options): string {
  let url = options.baseUrl;
  
  // Get message ID
  let msgId = message.headerMessageId;
  if (!msgId || msgId === "")
    throw Error("Could not determine message id")
  
  // Start with message ID
  url += "#" + myEncodeURIComponent(msgId);
  
  // Add optional fields
  if (options.includeSubject && message.subject) {
    url += "&subject=" + myEncodeURIComponent(message.subject);
  }
  
  if (options.includeDate && message.date) {
    let dateStr = formatRFC5322(message.date as Date);
    url += "&date=" + myEncodeURIComponent(dateStr);
  }
  
  if (options.includeFrom && message.author) {
    url += "&from=" + myEncodeURIComponent(message.author);
  }
  
  if (options.includeTo && message.recipients && message.recipients.length > 0) {
    let toList = message.recipients.join(", ");
    url += "&to=" + myEncodeURIComponent(toList);
  }
  
  if (options.whoHasIt) {
    url += "&whohasit=" + myEncodeURIComponent(options.whoHasIt);
  }

  url = fixupURL(url);

  return url;
}

function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Copied `url` to the clipboard.
 * When pasted into a target supporting rich text, it will be pasted as a hyperlink to `url`, with text `title`.
 */
async function urlToClipboard(url: string, title: string): Promise<void> {
  const html = `<a href="${url}">${escapeHtml(title)}</a>`;

  const clipboardItem = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([url], { type: 'text/plain' })
  });

  await navigator.clipboard.write([clipboardItem]);
}


function formatRFC5322(date: Date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const pad = (n: any) => String(n).padStart(2, '0');

  const offset = -date.getTimezoneOffset();
  const offsetSign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);

  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ` +
      `${offsetSign}${offsetHours}${offsetMinutes}`;
}
