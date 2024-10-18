import { handleIncomingCall } from '../controllers/callController.js';

async function callRoutes(fastify) {
    fastify.all('/incoming-call', handleIncomingCall);
}

export default callRoutes;
