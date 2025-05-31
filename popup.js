const downloadBtn = document.getElementById("downloadBtn");
const statusElement = document.getElementById("status");
const listElement = document.getElementById("downloadList");

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

function listenForProgress(videoUrl) {
  const source = new EventSource("http://localhost:5000/progress");

  source.onmessage = function (event) {
    const cleanText = event.data.replace(/\x1B\[[0-9;]*[mK]/g, ''); // Remove ANSI codes
    updateStatus(cleanText);
    saveProgress(videoUrl, cleanText);
  };

  source.onerror = function () {
    updateStatus("Lost connection to progress server.");
    source.close();
  };
}

downloadBtn.addEventListener("click", () => {
  const quality = document.getElementById("quality").value;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const videoUrl = tabs[0].url;

    fetch("http://localhost:5000/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl, quality: quality })
    })
    .then(response => response.text())
    .then(data => {
      updateStatus("Downloading...");
      saveProgress(videoUrl, "Downloading...");
      listenForProgress(videoUrl);
    })
    .catch(err => {
      updateStatus("Error: Could not connect to backend.");
    });
  });
});

// Restore list when popup opens
chrome.storage.local.get("downloads", (data) => {
  renderDownloads(data.downloads || []);
  
  // Reconnect to progress stream
  if ((data.downloads || []).length > 0) {
    const last = data.downloads[data.downloads.length - 1];
    listenForProgress(last.url);
  }
});