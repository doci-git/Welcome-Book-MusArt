document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  // Utili per performance e intelligenza
  const STOPWORDS_IT = new Set([
    "il","lo","la","i","gli","le","un","una","uno","di","dei","degli","delle",
    "del","della","dell","dallo","dalla","dall","da","a","al","alla","all","ai",
    "agli","alle","in","nel","nella","nell","nei","nelle","con","su","per","tra",
    "fra","che","come","dove","quando","cosa","cos","mi","ti","si","ci","vi","su",
    "e","ed","ma","o","oppure","anche","non","piu","più","meno","di","dei","degli",
    "questo","questa","questi","queste","quello","quella","quelli","quelle","qui","qua",
    "li","lì","là","io","tu","lui","lei","noi","voi","loro","perche","perché",
    "grazie","prego","vorrei","potrei","posso","serve","servono","info","informazioni"
  ]);
  const STOPWORDS_EN = new Set([
    "the","a","an","and","or","but","if","then","else","of","for","to","in","on",
    "at","by","with","from","as","that","this","those","these","is","are","am","be",
    "was","were","do","does","did","can","could","should","would","how","what","where",
    "when","why","please","thanks","thank","you","me","my","your","our","their","it"
  ]);

  const normalizeText = (t) =>
    t
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  const tokenize = (t) => {
    const n = normalizeText(t);
    return n
      .split(" ")
      .filter((w) => w && !STOPWORDS_IT.has(w) && !STOPWORDS_EN.has(w));
  };

  // Similarità Levenshtein normalizzata (0..1)
  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = dp[j];
        dp[j] = Math.min(
          dp[j] + 1,
          dp[j - 1] + 1,
          prev + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
        prev = tmp;
      }
    }
    return dp[n];
  }

  const sim = (a, b) => {
    if (!a || !b) return 0;
    const na = normalizeText(a);
    const nb = normalizeText(b);
    const d = levenshtein(na, nb);
    return 1 - d / Math.max(na.length, nb.length);
  };

  // Carica le risposte dal file JSON (una sola volta)
  fetch("chatbot/responses.json")
    .then((response) => response.json())
    .then((data) => {
      // Preindex parole chiave normalizzate per performance
      const indexed = Object.entries(data.parole_chiave || {}).map(
        ([intent, list]) => ({
          intent,
          keys: (list || []).map((k) => normalizeText(k)),
        })
      );

      const findBestIntent = (message) => {
        const msgNorm = normalizeText(message);
        const msgTokens = tokenize(message);
        if (!msgNorm) return null;

        let best = { intent: null, score: 0 };

        for (const { intent, keys } of indexed) {
          // match esatto/parziale veloce
          let localMax = 0;
          for (const k of keys) {
            if (!k) continue;
            if (msgNorm.includes(k)) {
              localMax = Math.max(localMax, Math.min(1, 0.95 + k.length / 100));
              continue;
            }
            // confronto fuzzy su token principali
            for (const tok of msgTokens) {
              const s = sim(tok, k);
              if (s > localMax) localMax = s;
            }
          }
          if (localMax > best.score) best = { intent, score: localMax };
        }

        // soglia regolabile: 0.78 buono per IT/EN brevi
        return best.score >= 0.78 ? best.intent : null;
      };

      const disableInput = (disabled) => {
        sendBtn.disabled = disabled;
        userInput.disabled = disabled;
      };

      // Quick replies: intent predefiniti per risposta immediata
      const QUICK_REPLIES = [
        { intent: "blind", label: "Shutters" },
        { intent: "coffy", label: "Coffee" },
        { intent: "photo", label: "Tram" },
        { intent: "lugg", label: "Luggage" },
        { intent: "wifi", label: "Wi-Fi" },
        { intent: "checkout", label: "Check-out" },
        { intent: "taxi", label: "Taxi" },
        { intent: "ticket", label: "Ticket" },
        { intent: "hot", label: "Hot Water" },
        { intent: "tap", label: "Tap Water" },
        { intent: "city", label: "City Guide" },
        { intent: "resta", label: "Restaurants" },
        { intent: "other", label: "Other" },
        { intent: "shower", label: "Switch Shower" }
      ];

      function respondWithIntent(intent, label) {
        const resp = data.risposte[intent] || data.risposte["default"];
        disableInput(true);
        if (label) appendMessage(label, "user");
        setTimeout(() => {
          handleResponse(resp);
          disableInput(false);
        }, 200);
      }

      function renderQuickReplies() {
        let container = document.getElementById("quick-replies");
        if (!container) {
          // crea placeholder se non presente
          container = document.createElement("div");
          container.id = "quick-replies";
          container.className = "quick-replies";
          const parent = document.querySelector(".chat-container");
          const header = parent?.querySelector(".chat-header");
          if (parent && header) parent.insertBefore(container, header.nextSibling);
        }
        container.innerHTML = "";
        const heading = document.createElement("div");
        heading.className = "quick-replies-heading";
        heading.textContent = "Here What You Can Ask Me:";
        container.appendChild(heading);
        QUICK_REPLIES.forEach(({ intent, label }) => {
          if (!data.risposte[intent]) return; // mostra solo intent disponibili
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "quick-reply";
          btn.textContent = label;
          btn.addEventListener("click", () => respondWithIntent(intent, label));
          container.appendChild(btn);
        });
      }

      sendBtn.addEventListener("click", () => {
        sendMessage(data, findBestIntent);
      });

      userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage(data, findBestIntent);
        }
      });

      // Render iniziale delle scelte veloci
      renderQuickReplies();

      // Mostra un messaggio guida al primo apertura chat
      const toggleChatBtn = document.getElementById("toggle-chat");
      const chatContainer = document.querySelector(".chat-container");
      let greeted = false;
      if (toggleChatBtn && chatContainer) {
        toggleChatBtn.addEventListener("click", () => {
          chatContainer.classList.toggle("hidden");
          if (!chatContainer.classList.contains("hidden") && !greeted) {
            appendMessage("Click one of the options or write it", "bot");
            greeted = true;
          }
        });
      }

      function sendMessage(dataObj, intentFinder) {
        const userTextRaw = userInput.value;
        const userText = userTextRaw.trim();
        if (userText === "") return;

        disableInput(true);

        // Salva la domanda dell'utente
        saveUserQuestion(userText);

        // Mostra il messaggio dell'utente (sanitized)
        appendMessage(userText, "user");

        // Trova intenzione migliore (fuzzy + normalizzazione)
        const key = intentFinder(userText) || null;

        const botResponse = key ? dataObj.risposte[key] : dataObj.risposte["default"];

        // Mostra la risposta del bot
        setTimeout(() => {
          handleResponse(botResponse);
          disableInput(false);
        }, 300);

        // Pulisci l'input
        userInput.value = "";
      }

      function handleResponse(response) {
        if (!response) return;
        switch (response.type) {
          case "text": {
            simulateTyping(response, "bot");
            break;
          }
          case "image": {
            appendImage(response.content, "bot");
            break;
          }
          case "video": {
            appendVideo(response.content, "bot");
            break;
          }
          case "link": {
            appendLink(response.content, response.url, "bot");
            break;
          }
          case "textWithLink": {
            appendTextWithLink(response.text, response.link, "bot");
            break;
          }
          default: {
            // Consenti anche ad oggetti senza type ma con content
            simulateTyping(response, "bot");
          }
        }
      }

      // Funzione per aggiungere testo + link cliccabile
      function appendTextWithLink(text, link, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);

        const textElement = document.createElement("p");
        textElement.textContent = String(text || "");

        const linkElement = document.createElement("a");
        linkElement.href = link.url;
        linkElement.textContent = link.displayText;
        linkElement.target = "_blank";
        linkElement.rel = "noopener noreferrer";
        linkElement.style.color = "#007bff";
        linkElement.style.textDecoration = "underline";

        messageElement.appendChild(textElement);
        messageElement.appendChild(linkElement);
        chatBox.appendChild(messageElement);

        chatBox.scrollTop = chatBox.scrollHeight;
      }

      function appendMessage(text, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        const p = document.createElement("p");
        p.textContent = String(text || "");
        messageElement.appendChild(p);
        chatBox.appendChild(messageElement);

        chatBox.scrollTop = chatBox.scrollHeight;
      }

      function appendImage(url, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Immagine";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        messageElement.appendChild(img);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      function appendVideo(url, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        messageElement.innerHTML = `<iframe width="100%" height="315" src="${url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      function appendLink(text, url, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender);
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = String(text || url);
        messageElement.appendChild(a);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      function simulateTyping(response, sender) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", sender, "typing");
        chatBox.appendChild(messageElement);

        // Supporta anche array di stringhe come content
        const contentRaw = Array.isArray(response.content)
          ? response.content.join("\n")
          : response.content ?? "";
        const content = String(contentRaw);

        let index = 0;
        // Velocità adattiva: più veloce per messaggi lunghi
        const speed = Math.max(15, Math.min(35, Math.floor(2000 / (content.length + 20))));
        const typingInterval = setInterval(() => {
          if (index < content.length) {
            messageElement.textContent = content.slice(0, index + 1);
            index++;
            chatBox.scrollTop = chatBox.scrollHeight;
          } else {
            clearInterval(typingInterval);
            messageElement.classList.remove("typing");
          }
        }, speed);
      }
    })
    .catch((error) => {
      console.error("Errore nel caricamento delle risposte:", error);
    });

  // Persistenza semplice delle domande
  function saveUserQuestion(question) {
    try {
      const saved = JSON.parse(localStorage.getItem("userQuestions")) || [];
      saved.push(String(question));
      localStorage.setItem("userQuestions", JSON.stringify(saved));
      console.log("Domanda salvata:", question);
    } catch (_) {
      // Ignora errori di storage
    }
  }

  function showSavedQuestions() {
    const savedQuestions = JSON.parse(localStorage.getItem("userQuestions")) || [];
    console.log("Domande salvate:", savedQuestions);

    const box = document.getElementById("chatbot-box");
    if (!box) return;
    box.innerHTML = "";
    savedQuestions.forEach((question, index) => {
      const messageElement = document.createElement("div");
      messageElement.classList.add("chatbot-message", "user");
      const p = document.createElement("p");
      p.textContent = `${index + 1}. ${String(question)}`;
      messageElement.appendChild(p);
      box.appendChild(messageElement);
    });
  }
});

// Gestito dentro DOMContentLoaded per poter usare appendMessage
