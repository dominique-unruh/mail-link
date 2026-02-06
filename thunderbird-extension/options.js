// Options page script for Copy Message Link extension

let defaultBaseUrl = "https://qis.rwth-aachen.de/people/unruh/tools/mail-link/";

// Load saved options
async function loadOptions() {
  try {
    let options = await browser.storage.sync.get({
      baseUrl: defaultBaseUrl,
      whoHasIt: "",
      includeWhoHasIt: true,
      includeSubject: true,
      includeDate: true,
      includeFrom: true,
      includeTo: true
    });

    document.getElementById("baseUrl").addEventListener("input", validateOptions);
    document.getElementById("whoHasIt").addEventListener("input", validateOptions);
    document.getElementById("includeWhoHasIt").addEventListener("change", validateOptions);
    document.getElementById("includeSubject").addEventListener("change", validateOptions);
    document.getElementById("includeDate").addEventListener("change", validateOptions);
    document.getElementById("includeFrom").addEventListener("change", validateOptions);
    document.getElementById("includeTo").addEventListener("change", validateOptions);

    // Populate form fields
    document.getElementById("baseUrl").value = options.baseUrl;
    document.getElementById("whoHasIt").value = options.whoHasIt;
    document.getElementById("includeWhoHasIt").checked = options.includeWhoHasIt;
    document.getElementById("includeSubject").checked = options.includeSubject;
    document.getElementById("includeDate").checked = options.includeDate;
    document.getElementById("includeFrom").checked = options.includeFrom;
    document.getElementById("includeTo").checked = options.includeTo;

    validateOptions();
  } catch (error) {
    console.error("Error loading options:", error);
  }
}

function validateOptions() {
  let errors = []
  if (document.getElementById("whoHasIt").value === "" &&
      document.getElementById("includeWhoHasIt").checked)
    errors.push("You need to enter your name/email in \"Your data\", or deactivate it in \"Included Information\".")
  if (document.getElementById("baseUrl").value === "")
    errors.push("You need to enter a base URL. E.g., "+defaultBaseUrl)
  else if (!document.getElementById("baseUrl").value.startsWith("https://"))
    errors.push("Your base URL must start with https://. E.g., "+defaultBaseUrl)
  if (errors.length === 0) {
    document.getElementById("errors").style.display = "none";
    document.getElementById("save-button").disabled = false;
  } else {
    let errorHtml = "<strong>There are errors:</strong><ul>";
    errors.forEach(error => {
      let escaped = error.replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      errorHtml += "<li>" + escaped + "</li>";
    });
    errorHtml += "</ul>";
    document.getElementById("errors").innerHTML = errorHtml;
    document.getElementById("errors").style.display = "block";
    document.getElementById("save-button").disabled = true;
  }
}

// Save options
async function saveOptions(e) {
  e.preventDefault();
  
  try {
    let options = {
      baseUrl: document.getElementById("baseUrl").value,
      whoHasIt: document.getElementById("whoHasIt").value,
      includeWhoHasIt: document.getElementById("includeWhoHasIt").checked,
      includeSubject: document.getElementById("includeSubject").checked,
      includeDate: document.getElementById("includeDate").checked,
      includeFrom: document.getElementById("includeFrom").checked,
      includeTo: document.getElementById("includeTo").checked
    };
    
    await browser.storage.sync.set(options);
    
    // Show success message
    let status = document.getElementById("status");
    status.textContent = "Options saved successfully!";
    status.className = "status success";
    status.style.display = "block";
    
    // Hide message after 3 seconds
    setTimeout(() => {
      status.style.display = "none";
    }, 3000);
  } catch (error) {
    console.error("Error saving options:", error);
    let status = document.getElementById("status");
    status.textContent = "Error saving options: " + error.message;
    status.className = "status";
    status.style.display = "block";
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", loadOptions);
document.getElementById("optionsForm").addEventListener("submit", saveOptions);
