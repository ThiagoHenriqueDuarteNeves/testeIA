// app.js (completo com resolução localtonet-skip-warning)
document.addEventListener("DOMContentLoaded", function () {
    // Módulo de Conexão
    const ConnectionModule = (() => {
        const connectionIcon = document.getElementById("connectionIcon");
        const connectionText = document.getElementById("connectionText");
        const serverURL = "https://5653-177-69-1-37.ngrok-free.app";
        let checkConnectionInterval = null;

        async function checkConnection() {
            try {
                const response = await fetch(`${serverURL}/api/v1/models`, {
                    headers: { 'localtonet-skip-warning': 'true' }
                });
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
            { role: "system", content: "Você é um professor de história, filosofia, psicologia, física, sempre que iniciarmos a conversa aborde alguma curiosidade sobre um destes assuntos" }
        ];
        let thinkingIndicatorId = null;

        function appendMessage(sender, text, isAssistant = false, id = null) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            if (id) messageDiv.id = id;

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
            if (indicator) indicator.remove();
        }

        async function sendMessage(message) {
            console.log("Enviando mensagem:", message);
            messages.push({ role: "user", content: message });
            appendMessage("Você", message);

            const thinkingId = showThinkingIndicator();

            try {
                const response = await fetch(`${ConnectionModule.getServerURL()}/api/v0/chat/completions`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "localtonet-skip-warning": "true"
                    },
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
