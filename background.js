chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ downloads: [] });
});

// Listen for download requests from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "downloadVideo") {
    const { url, quality } = message;
    console.log("Background: Download requested", url, quality);

    fetch("https://my-project-hijj.onrender.com/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, quality })
    })
    .then(res => {
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      return res.text();
    })
    .then(data => {
      console.log("Background: Server response:", data);
      sendResponse({ status: "started" });
    })
    .catch(err => {
      console.error("Background: Fetch failed:", err);
      sendResponse({ status: "error", message: err.message });
    });

    // Return true to keep sendResponse async
    return true;
  }
});
