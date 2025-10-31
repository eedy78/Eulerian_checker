
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    chrome.storage.local.get("popupVisible", (data) => {
      if (data.popupVisible) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content.js"]
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message) => {
  console.log("Message reçu :", message);
  chrome.storage.local.get({ logs: [] }, (result) => {
    const logs = result.logs;
    logs.push({
      url: message.url,
      type: message.type,
      payload: message.payload,
      time: new Date().toISOString()
    });
    chrome.storage.local.set({ logs });
  });
});

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    try {
      const url = new URL(details.url);
      const params = new URLSearchParams(url.search);
      let type = null;
      let consentType = null;
      

    console.log("Méthode :", details.method);
    console.log("Méthode :", details.type);
    console.log("requestBody :", details.requestBody);


    console.log("Service worker actif");
      if ((url.href.includes("misc"))) {
        type = "consent_TAC";
        if (details.requestBody && details.requestBody.raw && details.requestBody.raw.length > 0) {
          consentType = "accept";
          const decoder = new TextDecoder("utf-8");
          const bodyText = decoder.decode(details.requestBody.raw[0].bytes);
          const params_consent = new URLSearchParams(bodyText);
          if (params_consent.has('gdpr_consent')) {     
            consentType = "accept";
            const gdpr = params_consent.get('gdpr_consent');
            if (gdpr === "CPjTJ1aPjTJ1aOhAAAENCZCgAAAAAAAAAAAADOwAQDOgAAAA.YAAAAAAAAAA") {
              consentType = "accept";
        } else if (gdpr === "CPjTJ1aPjTJ1aOhAAAENCZCgAAAAAAAAAAAAAAAAAAAA.YAAAAAAAAAA") {
          consentType = "refuse";
        } else {
          consentType = "other";
        }}}
      } else if (url.href.includes("action")&params.has('euidlls')) {
        type = "action";
      } else if (url.href.includes("/col")&(url.href.includes("euidlls"))) {
        type = "pageview";
      }

      if (type) {
        
        chrome.storage.local.get({ logs: [] }, function(result) {
          const logs = result.logs;
          
          logs.push({
            url: url.href,
            type,
            consentType,
            time: new Date().toISOString()
          });
          chrome.storage.local.set({ logs });
        });
      }
    } catch (e) {
      console.error("Error processing request:", e);
    }
  },
  { urls: ["<all_urls>"] }
);