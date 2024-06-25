let youtubeTabId = null;
let timerInterval = null;
let timerSet = false;
let countdownInterval = null; 
let countdownRunning = false;


const API_KEY = 'AIzaSyCZydCzaWHe6WIhwCsYCkU3N2rXt77r84E';  // Replace with your YouTube API key
const unproductiveKeywords = ['funny', 'music', 'entertainment', 'comedy', 'vlog', 'game'];

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
    checkContent();
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

// Function to check the content of the current YouTube video
function checkContent() {
  if (youtubeTabId !== null && !countdownRunning) {
    chrome.scripting.executeScript({
      target: { tabId: youtubeTabId },
      function: () => document.location.href,
    }, (results) => {
      if (results && results[0] && results[0].result.includes('watch')) {
        const url = new URL(results[0].result);
        const videoId = url.searchParams.get('v');
        fetchVideoDetails(videoId);
      }
    });
  }
}

// Function to fetch video details using YouTube API
function fetchVideoDetails(videoId) {
  console.log(`Fetching details for video ID: ${videoId}`);
  fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet`)
    .then(response => response.json())
    .then(data => {
      console.log('Video data fetched:', data);
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        const title = video.snippet.title.toLowerCase();
        const description = video.snippet.description.toLowerCase();
        const category = video.snippet.categoryId; // Use category if needed

        // Check for unproductive keywords
        const isUnproductive = unproductiveKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );

        if (isUnproductive) {
          console.log('Unproductive content detected, starting countdown.');
          startCountdownAndCloseTab();
        } else {
          console.log('Productive content detected, no action taken.');
        }
      }
    })
    .catch(error => console.error('Error fetching video details:', error));
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

// Function to start countdown and close the tab
function startCountdownAndCloseTab() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdownRunning = true;
  let countdown = 3;
  
  countdownInterval = setInterval(() => {
    console.log("hey" + countdown);
    if (youtubeTabId !== null) {
      chrome.scripting.executeScript({
        target: { tabId: youtubeTabId },
        function: (countdown) => {          
          const countdownDiv = document.getElementById('countdownDiv');
          if (!countdownDiv) {
            const div = document.createElement('div');
            div.id = 'countdownDiv';
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.width = '100%';
            div.style.height = '100%';
            div.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            div.style.color = 'white';
            div.style.zIndex = '10000';
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.justifyContent = 'center';
            div.style.alignItems = 'center';
            div.style.fontSize = '48px';
            document.body.appendChild(div);

            const text = document.createElement('div');
            text.id = 'countdownText';
            text.textContent = countdown;
            div.appendChild(text);
          } else {
            const text = document.getElementById('countdownText');
            text.textContent = countdown;
          }
        },
        args: [countdown]
      });
    }
    
    countdown -= 1;    
    console.log("decreased by 1");
    
    if (countdown < 0) {
      clearInterval(countdownInterval);
      countdownRunning= false;
      if (youtubeTabId !== null) {
        chrome.tabs.remove(youtubeTabId);
        youtubeTabId = null;
        timerSet = false;
        stopInterval();
      }
    }
  }, 1000);
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
