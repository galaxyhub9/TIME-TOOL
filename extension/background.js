let youtubeTabId = null;
let timerInterval = null;
let timerSet = false;

// Function to start the timer
function startTimer(minutes) {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('youtubeTimer', { delayInMinutes: minutes });
    chrome.storage.local.set({ timerMinutes: minutes, startTime: Date.now() });
    startInterval();
    timerSet = true;
  });
}

// Function to start the interval for checking timer
function startInterval() {
  timerInterval = setInterval(() => {
    checkTimer();
  }, 1000); // Check every second
}

// Function to stop the timer interval
function stopInterval() {
  clearInterval(timerInterval);
}

// Function to check timer and show popup if elapsed
function checkTimer() {
  chrome.storage.local.get(['timerMinutes', 'startTime'], (result) => {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - result.startTime) / 1000; // Convert ms to seconds

    if (elapsedTime >= result.timerMinutes * 60) {
      showPopUp();
      stopInterval();
    }
  });
}

// Function to show the popup
function showPopUp() {
  if (youtubeTabId !== null) {
    chrome.scripting.executeScript({
      target: { tabId: youtubeTabId },
      function: () => {
        const existingPopup = document.getElementById('youtubeProductivityPopup');
        if (existingPopup) existingPopup.remove();

        const popUpDiv = document.createElement('div');
        popUpDiv.id = 'youtubeProductivityPopup';
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
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'youtubeTimer') {
    checkTimer();
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
      stopInterval();
    }
  }
  sendResponse({});
});

// Monitor tab updates and activations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes("youtube.com") && !timerSet) {
    youtubeTabId = tab.id;
    showPopUp();
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab.url && tab.url.includes("youtube.com") && !timerSet) {
      youtubeTabId = tab.id;
      showPopUp();
    }
  });
});

// Monitor tab removal to clear timer
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === youtubeTabId) {
    youtubeTabId = null;
    timerSet = false;
    stopInterval();
  }
});
