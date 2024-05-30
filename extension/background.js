let youtubeTimer = 0;
let youtubeLimit = 3600; // Default limit in seconds (e.g., 3600 seconds = 1 hour)

// Load the youtubeLimit from storage
chrome.storage.local.get(['youtubeLimit'], (result) => {
  if (result.youtubeLimit) {
    youtubeLimit = result.youtubeLimit;
  }
});

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

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "resetTimer") {
    youtubeLimit = request.newLimit;
    youtubeTimer = 0;
  } else if (request.action === "closeTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.remove(tabs[0].id);
    });
  }
  sendResponse({});
});


// Check YouTube usage every second
setInterval(checkYouTubeUsage, 1000);
