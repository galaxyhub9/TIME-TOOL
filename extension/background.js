let youtubeTimer = 0;
const youtubeLimit = 60; // Set your limit in seconds (e.g., 3600 seconds = 1 hour)

function checkYouTubeUsage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;

    const activeTab = tabs[0];
    if (activeTab.url.includes("youtube.com/watch")) {
      youtubeTimer++;
      
      if (youtubeTimer >= youtubeLimit) {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["content.js"]
        });
      }
    } else {
      youtubeTimer = 0; // Reset the timer if not on YouTube
    }
  });
}

// Check YouTube usage every second
setInterval(checkYouTubeUsage, 1000);
