document.addEventListener('DOMContentLoaded', () => {
    const newKeywordInput = document.getElementById('newKeyword');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const keywordsList = document.getElementById('keywordsList');
    const newChannelInput = document.getElementById('newChannel');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelsList = document.getElementById('channelsList');
    const shortsLimitInput = document.getElementById('shortsLimit');
    const setShortsLimitBtn = document.getElementById('setShortsLimitBtn');
  
    // Load saved options
    chrome.storage.sync.get(['unproductiveKeywords', 'unproductiveChannels', 'shortsLimit'], (result) => {
      if (result.unproductiveKeywords) {
        result.unproductiveKeywords.forEach(keyword => {
          addKeywordToList(keyword);
        });
      }
      if (result.unproductiveChannels) {
        result.unproductiveChannels.forEach(channel => {
          addChannelToList(channel);
        });
      }
      if (result.shortsLimit) {
        shortsLimitInput.value = result.shortsLimit;
      }
    });
    // Add new keyword
    addKeywordBtn.addEventListener('click', () => {
      const keyword = newKeywordInput.value.trim().toLowerCase();
      if (keyword) {
        addKeywordToList(keyword);
        saveKeywords();
        newKeywordInput.value = '';
      }
    });
  
    // Add new channel
    addChannelBtn.addEventListener('click', () => {
      const channel = newChannelInput.value.trim();
      if (channel) {
        addChannelToList(channel);
        saveChannels();
        newChannelInput.value = '';
      }
    });
  
    // Set timer duration
    setTimerBtn.addEventListener('click', () => {
      const minutes = parseInt(timerDurationInput.value);
      if (minutes && minutes > 0) {
        chrome.storage.sync.set({ timerDuration: minutes * 60 });
        alert(`Timer duration set to ${minutes} minutes.`);
      } else {
        alert('Please enter a valid number of minutes.');
      }
    });
  
    // Add keyword to list
    function addKeywordToList(keyword) {
      const li = document.createElement('li');
      li.textContent = keyword;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.style.marginLeft = '10px';
      removeBtn.addEventListener('click', () => {
        li.remove();
        saveKeywords();
      });
      li.appendChild(removeBtn);
      keywordsList.appendChild(li);
    }
  
    // Add channel to list
    function addChannelToList(channel) {
      const li = document.createElement('li');
      li.textContent = channel;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.style.marginLeft = '10px';
      removeBtn.addEventListener('click', () => {
        li.remove();
        saveChannels();
      });
      li.appendChild(removeBtn);
      channelsList.appendChild(li);
    }
  
    // Save keywords to storage
    function saveKeywords() {
      const keywords = [];
      keywordsList.querySelectorAll('li').forEach(li => {
        keywords.push(li.textContent.replace('Remove', '').trim());
      });
      chrome.storage.sync.set({ unproductiveKeywords: keywords });
    }
  
    // Save channels to storage
    function saveChannels() {
      const channels = [];
      channelsList.querySelectorAll('li').forEach(li => {
        channels.push(li.textContent.replace('Remove', '').trim());
      });
      chrome.storage.sync.set({ unproductiveChannels: channels });
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Load the current shorts limit
    chrome.storage.sync.get(['shortsLimit'], (result) => {
      if (result.shortsLimit !== undefined) {
        document.getElementById('shortsLimit').value = result.shortsLimit;
      }
    });
  
    // Save the new shorts limit
    document.getElementById('setShortsLimitBtn').addEventListener('click', () => {
      const shortsLimit = parseInt(document.getElementById('shortsLimit').value, 10);
      if (!isNaN(shortsLimit) && shortsLimit >= 0) {
        chrome.storage.sync.set({ shortsLimit }, () => {
          alert('Shorts limit saved');
        });
      } else {
        alert('Please enter a valid number');
      }
    });
  });
  
  