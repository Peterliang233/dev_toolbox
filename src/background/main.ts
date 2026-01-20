/// <reference types="chrome" />

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "popup/index.html" });
});
