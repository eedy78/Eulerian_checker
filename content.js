
// Empêche l'injection multiple
if (!window.__requestLoggerInjected) {
  window.__requestLoggerInjected = true;

  // Supprime l'encadré existant s'il y en a un
  const existingBox = document.getElementById("request-logger");
  if (existingBox) {
    existingBox.remove();
  }

  console.log("Content script injecté");

  // Mémorise les logs ouverts
  window.openDetails = window.openDetails || new Set();

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
      <button id="close-box" style="background: none; border: none; font-size: 16px; cursor: pointer;">✖</button>
    </div>
    <button id="clear-logs" style="margin-bottom: 10px;">🗑️ Vider les logs</button>
    <ul id="log-list"></ul>
  `;

  document.body.appendChild(box);
chrome.storage.local.set({ popupVisible: true });
  // Bouton pour vider les logs
  document.getElementById("clear-logs").addEventListener("click", () => {
    chrome.storage.local.set({ logs: [] }, () => {
      console.log("Logs effacés");
      updateLogs();
    });
  });

  // Bouton pour fermer l'encadré
  document.getElementById("close-box").addEventListener("click", () => {
    box.remove();
    window.__requestLoggerInjected = false;
    clearInterval(window.requestLoggerInterval);
      chrome.storage.local.set({ popupVisible: false });
  });

  // Fonction pour mettre à jour les logs
  function updateLogs() {
    chrome.storage.local.get({ logs: [] }, function(result) {
      const list = document.getElementById("log-list");
      if (!list) return;
      list.innerHTML = "";
      const totalLogs = result.logs.length;
      result.logs.slice(-10).reverse().forEach((log, index) => {
        const li = document.createElement("li");
        const logId = `${log.time}-${index}`;
        const typeLink = document.createElement("a");
        typeLink.href = "#";
        const realIndex = totalLogs -2- index + 1;
        typeLink.textContent = log.type + ` # ${realIndex + 1}`+ (log.consentType ? ` - ${log.consentType}` : "");
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
        html += consentType ? `<strong>Consentement :</strong> ${consentType}<br>` : '';

if (params.length > 0) {
    html += `<strong>Paramètres :</strong><br>`;

    // Mapping personnalisé
    const mappedParams = params.map(([key, value]) => {
        // Cas spécifiques
        if (key.startsWith('actp') && key.includes('n')) {
            // Extraire l'index X
            
            const pattern = /p(\d+)n(\d+)/;

            //Pour la première valeur
            const match1 = key.match(pattern);
            const index1 = parseInt(match1[1], 10); // 1
            const index2 = parseInt(match1[2],10);
            

            //const nameKey = value;
            const valueKey = `actp${index1}v${index2}`;
            //console.log(value, valueKey);
            // Vérifier si ces clés existent dans l'URL
            //const nameParam = urlObj.searchParams.get(nameKey);
            const valueParam = urlObj.searchParams.get(valueKey);

            if ( valueParam) {
                return `${value} = ${decodeURIComponent(valueParam)}`;
            }
        }
        if (key.startsWith('actp') && key.includes('v')) {
          return;}

        if (key === 'actl0') {
            return `action_label = ${decodeURIComponent(value)}`;
        }

        if (key === 'actn0') {
            return `action_name = ${decodeURIComponent(value)}`;
        }

        // Par défaut : garder tel quel
        return `${key} : ${decodeURIComponent(value)}`;
    });
html += mappedParams
    .filter(param => param != null && param.toString().trim() !== '') // garde uniquement les valeurs non nulles et non vides
    .join('<br>');

} else {
    html += `<em>Aucun paramètre</em>`;
}

details.innerHTML = html;
        } catch (e) {
          details.innerHTML = `<em>Erreur de parsing de l'URL</em>`;
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
  
  // Mise à jour régulière
  if (window.requestLoggerInterval) {
    clearInterval(window.requestLoggerInterval);
  }
  window.requestLoggerInterval = setInterval(updateLogs, 1000);
}
