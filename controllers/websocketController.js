import WebSocket from 'ws';
import { SYSTEM_MESSAGE, VOICE, LOG_EVENT_TYPES } from '../utils/constants.js';

export const handleWebSocketConnection = (connection, req, OPENAI_API_KEY) => {
    const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
        headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1"
        }
    });

    let streamSid = null;

    const sendSessionUpdate = () => {
        const sessionUpdate = {
            type: 'session.update',
            session: {
                turn_detection: { type: 'server_vad' },
                input_audio_format: 'g711_ulaw',
                output_audio_format: 'g711_ulaw',
                voice: VOICE,
                instructions: SYSTEM_MESSAGE,
                modalities: ["text", "audio"],
                temperature: 0.8,
            }
        };
        openAiWs.send(JSON.stringify(sessionUpdate));
    };

    openAiWs.on('open', () => {
        setTimeout(sendSessionUpdate, 250);
    });

    openAiWs.on('message', (data) => {
        try {
            const response = JSON.parse(data);
            if (LOG_EVENT_TYPES.includes(response.type)) {
                console.log(`Received event: ${response.type}`, response);
            }

            if (response.type === 'response.audio.delta' && response.delta) {
                const audioDelta = {
                    event: 'media',
                    streamSid: streamSid,
                    media: { payload: Buffer.from(response.delta, 'base64').toString('base64') }
                };
                connection.send(JSON.stringify(audioDelta));
            }
        } catch (error) {
            console.error('Error processing OpenAI message:', error);
        }
    });

    connection.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.event === 'media' && openAiWs.readyState === WebSocket.OPEN) {
                openAiWs.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: data.media.payload }));
            } else if (data.event === 'start') {
                streamSid = data.start.streamSid;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    connection.on('close', () => {
        if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
    });

    openAiWs.on('close', () => console.log('Disconnected from OpenAI API'));
    openAiWs.on('error', (error) => console.error('WebSocket error:', error));
};
