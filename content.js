// Empêche l'injection multiple
if (!window.__requestLoggerInjected) {
  window.__requestLoggerInjected = true;

  const nativeWords = ["sd", "euidlls", "fra", "evariant","ss"]; // Liste des mots natifs
  var popupPosition = "bottom-left"; // état initial
  // Supprime l'encadré existant s'il y en a un
  const existingBox = document.getElementById("request-logger");
  if (existingBox) {
    existingBox.remove();
  }

  console.log("Content script injecté");

  window.openDetails = window.openDetails || new Set();
  window.openNative = window.openNative || new Set();
  // Création de l'encadré
  const box = document.createElement("div");
  box.id = "request-logger";
  box.style.position = "fixed";
  box.style.bottom = "10px";
  box.style.right = "10px";
  box.style.width = "400px";
  box.style.maxHeight = "300px";
  box.style.overflowY = "auto";
  box.style.backgroundColor = "white";
  box.style.border = "1px solid #ccc";
  box.style.padding = "10px";
  box.style.zIndex = "9999";
  box.style.fontSize = "12px";
  box.style.fontFamily = "monospace";

  box.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <strong>Requêtes détectées :</strong>
      <div style="justify-content:flex-end;  align-items: right;">
      <button id="move-left" style="background:none;border:none;font-size:16px;cursor:pointer;">⬅️</button>
      <button id="move-right" style="background:none;border:none;font-size:16px;cursor:pointer;">➡️</button>
      
      <button id="close-box" style="background: none; border: none; font-size: 16px; cursor: pointer;">✖</button>
    </div>
      </div>
    
    <ul id="log-list"></ul>
    <button id="clear-logs" style="margin-bottom: 10px;">🗑️ Vider les logs</button>
    <div style="display: flex; justify-content: space-between; align-items: center;">
</div>
  `;

  document.body.appendChild(box);
  chrome.storage.local.set({ popupVisible: true });

  document.getElementById("clear-logs").addEventListener("click", () => {
    chrome.storage.local.set({ logs: [] }, () => {
      console.log("Logs effacés");
      updateLogs();
    });
  });

  document.getElementById("close-box").addEventListener("click", () => {
    box.remove();
    window.__requestLoggerInjected = false;
    clearInterval(window.requestLoggerInterval);
    chrome.storage.local.set({ popupVisible: false });
  });
document.getElementById("move-left").addEventListener("click", () => {
  if (popupPosition !== "left") {
   // box.style.top = "";
    box.style.bottom = "10px";
    box.style.left = "10px";
    box.style.right = "";
  //  box.style.transform = "translateY(0%)";
    popupPosition = "left";
  }
});

document.getElementById("move-right").addEventListener("click", () => {
  if (popupPosition !== "right") {
    //box.style.top = "";
    box.style.bottom = "10px";
    box.style.left = "";
    box.style.right = "10px";
  // box.style.transform = "translateY(0%)";
    popupPosition = "right";
  }
});
  function updateLogs() {
    chrome.storage.local.get({ logs: [] }, function (result) {
      const list = document.getElementById("log-list");
      if (!list) return;
      list.innerHTML = "";
      const totalLogs = result.logs.length;

      result.logs.slice(-10).reverse().forEach((log, index) => {
        const li = document.createElement("li");
        const logId = `${log.time}-${index}`;
        const typeLink = document.createElement("a");
        typeLink.href = "#";
        const realIndex = totalLogs - 2 - index + 1;
        typeLink.textContent = log.type + ` # ${realIndex + 1}` ;//+ (log.consentType ? ` - ${log.consentType}` : "");
        typeLink.style.cursor = "pointer";
        typeLink.style.color = "#007bff";
        typeLink.style.textDecoration = "underline";

        const details = document.createElement("div");
        details.style.marginTop = "5px";
        details.style.paddingLeft = "10px";
        details.style.fontSize = "11px";
        details.style.color = "#333";
        details.style.display = window.openDetails.has(logId) ? "block" : "none";

        try {
          const urlObj = new URL(log.url);
          const baseUrl = `${urlObj.origin}${urlObj.pathname}`;
          const params = Array.from(urlObj.searchParams.entries());
          const type = log.type;
          const consentType = log.consentType;

          let html = `<strong>URL :</strong> ${baseUrl}<br>`;
          html += `<strong>Type :</strong> ${type}<br>`;
          html += consentType ? `<strong>Consentement :</strong> ${consentType}<br>` : "";

          if (params.length > 0) {
            html += `<strong>Paramètres :</strong><br>`;

            const mappedParams = params.map(([key, value]) => {
              if (key.startsWith("actp") && key.includes("n")) {
                const pattern = /p(\d+)n(\d+)/;
                const match1 = key.match(pattern);
                const index1 = parseInt(match1[1], 10);
                const index2 = parseInt(match1[2], 10);
                const valueKey = `actp${index1}v${index2}`;
                const valueParam = urlObj.searchParams.get(valueKey);
                if (valueParam) {
                  return `${value} = ${decodeURIComponent(valueParam)}`;
                }
              }
              if (key.startsWith("eisk")) {
                const pattern2 = /k(\d+)/;;
                const match2 = key.match(pattern2);
                const index3 = parseInt(match2[1], 10);
                const valueKey2 = `eisd${index3}`;
                const valueParam2 = urlObj.searchParams.get(valueKey2);
                if (valueParam2) {
                  return `${value} = ${decodeURIComponent(valueParam2)}`;
                }
              }
              if (key.startsWith("eisd")) return;
              if (key.startsWith("actp") && key.includes("v")) return;
              if (key === "actl0") return `action_label = ${decodeURIComponent(value)}`;
              //if (key.startsWith("type") && value.includes("ev")) { return;};
              if (key === "pglbl") return `page_label = ${decodeURIComponent(value)}`;
              if (key === "pggrp") return `page_group = ${decodeURIComponent(value)}`;
              if (key === "actn0") return `action_name = ${decodeURIComponent(value)}`;
              if (key === "eise") return `moteur de recherche = ${decodeURIComponent(value)}`;

              return `${key} = ${decodeURIComponent(value)}`;
            });

            const normalParams = [];
            const nativeParams = [];

            mappedParams
              .filter((param) => param && param.trim() !== "")
              .forEach((param) => {
                const [keyPart, valPart] = param.split("=");
                const keyTrimmed = keyPart.trim();
                if (nativeWords.includes(keyTrimmed)) {
                  nativeParams.push(`<span style="color:#d9534f;">${keyTrimmed}</span> = <span style="color:#5bc0de;">${valPart}</span>`);
                } else {
                  normalParams.push(`<span style="color:#007bff;">${keyTrimmed}</span> = <span style="color:#5bc0de;">${valPart}</span>`);
                }
              });

            html += normalParams.join("<br>");
            if (nativeParams.length > 0) {
             
  html += `<br><a href="#" id="toggle-native" data-logid="${logId}">#Afficher les paramètres natifs</a>`;
//html += `<div id="native-params" data-logid="${logId}" style="display:none; margin-top:5px;">${nativeParams.join("<br>")}</div>`;
const nativeDivVisible = window.openNative.has(logId);
html += `<div id="native-params" data-logid="${logId}" style="display:${nativeDivVisible ? "block" : "none"}; margin-top:5px;">${nativeParams.join("<br>")}</div>`;



            }
          } else {
            html += `<em>Aucun paramètre</em>`;
          }

          details.innerHTML = html;


        } catch (e) {
          details.innerHTML = `<em>Erreur de parsing de l'URL</em>`;
        }
          const toggleLink = details.querySelector(`#toggle-native[data-logid="${logId}"]`);
          if (toggleLink) { 
            toggleLink.addEventListener("click", (ev) => {
              ev.preventDefault();
              
              const logIdAttr = toggleLink.getAttribute('data-logid');
              const nativeDiv = details.querySelector(`#native-params[data-logid="${logIdAttr}"]`);
              //const nativeDiv = details.querySelector(`#native-params-${logId}`);
              if (!nativeDiv) return;

                const isOpen = window.openNative.has(logIdAttr);
                if (isOpen) {
                  window.openNative.delete(logIdAttr);
                  nativeDiv.style.display = "none";
                } else {
                  window.openNative.add(logIdAttr);
                  nativeDiv.style.display = "block";
                }
             
            });
          }
        typeLink.addEventListener("click", (e) => {
          e.preventDefault();
          if (window.openDetails.has(logId)) {
            window.openDetails.delete(logId);
            details.style.display = "none";
          } else {
            window.openDetails.add(logId);
            details.style.display = "block";  
          }
        });

        li.appendChild(typeLink);
        li.appendChild(details);
        list.appendChild(li);
      });
    });
  }

  if (window.requestLoggerInterval) {
    clearInterval(window.requestLoggerInterval);
  }
  window.requestLoggerInterval = setInterval(updateLogs, 1000);
}
