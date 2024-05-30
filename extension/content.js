function showPopUp() {
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
    const userSeconds = parseInt(userMinutes) * 60;
    chrome.storage.local.set({ youtubeLimit: userSeconds }, () => {
      chrome.runtime.sendMessage({ action: "resetTimer", newLimit: userSeconds }, () => {
        alert(`You have ${userMinutes} more minutes.`);
        popUpDiv.remove();
      });
    });
  });

  document.getElementById('productiveNo').addEventListener('click', () => {
    alert("Closing YouTube to help you stay productive!");
    chrome.runtime.sendMessage({ action: "closeTab" }, () => {
      window.close();
    });
  });
}

showPopUp();
