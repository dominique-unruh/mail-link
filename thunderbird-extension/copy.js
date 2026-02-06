// Install the actions of the
// noinspection ExceptionCaughtLocallyJS

// Add the button to the message display action toolbar
browser.messageDisplayAction.onClicked.addListener(async (tab, info) => {
  try {
    // Get the displayed message
    let message = await browser.messageDisplay.getDisplayedMessage(tab.id);

    // Get options from storage
    let options = await browser.storage.local.get();
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

// Construct the message link URL
function constructUrl(message, options) {
  let url = options.baseUrl;
  
  // Get message ID
  let msgId = message.headerMessageId;
  if (!msgId || msgId === "")
    throw Error("Could not determine message id")
  
  // Start with message ID
  url += "#" + encodeURIComponent(msgId);
  
  // Add optional fields
  if (options.includeSubject && message.subject) {
    url += "&subject=" + encodeURIComponent(message.subject);
  }
  
  if (options.includeDate && message.date) {
    // Format date as ISO 8601
    let dateStr = new Date(message.date).toISOString();
    url += "&date=" + encodeURIComponent(dateStr);
  }
  
  if (options.includeFrom && message.author) {
    url += "&from=" + encodeURIComponent(message.author);
  }
  
  if (options.includeTo && message.recipients && message.recipients.length > 0) {
    let toList = message.recipients.join(", ");
    url += "&to=" + encodeURIComponent(toList);
  }
  
  if (options.whoHasIt) {
    url += "&whohasit=" + encodeURIComponent(options.whoHasIt);
  }
  
  return url;
}
