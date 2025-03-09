// app.js
// Utilizamos o padrão de módulos (IIFE) para melhorar a organização do código

document.addEventListener("DOMContentLoaded", function () {
    // Módulo de Conexão: Gerencia a verificação do status do servidor LM Studio
    const ConnectionModule = (() => {
        const connectionIcon = document.getElementById("connectionIcon");
        const connectionText = document.getElementById("connectionText");
        const serverURL = "https://9195-2804-d41-c571-5c00-d8c7-248-9ff3-58f3.ngrok-free.app";
        let checkConnectionInterval = null;
    
        async function checkConnection() {
            try {
                const response = await fetch(`${serverURL}/api/v0/models`);
                if (response.ok) {
                    connectionIcon.style.backgroundColor = "green";
                    connectionText.textContent = "Conectado";
                } else {
                    throw new Error("Resposta do servidor não foi OK");
                }
            } catch (error) {
                connectionIcon.style.backgroundColor = "red";
                connectionText.textContent = "Desconectado";
                console.error("Erro ao conectar:", error);
            }
        }
    
        function startChecking() {
            checkConnection();
            checkConnectionInterval = setInterval(checkConnection, 5000);
        }
    
        function getServerURL() {
            return serverURL;
        }
    
        return { startChecking, getServerURL };
    })();
    
    // Módulo de Formatação: Trata a formatação do texto do assistente
    const FormattingModule = (() => {
        function removeThinkTags(text) {
            return text.replace(/<think>.*?<\/think>/gs, "").trim(); // Remove tudo dentro de <think>...</think>
        }
  
        function removeThinkLines(text) {
            return text.replace(/^Think:.*$/gm, "").trim();
        }
    
        function formatAsParagraphs(text) {
            const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
            return paragraphs.map(par => `<p>${par}</p>`).join("");
        }
    
        function formatAssistantText(text) {
            let formatted = removeThinkTags(text);  // Remove <think>...</think>
            formatted = removeThinkLines(formatted);  // Remove "Think:..."
            formatted = formatAsParagraphs(formatted);
            return formatted;
        }
    
        return { formatAssistantText };
    })();
    
    // Módulo de Chat: Gerencia o envio de mensagens e a exibição do chat
    const ChatModule = (() => {
        const chatLog = document.getElementById("chatLog");
        let messages = [
            { role: "system", content: "Você é um assistente bem humorado para atender a Tia Fatima, inclua sempre o tratamente 'Tia Fátima'." }
        ];
    
        function appendMessage(sender, text, isAssistant = false) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
    
            const senderElem = document.createElement("span");
            senderElem.classList.add("sender");
            senderElem.textContent = sender + ":";
  
            // Aplica formatação e remove conteúdo entre <think>...</think>
            const cleanText = isAssistant ? FormattingModule.formatAssistantText(text) : text;
    
            const textElem = document.createElement("span");
            textElem.innerHTML = cleanText;
    
            messageDiv.appendChild(senderElem);
            messageDiv.appendChild(textElem);
            chatLog.appendChild(messageDiv);
            chatLog.scrollTop = chatLog.scrollHeight;
        }
    
        async function sendMessage(message) {
            console.log("Enviando mensagem:", message);
            messages.push({ role: "user", content: message });
            appendMessage("Você", message);
    
            const payload = {
                model: "granite-3.0-2b-instruct",
                messages: messages,
                temperature: 0.7,
                max_tokens: -1,
                stream: false,
            };
    
            try {
                const response = await fetch(`${ConnectionModule.getServerURL()}/api/v0/chat/completions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
    
                if (!response.ok) {
                    throw new Error("Erro na requisição: " + response.status);
                }
                const data = await response.json();
                console.log("Resposta da API:", data);
                const reply = data.choices[0]?.message?.content || "(Sem resposta)";
                
                // Aplica a filtragem antes de exibir
                appendMessage("IA", reply, true);
                messages.push({ role: "assistant", content: reply });
            } catch (error) {
                console.error("Erro ao enviar mensagem:", error);
                appendMessage("Erro", error.message);
            }
        }
    
        return { sendMessage };
    })();
    
    // Módulo de Inicialização da Aplicação: Gerencia eventos
    const AppModule = (() => {
        const chatScreen = document.getElementById("chatScreen");
        const promptInput = document.getElementById("prompt");
        const sendBtn = document.getElementById("sendBtn");
    
        if (!sendBtn || !promptInput) {
            console.error("Elemento não encontrado! Verifique os IDs no HTML.");
            return;
        }
    
        function init() {
            sendBtn.addEventListener("click", () => {
                const text = promptInput.value.trim();
                if (text) {
                    ChatModule.sendMessage(text);
                    promptInput.value = "";
                }
            });
    
            promptInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    sendBtn.click();
                }
            });
    
            ConnectionModule.startChecking();
        }
    
        return { init };
    })();
    
    // Inicializa a aplicação
    AppModule.init();
  });
  