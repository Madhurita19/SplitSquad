import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Store active connections: Array of { userId, groupId, res }
let clients = [];

// @desc    Subscribe to group events via SSE (Server-Sent Events)
// @route   GET /api/events/group/:groupId
// @access  Private
router.get('/group/:groupId', protect, (req, res) => {
    const { groupId } = req.params;
    const userId = req.user._id.toString();

    // SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Keep the connection open by writing initial data
    res.write(`data: ${JSON.stringify({ message: "Connected to real-time updates" })}\n\n`);

    // Create a new client
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        userId,
        groupId,
        res
    };

    clients.push(newClient);

    // When client closes connection we remove them
    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

// Helper function to broadcast an event to all users in a specific group
export const broadcastGroupEvent = (groupId, eventType, data) => {
    const targetClients = clients.filter(client => client.groupId === groupId);

    const formattedData = `data: ${JSON.stringify({ type: eventType, payload: data })}\n\n`;

    targetClients.forEach(client => {
        client.res.write(formattedData);
    });
};

export default router;
