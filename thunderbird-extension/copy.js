// Install the actions of the
// noinspection ExceptionCaughtLocallyJS

// Add the button to the message display action toolbar
browser.messageDisplayAction.onClicked.addListener(async (tab, _info) => {
  try {
    // Get the displayed message
    let message = await browser.messageDisplay.getDisplayedMessage(tab.id);

    // Get options from storage
    let options = await browser.storage.sync.get();
    console.log(options)
    if (!options.baseUrl || options.baseUrl === "") {
      browser.runtime.openOptionsPage();
      return;
    }

    if (!message)
      throw Error("No message displayed");

    // Get full message details
    let messageData = await browser.messages.get(message.id);

    // Construct the URL
    let url = constructUrl(messageData, options);

    await navigator.clipboard.writeText(url);

    // Show notification
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: "Copy Message Link",
      message: "Message link copied to clipboard!"
    });
  } catch (error) {
    console.error("Error copying message link:", error);
    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: "Copy Message Link",
      message: "Error: " + error.message
    });
  }
});

/** Like encodeURIComponent but encodes additional characters that make the URI more suitable for automatic recognition inside plain text */
function myEncodeURIComponent(uriComponent) {
  return encodeURIComponent(uriComponent)
      .replace(/'/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

/** Optionally quotes the last character of the URI to make sure the URI is more suitable for automatic recognition inside plain text.
 * E.g., doesn't end in a `.`. */
function fixupURL(url) {
  return url.replace(/[^a-zA-Z0-9/&#=]$/, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
}

// Construct the message link URL
function constructUrl(message, options) {
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
    // Format date as ISO 8601
    let dateStr = new Date(message.date).toISOString();
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
