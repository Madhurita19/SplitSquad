import express from 'express';
import { protect } from '../middleware/auth.js';
import Group from '../models/Group.js';
import Settlement from '../models/Settlement.js';
import { calculateBalances, simplifyDebts } from '../services/debtEngine.js';
import { broadcastGroupEvent } from './events.js';
import Notification from '../models/Notification.js';
import { settlementValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get raw balances and simplified debts for a group
// @route   GET /api/settlements/group/:groupId/debts
// @access  Private
router.get('/group/:groupId/debts', protect, async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // 1. Calculate raw net balances
        const balances = await calculateBalances(req.params.groupId);

        // 2. Simplify into transactions
        // Since the users are returned as ObjectIds, we will attach user data to them
        const rawDebts = balances;
        const simplified = simplifyDebts(rawDebts);

        // Let's get user profiles for the generated transactions
        await group.populate('members', 'name email avatar upiId');
        const memberMap = {};
        group.members.forEach(m => memberMap[m._id.toString()] = m);

        // Map the simplified transactions to include populated users
        const output = simplified.map(t => ({
            from: memberMap[t.from] || { _id: t.from, name: 'Unknown' },
            to: memberMap[t.to] || { _id: t.to, name: 'Unknown' },
            amount: t.amount
        }));

        // Map raw balances to include user names
        const mappedBalances = Object.entries(balances)
            .filter(([_, amount]) => Math.abs(amount) > 0.05)
            .map(([userId, amount]) => ({
                user: memberMap[userId] || { _id: userId, name: 'Unknown' },
                amount
            }));

        res.json({
            rawBalances: mappedBalances,
            simplifiedDebts: output
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Record a settlement (pay off a debt)
// @route   POST /api/settlements
// @access  Private
router.post('/', protect, settlementValidation, validateRequest, async (req, res, next) => {
    try {
        const { groupId, paidTo, amount, note } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Validate members
        if (!group.members.includes(req.user._id) || !group.members.includes(paidTo)) {
            return res.status(400).json({ message: 'Both users must be members of the group' });
        }

        const settlement = await Settlement.create({
            group: groupId,
            paidBy: req.user._id, // The logged-in user pays
            paidTo,               // The target user receives
            amount,
            note
        });

        await Notification.create({
            recipient: paidTo,
            actor: req.user._id,
            group: groupId,
            type: 'SETTLEMENT',
            message: `${req.user.name} recorded a payment of ₹${amount} to you.`
        });

        broadcastGroupEvent(groupId, 'NEW_SETTLEMENT', settlement);

        res.status(201).json(settlement);
    } catch (error) {
        next(error);
    }
});

// @desc    Get all past settlements for a group
// @route   GET /api/settlements/group/:groupId
// @access  Private
router.get('/group/:groupId', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const settlements = await Settlement.find({ group: req.params.groupId })
            .populate('paidBy', 'name avatar upiId')
            .populate('paidTo', 'name avatar upiId')
            .sort({ settledAt: -1 });

        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
