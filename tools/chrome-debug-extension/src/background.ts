// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

function registerEventHandlers(): void {
  const windowId: number = -1;

  chrome.browserAction.onClicked.addListener(function(tab) {
    // No tabs or host permissions needed!
    console.log("Turning " + tab.url + " blue!");
    if (tab && tab.id) {
      chrome.tabs.executeScript(tab.id, {
        code: "document.body.style.backgroundColor='blue';"
        // code: "window.addEventListener('message', (event) => { console.log('red'); }, false);"
        // code: "document.body.style.backgroundColor=\"red\";  window.addEventListener(\"message\", (event) => { if (event.source != window) { return; } chrome.runtime.sendMessage(event.data); }, false);"
        // code: 'setInterval(() => chrome.runtime.sendMessage({ eventType: "eventsSent" }), 1000)'
        // code: 'document.body.style.backgroundColor="red"'
        //file: '/scripts/pageScript.js'
      }, _=>{
        let e = chrome.runtime.lastError;
        if(e !== undefined){
          console.log(tab.id, _, e);
        }
      });
    }
  });

  // chrome.tabs.query({currentWindow: true, active: true}, (tabs: chrome.tabs.Tab[]) => {
  //   console.log(tabs);
  //   if (tabs && tabs.length > 0 && tabs[0].id) {
  //     chrome.tabs.executeScript({ code: 'document.body.style.backgroundColor = "orange"' });
    
  //     // chrome.scripting.executeScript({
  //     //   target: { tabId: tabs[0].id },
  //     //   function: pageScript
  //     // });
  //   }
  // });

  // chrome.action.onClicked.addListener((tab) => {
  //   if (tab && tab.id) {
  //     chrome.scripting.executeScript({
  //       target: { tabId: tab.id },
  //       function: pageScript
  //     });
  //   }
  // });

  // Configure the browser action (the button next to the address bar registered in manifest.json) to
  // open the popup when clicked.
  chrome.browserAction.onClicked.addListener((tab) => {
    // Launch the popup
    chrome.windows.update(windowId, { focused: true }, () => {
      if (chrome.runtime.lastError) {
        chrome.windows.create({
          url: "pages/popup.html",
          type: "popup",
          focused: true,
          width: 750,
          height: screen.height
        });
      }
    });
  });
}

// Self running code
(() => {
  registerEventHandlers();
})();
