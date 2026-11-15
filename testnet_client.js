// HAVE2WANT TESTNET - SPEECH-TO-TEXT & GEOLOCATION CLIENT
// Speech-to-Text nativo it-IT dello smartphone con invio automatico su silenzio

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = false;
recognition.lang = 'it-IT';
recognition.interimResults = false;

let silenceTimer;
const micButton = document.getElementById('mic-button');
const chatInput = document.getElementById('chat-input');

if (micButton && chatInput) {
    micButton.addEventListener('click', () => {
        micButton.style.backgroundColor = 'red';
        recognition.start();
    });

    recognition.onresult = (event) => {
        const textResult = event.results[0][0].transcript;
        chatInput.value = textResult; 
        
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    sendToBackend(textResult, position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.warn("Geolocalizzazione non disponibile o negata, invio coordinate predefinite:", err);
                    sendToBackend(textResult, 45.4642, 9.1900);
                }
            );
            micButton.style.backgroundColor = 'gray';
        }, 1500);
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        micButton.style.backgroundColor = 'gray';
    };

    recognition.onend = () => {
        if (!silenceTimer) {
            micButton.style.backgroundColor = 'gray';
        }
    };
}

async function sendToBackend(text, lat, lng) {
    const endpoints = ["/api/testnet/query", "http://localhost:5000/api/testnet/query"];
    for (const url of endpoints) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query_text: text, user_lat: lat, user_lng: lng })
            });
            if (response.ok) {
                const data = await response.json();
                console.log("[TESTNET RESPONSE]:", data);
                return data;
            }
        } catch (error) {
            // Prova il prossimo endpoint
        }
    }
    console.error("[TESTNET NETWORK ERROR]: Nessun endpoint attivo raggiungibile");
}
