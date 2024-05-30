document.getElementById('resetTimerButton').addEventListener('click', () => {
    chrome.storage.local.set({ youtubeLimit: 0 }, () => {
      alert('YouTube usage timer has been reset.');
    });
  });
  