document.getElementById('productiveYes').addEventListener('click', () => {
  const userMinutes = prompt("Enter how many more minutes you need:");
  if (userMinutes && !isNaN(userMinutes) && userMinutes > 0) {
    chrome.runtime.sendMessage({ action: "resetTimer", newLimit: userMinutes * 60 });
    alert(`You have ${userMinutes} more minutes.`);
    window.close();
  } else {
    alert("Please enter a valid number of minutes.");
  }
});

document.getElementById('productiveNo').addEventListener('click', () => {
  alert("Closing YouTube to help you stay productive!");
  chrome.runtime.sendMessage({ action: "closeTab" });
  window.close();
});

function updateTimeRemaining() {
  chrome.storage.local.get(['timerMinutes', 'startTime'], (result) => {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - result.startTime) / 1000; // Convert ms to seconds
    let remainingSeconds = result.timerMinutes * 60 - elapsedTime;

    // If the timer has not been set or elapsed time exceeds the specified duration, set remaining seconds to 0
    if (result.timerMinutes === undefined || elapsedTime >= result.timerMinutes * 60) {
      remainingSeconds = 0;
    }

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = Math.floor(remainingSeconds % 60);

    // Format the time string
    let timeString = '';
    if (result.timerMinutes !== undefined) {
      timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeString = '00:00:00';
    }
    
    document.getElementById('timeRemaining').textContent = timeString;
  });
}

// Update time remaining every second
setInterval(updateTimeRemaining, 1000);
updateTimeRemaining();
