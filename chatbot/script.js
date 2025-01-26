document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");

  // Carica le risposte dal file JSON
  fetch("chatbot/responses.json")
    .then((response) => response.json())
    .then((data) => {
      console.log("Risposte caricate:", data); // Verifica che i dati siano corretti

      sendBtn.addEventListener("click", () => {
        sendMessage(data);
      });

      userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendMessage(data);
        }
      });
    })
    .catch((error) => {
      console.error("Errore nel caricamento delle risposte:", error);
    });

  // Cambia tema

  function sendMessage(data) {
    const userText = userInput.value.trim().toLowerCase();
    if (userText === "") return;

    // Salva la domanda dell'utente
    saveUserQuestion(userText);

    // Mostra il messaggio dell'utente
    appendMessage(userText, "user");

    // Cerca una parola chiave nel messaggio
    const parolaChiave = trovaParolaChiave(userText, data.parole_chiave);

    // Ottieni la risposta del bot
    const botResponse = parolaChiave
      ? data.risposte[parolaChiave]
      : data.risposte["default"];

    // Mostra la risposta del bot
    setTimeout(() => {
      handleResponse(botResponse);
    }, 500);

    // Pulisci l'input
    userInput.value = "";
  }

  function trovaParolaChiave(messaggio, paroleChiave) {
    for (const [chiave, valori] of Object.entries(paroleChiave)) {
      for (const parola of valori) {
        if (messaggio.includes(parola)) {
          return chiave; // Restituisce la chiave associata alla parola trovata
        }
      }
    }
    return null; // Nessuna parola chiave trovata
  }

  function handleResponse(response) {
    switch (response.type) {
      case "text":
        simulateTyping(response, "bot");
        break;
      case "image":
        appendImage(response.content, "bot");
        break;
      case "video":
        appendVideo(response.content, "bot");
        break;
      case "link":
        appendLink(response.content, response.url, "bot");
        break;
      case "textWithLink": // Nuovo tipo
        appendTextWithLink(response.text, response.link, "bot");
        break;
      default:
        simulateTyping(response, "bot");
    }
  }
  // Funzione per aggiungere testo + link cliccabile
  function appendTextWithLink(text, link, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);

    // Aggiungi il testo normale
    const textElement = document.createElement("p");
    textElement.textContent = text;

    // Aggiungi il link cliccabile
    const linkElement = document.createElement("a");
    linkElement.href = link.url;
    linkElement.textContent = link.displayText;
    linkElement.target = "_blank"; // Apri in una nuova scheda
    linkElement.style.color = "#007bff"; // Stile opzionale
    linkElement.style.textDecoration = "underline";

    // Combina tutto
    messageElement.appendChild(textElement);
    messageElement.appendChild(linkElement);
    chatBox.appendChild(messageElement);

    // Scorri verso il basso
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function appendMessage(text, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);
    messageElement.innerHTML = `<p>${text}</p>`;
    chatBox.appendChild(messageElement);

    // Scorri verso il basso per vedere l'ultimo messaggio
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function appendImage(url, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);
    messageElement.innerHTML = `<img src="${url}" alt="Imagen" style="max-width: 100%; height: auto;">`;
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
    messageElement.innerHTML = `<a href="${url}" target="_blank">${text}</a>`;
    chatBox.appendChild(messageElement);

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function simulateTyping(response, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender, "typing");
    chatBox.appendChild(messageElement);

    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < response.content.length) {
        messageElement.innerHTML = `<p>${response.content.slice(
          0,
          index + 1
        )}</p>`;
        index++;
        chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        clearInterval(typingInterval);
        messageElement.classList.remove("typing");
      }
    }, 0.1); // Velocità di digitazione (50ms per carattere)
  }

  function saveUserQuestion(question) {
    let savedQuestions =
      JSON.parse(localStorage.getItem("userQuestions")) || [];
    savedQuestions.push(question);
    localStorage.setItem("userQuestions", JSON.stringify(savedQuestions));
    console.log("Domanda salvata:", question); // Verifica che la domanda sia salvata
  }

  // Sostituisci la funzione showSavedQuestions

  // Funzione per salvare una domanda
  async function saveUserQuestion(question) {
    try {
      const response = await fetch("http://localhost:3000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: question }),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}`);
      }

      const data = await response.json();
      console.log("Risposta del backend:", data);
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
    }
  }

  // Funzione per mostrare le domande salvate
  async function showSavedQuestions() {
    try {
      const response = await fetch("http://localhost:3000/api/questions");
      const questions = await response.json();

      const chatBox = document.getElementById("chat-box");
      chatBox.innerHTML = "";

      questions.forEach((question, index) => {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", "user");
        messageElement.innerHTML = `<p>${index + 1}. ${question.text}</p>`;
        chatBox.appendChild(messageElement);
      });
    } catch (error) {
      console.error("Errore nel recupero:", error);
    }
  }
  //Aggiungi un pulsante per visualizzare le domande salvate
  // const showQuestionsBtn = document.createElement("button");
  // showQuestionsBtn.textContent = "Mostra Domande Salvate";
  // showQuestionsBtn.addEventListener("click", saveUserQuestions);
  // document.body.appendChild(showQuestionsBtn);
});

const toggleChatBtn = document.getElementById("toggle-chat");
const chatContainer = document.querySelector(".chat-container");

toggleChatBtn.addEventListener("click", () => {
  chatContainer.classList.toggle("hidden");
});
