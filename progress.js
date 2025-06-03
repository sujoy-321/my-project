const statusEl = document.getElementById('status');

const source = new EventSource("https://my-project-hijj.onrender.com/progress");

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
