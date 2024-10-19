import { handleWebSocketConnection } from '../controllers/websocketController.js';

async function websocketRoutes(fastify, OPENAI_API_KEY) {
    fastify.get('/media-stream', { websocket: true }, (connection, req) => {
        handleWebSocketConnection(connection, req, OPENAI_API_KEY);
    });
}

export default websocketRoutes;