let youtubeTabId = null;
let timerInterval = null;
let timerSet = false;
let countdownInterval = null; 
let countdownRunning = false;

let shortsLimit = 5; // Default limit
let shortsCount = 0;
let watchedShorts = new Set(); // Track watched Shorts by video ID



const API_KEY = 'AIzaSyCZydCzaWHe6WIhwCsYCkU3N2rXt77r84E';  // Replace with your YouTube API key
const unproductiveKeywords = ['funny', 'music',  'entertainment', 'comedy', 
  // 'vlog',
  'Dimple Malhan Vlogs', 'game', 'gaming', 'movie'];
let unproductiveChannels = [
 "Dimple Malhan Vlogs"
];
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

// CHECK IF DATA IS UNPRODUCTIVE BASED ON CHANNEL NAME , TITLE , DESCRP, 
function checkIfUnproductive(videoData) {
  const { title, description, channelTitle, tags, categoryId } = videoData.items[0].snippet;

  // Check for unproductive keywords in title or description
  const isUnproductiveByKeywords = unproductiveKeywords.some(keyword => 
    title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
  );

  // Check if the video is from an unproductive channel
  const isUnproductiveByChannel = unproductiveChannels.some(channel => 
    channelTitle.toLowerCase() === channel.toLowerCase()
  );

  // Check tags for unproductive content
  const isUnproductiveByTags = tags && tags.some(tag => 
    unproductiveKeywords.some(keyword => tag.toLowerCase().includes(keyword))
  );

  // Check category (example: 20 is Gaming, 24 is Entertainment)
  const unproductiveCategories = ['20', '24'];
  const isUnproductiveByCategory = unproductiveCategories.includes(categoryId);

  return isUnproductiveByKeywords || isUnproductiveByChannel || isUnproductiveByTags || isUnproductiveByCategory;
}


// Function to fetch video details using YouTube API
function fetchVideoDetails(videoId) {
  console.log(`Fetching details for video ID: ${videoId}`);
  fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet`)
    .then(response => response.json())
    .then(data => {
      console.log('Video data fetched:', data);
      if (checkIfUnproductive(data)) {
        console.log("Unproductive content detected, starting countdown.");
        startCountdownAndCloseTab();
      }
    })
    .catch(error => console.error("Error fetching video details:", error));
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

// Load shorts limit from storage
chrome.storage.sync.get(['shortsLimit'], (result) => {
  if (result.shortsLimit !== undefined) {
    shortsLimit = result.shortsLimit;
  }
});


// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.shortsLimit) {
    shortsLimit = changes.shortsLimit.newValue;
  }
});


// Check if the video is a YouTube Short
function isYouTubeShort(url) {
  return url.includes('/shorts/');
}


// Function to start countdown and close the tab
function startCountdownAndCloseTab() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdownRunning = true;
  let countdown = 3;
  
  countdownInterval = setInterval(() => {
    // console.log("hey" + countdown);
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
    // console.log("decreased by 1");
    
    if (countdown < 0) {
      clearInterval(countdownInterval);
      countdownRunning= false;
      if (youtubeTabId !== null) {
        chrome.tabs.remove(youtubeTabId);
        youtubeTabId = null;
        timerSet = false;
        shortsCount = 0; // Reset the count
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

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendVideoDetails') {
    handleVideoDetails(message.videoDetails);
  }
  sendResponse();
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



// Function to handle YouTube video details
function handleVideoDetails(videoDetails) {
  if (isYouTubeShort(videoDetails.url) && !watchedShorts.has(videoDetails.videoId)) {
    watchedShorts.add(videoDetails.videoId);
    shortsCount++;
    if (shortsCount >= shortsLimit) {
      startCountdownAndCloseTab();
    }
    if (shortsCount == 0)
      {
        startCountdownAndCloseTab();
      }
  }
}

// Monitor tab updates to detect shorts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.scripting.executeScript(
      { target: { tabId: tabId }, function: () => location.href },
      ([{ result: url }]) => {
        if (isYouTubeShort(url)) {
          youtubeTabId = tabId;
          handleVideoDetails({ url, videoId: new URL(url).pathname.split('/')[2] });
        }
      }
    );
  }
});

// // Monitor tab updates to detect unproductive content and shorts
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete') {
//     chrome.scripting.executeScript(
//       { target: { tabId: tabId }, function: () => location.href },
//       ([{ result: url }]) => {
//         if (url.includes('youtube.com/watch')) {
//           chrome.tabs.sendMessage(tabId, { action: 'fetchVideoDetails' });
//         } else if (url.includes('youtube.com/shorts')) {
//           shortsCount++;
//           if (shortsCount >= shortsLimit) {
//             youtubeTabId = tabId;
//             startCountdownAndCloseTab();
//           }
//         }
//       }
//     );
//   }
// });

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



// Monitor tab activations
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab.url && isYouTubeShort(tab.url)) {
      youtubeTabId = tab.id;
      handleVideoDetails({ url: tab.url, videoId: new URL(tab.url).pathname.split('/')[2] });
    }
  });
});

// Monitor tab removal to clear state
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === youtubeTabId) {
    youtubeTabId = null;
    countdownRunning = false;
    shortsCount = 0; // Reset the count
    watchedShorts.clear(); // Clear the watched shorts
  }
});



// Monitor tab removal to clear timer
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === youtubeTabId) {
    youtubeTabId = null;
    timerSet = false;
    stopInterval();
  }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendVideoDetails') {
    handleVideoDetails(message.videoDetails);
  }
  sendResponse();
});