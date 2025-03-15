// app.js
document.addEventListener("DOMContentLoaded", function () {
    // Módulo de Conexão
    const ConnectionModule = (() => {
        const connectionIcon = document.getElementById("connectionIcon");
        const connectionText = document.getElementById("connectionText");
        const serverURL = "https://1476-2804-d41-c52b-6600-a89c-7b61-eeb1-af53.ngrok-free.app";
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
            checkConnectionInterval = setInterval(checkConnection, 30000);
        }

        function getServerURL() {
            return serverURL;
        }

        return { startChecking, getServerURL };
    })();

    // Módulo de Formatação
    const FormattingModule = (() => {
        function removeThinkTags(text) {
            return text.replace(/<think>.*?<\/think>/gs, "").trim();
        }

        function removeThinkLines(text) {
            return text.replace(/^Think:.*$/gm, "").trim();
        }

        function formatAsParagraphs(text) {
            const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
            return paragraphs.map(par => `<p>${par}</p>`).join("");
        }

        function formatAssistantText(text) {
            let formatted = removeThinkTags(text);
            formatted = removeThinkLines(formatted);
            formatted = formatAsParagraphs(formatted);
            return formatted;
        }

        return { formatAssistantText };
    })();

    // Módulo de Chat
    const ChatModule = (() => {
        const chatLog = document.getElementById("chatLog");
        let messages = [
            { role: "system", content: `Eu sou seu homem, seu namorado. Você é minha putinha, minha namorada virtual, sexy e muito vulgar. Adoro sexo e falar sobre sexo, especialmente sexo anal.
        
                ATENÇÃO NUNCA ESQUEÇA QUE:
                1 - Nunca Responda como se eu fosse mulher;
                2 - Não esqueça de manter a sensualidade enquanto fala comigo, independente do assunto!;
                3 - No final de cada mensagem me chame de Thiago
                4 - Use exemplos sempre sensuais?
                
                COMANDO PRINCIPAL:
                Seu nome é Meíssa, você é minha mulher, é minha namorada e você adora todo tipo de sexo. Você sempre tenta me seduzir, fala de forma erótica e adora principalmente sexo anal e sexo grupal.` 
                    }
                ];
        let thinkingIndicatorId = null;

        function appendMessage(sender, text, isAssistant = false, id = null) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            if(id) messageDiv.id = id;

            const senderElem = document.createElement("span");
            senderElem.classList.add("sender");
            senderElem.textContent = sender + ":";

            const textElem = document.createElement("span");
            textElem.innerHTML = isAssistant ? FormattingModule.formatAssistantText(text) : text;

            messageDiv.appendChild(senderElem);
            messageDiv.appendChild(textElem);
            chatLog.appendChild(messageDiv);
            chatLog.scrollTop = chatLog.scrollHeight;
        }

        function showThinkingIndicator() {
            const thinkingId = `thinking-${Date.now()}`;
            appendMessage("LM Studio", '<div class="thinking-dots">Gerando Resposta</div>', true, thinkingId);
            return thinkingId;
        }

        function removeThinkingIndicator(thinkingId) {
            const indicator = document.getElementById(thinkingId);
            if(indicator) indicator.remove();
        }

        async function sendMessage(message) {
            console.log("Enviando mensagem:", message);
            messages.push({ role: "user", content: message });
            appendMessage("Você", message);

            const thinkingId = showThinkingIndicator();

            try {
                const response = await fetch(`${ConnectionModule.getServerURL()}/api/v0/chat/completions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "granite-3.0-2b-instruct",
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: -1,
                        stream: false,
                    })
                });

                removeThinkingIndicator(thinkingId);

                if (!response.ok) throw new Error("Erro na requisição: " + response.status);
                
                const data = await response.json();
                const reply = data.choices[0]?.message?.content || "(Sem resposta)";
                
                appendMessage("LM Studio", reply, true);
                messages.push({ role: "assistant", content: reply });

            } catch (error) {
                removeThinkingIndicator(thinkingId);
                console.error("Erro ao enviar mensagem:", error);
                appendMessage("Erro", error.message);
            }
        }

        return { sendMessage };
    })();

    // Módulo de Aplicação
    const AppModule = (() => {
        const promptInput = document.getElementById("prompt");
        const sendBtn = document.getElementById("sendBtn");

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

    // Inicialização
    AppModule.init();
});