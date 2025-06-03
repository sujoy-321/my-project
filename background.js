chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ downloads: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "downloadVideo") {
    const { url, quality } = message;
    console.log("[Background] Download request:", url, quality);

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
      console.log("[Background] Server response:", data);
      sendResponse({ status: "started" });
    })
    .catch(err => {
      console.error("[Background] Fetch error:", err);
      sendResponse({ status: "error", message: err.message });
    });

    // Keep the messaging channel open for async sendResponse
    return true;
  }
});
