const downloadBtn = document.getElementById("downloadBtn");
const statusElement = document.getElementById("status");
const listElement = document.getElementById("downloadList");

const SERVER_URL = "https://my-project-hijj.onrender.com";

function updateStatus(status) {
  statusElement.textContent = "Status: " + status;
}

function saveProgress(url, status) {
  chrome.storage.local.get("downloads", (data) => {
    let downloads = data.downloads || [];
    const existing = downloads.find(d => d.url === url);
    if (existing) {
      existing.status = status;
    } else {
      downloads.push({ url, status });
    }
    chrome.storage.local.set({ downloads });
    renderDownloads(downloads);
  });
}

function renderDownloads(downloads) {
  listElement.innerHTML = "";
  downloads.forEach(d => {
    const div = document.createElement("div");
    div.className = "download-item";
    div.textContent = `${d.status}`;
    listElement.appendChild(div);
  });
}

function listenForProgress() {
  const source = new EventSource(`${SERVER_URL}/progress`);

  source.onmessage = function (event) {
    const cleanText = event.data.replace(/\x1B\[[0-9;]*[mK]/g, ''); // Remove ANSI codes
    updateStatus(cleanText);
    saveProgress("", cleanText);
  };

  source.onerror = function () {
    updateStatus("Lost connection to progress server.");
    source.close();
  };
}

downloadBtn.addEventListener("click", () => {
  const quality = document.getElementById("quality").value;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const videoUrl = tabs[0].url;

    if (!videoUrl.includes("youtube.com/watch")) {
      updateStatus("Error: Not a valid YouTube video URL.");
      return;
    }

    // Send download request to background.js
    chrome.runtime.sendMessage({
      action: "downloadVideo",
      url: videoUrl,
      quality: quality
    }, (response) => {
      if (response && response.status === "started") {
        updateStatus("Download started...");
        saveProgress(videoUrl, "Download started...");
        listenForProgress();
      } else if (response && response.status === "error") {
        updateStatus("Error: " + response.message);
      } else {
        updateStatus("Unknown error occurred.");
      }
    });
  });
});

// Render previously saved downloads on popup open
chrome.storage.local.get("downloads", (data) => {
  renderDownloads(data.downloads || []);
  listenForProgress();
});
