const statusEl = document.getElementById('status');

const source = new EventSource("http://localhost:5000/progress");
source.onmessage = (event) => {
  statusEl.textContent = event.data;
  if (event.data.includes("Download complete")) {
    source.close();
  }
};
source.onerror = () => {
  statusEl.textContent = "Lost connection to progress server.";
  source.close();
};
