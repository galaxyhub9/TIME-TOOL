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
    const elapsedTime = (currentTime - result.startTime) / 60000; // Convert ms to minutes
    const remainingTime = result.timerMinutes - elapsedTime;
    document.getElementById('timeRemaining').textContent = `${Math.max(remainingTime.toFixed(2), 0)} minutes`;
  });
}

// Update time remaining every second
setInterval(updateTimeRemaining, 1000);
updateTimeRemaining();
