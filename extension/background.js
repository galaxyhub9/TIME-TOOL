let youtubeTabId = null;
let timerMinutes = 0;
let timerSet = false;

// Function to start the timer
function startTimer(minutes) {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('youtubeTimer', { delayInMinutes: minutes });
    timerMinutes = minutes;
    timerSet = true;
    chrome.storage.local.set({ timerMinutes: minutes, startTime: Date.now() });
  });
}

// Function to show the popup
function showPopUp() {
  chrome.scripting.executeScript({
    target: { tabId: youtubeTabId },
    function: () => {
      const popUpDiv = document.createElement('div');
      popUpDiv.style.position = 'fixed';
      popUpDiv.style.top = '0';
      popUpDiv.style.left = '0';
      popUpDiv.style.width = '100%';
      popUpDiv.style.height = '100%';
      popUpDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      popUpDiv.style.color = 'white';
      popUpDiv.style.zIndex = '10000';
      popUpDiv.style.display = 'flex';
      popUpDiv.style.flexDirection = 'column';
      popUpDiv.style.justifyContent = 'center';
      popUpDiv.style.alignItems = 'center';
      popUpDiv.innerHTML = `
        <div style="text-align: center;">
          <h1>Are you doing something productive?</h1>
          <button id="productiveYes" style="margin: 10px; padding: 10px;">Yes</button>
          <button id="productiveNo" style="margin: 10px; padding: 10px;">No</button>
        </div>
      `;

      document.body.appendChild(popUpDiv);

      document.getElementById('productiveYes').addEventListener('click', () => {
        const userMinutes = prompt("Enter how many more minutes you need:");
        if (userMinutes && !isNaN(userMinutes) && userMinutes > 0) {
          chrome.runtime.sendMessage({ action: "resetTimer", newLimit: userMinutes * 60 });
          alert(`You have ${userMinutes} more minutes.`);
          popUpDiv.remove();
        } else {
          alert("Please enter a valid number of minutes.");
        }
      });

      document.getElementById('productiveNo').addEventListener('click', () => {
        alert("Closing YouTube to help you stay productive!");
        chrome.runtime.sendMessage({ action: "closeTab" });
        popUpDiv.remove();
      });
    }
  });
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'youtubeTimer') {
    showPopUp();
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "resetTimer") {
    startTimer(request.newLimit / 60); // Convert seconds to minutes
  } else if (request.action === "closeTab") {
    if (youtubeTabId !== null) {
      chrome.tabs.remove(youtubeTabId);
      youtubeTabId = null;
      timerSet = false;
    }
  }
  sendResponse({});
});

// Monitor tab updates and activations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes("youtube.com")) {
    if (!timerSet) {
      youtubeTabId = tab.id;
      showPopUp();
    } else {
      youtubeTabId = tab.id;
    }
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab.url && tab.url.includes("youtube.com")) {
      youtubeTabId = tab.id;
    } else {
      youtubeTabId = null;
    }
  });
});
