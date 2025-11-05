# 🧩 Eulerian Checker – Extension Chrome

**Eulerian Checker** est une extension Chrome développée pour analyser en temps réel les requêtes réseaux de la solution Eulerian Analytics envoyées par un site web.  
Elle permet aux développeurs et web analysts de visualiser, directement dans la page, les appels envoyés le domaine de collecte Eulerian d'un site internet.

---

## ⚙️ Fonctionnalités principales

### 🔍 Surveillance automatique des requêtes
- Analyse en temps réel **toutes les requêtes HTTP sortantes** du navigateur.  
- Détection automatique de types d’événements :
  - `consentement`
  - `action`
  - `pageview`
  - `event`
- Journalisation des appels détectés dans le **stockage local Chrome**.

### 🧾 Interface d’inspection intégrée
- Affichage d’une popup flottante dans la page contenant la liste des requêtes détectées.  
- Consultation des **paramètres décodés** d’une requête (clé/valeur).  
- Identification visuelle des **paramètres “natifs”** (mis en évidence en rouge).  
- Possibilité d’**afficher/masquer** les paramètres natifs.  
- Navigation entre les derniers logs et suppression rapide des données via un bouton 🗑️.

### 💡 Comportement intelligent
- L’encadré reste visible lors des rechargements de page si activé.  
- Déclenchement automatique à chaque chargement complet de page.  
- Stockage des logs localement et rafraîchissement automatique toutes les secondes (pour capter les events)

---

## 🛠️ Architecture

| Fichier | Rôle |
|----------|------|
| **`background.js`** | Surveille le trafic réseau via `chrome.webRequest`. Détecte et catégorise les requêtes selon leur structure (Eulerian, consentement, etc.), puis enregistre les logs. |
| **`content.js`** | Injecte une interface graphique sur la page, affiche les logs et permet leur consultation ou suppression. Gère les interactions utilisateur et la mise à jour dynamique des données. |

---

## 📸 Aperçu (exemple)

\`\`\`text
Requêtes détectées :
- consentement_TCFV2 #1
  URL : https://collect.eule.../misc
  Consentement : accepter
  Paramètres :
  gdpr_consent = CPjTJ1aPjTJ1aOhAAAENCZCg...
--------------------------------------------
- action #2
  URL : https://collect.eule.../action
  Paramètres :
  actn0 = button_click
  actl0 = CTA_download
\`\`\`

<p style="align=center">
  <img src="./assets/capture1.png" alt="Aperçu de l’extension" width="600">
</p>

---

## 🔧 Installation

1. Télécharger ou cloner ce dépôt.
2. Ouvrir `chrome://extensions/` dans votre navigateur.
3. Activer le **Mode développeur**.
4. Cliquer sur **Charger l’extension non empaquetée**.
5. Sélectionner le dossier contenant le projet.

---

## 🧠 À savoir

- Cette extension ne collecte **aucune donnée personnelle** ni ne transmet d’informations à des serveurs externes.  
- Les logs sont stockés localement dans `chrome.storage.local`.
- Compatible avec **Manifest V3**.
