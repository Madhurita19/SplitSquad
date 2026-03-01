import express from 'express';
import crypto from 'crypto';
import Notification from '../models/Notification.js';
import { broadcastGroupEvent } from './events.js';
import { protect } from '../middleware/auth.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { getGroupAnalytics } from '../services/analytics.js';
import { calculateBalances } from '../services/debtEngine.js';
import { groupValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();

// @desc    Get the logged-in user's net balance for each of their groups
// @route   GET /api/groups/my-balances
// @access  Private
router.get('/my-balances', protect, async (req, res, next) => {
    try {
        const groups = await Group.find({ members: req.user._id });
        const balanceMap = {};

        for (const group of groups) {
            const balances = await calculateBalances(group._id);
            const myBalance = balances[req.user._id.toString()] || 0;
            balanceMap[group._id.toString()] = myBalance;
        }

        res.json(balanceMap);
    } catch (error) {
        next(error);
    }
});

// @desc    Get aggregated expense stats for the logged-in user
// @route   GET /api/groups/my-stats
// @access  Private
router.get('/my-stats', protect, async (req, res, next) => {
    try {
        const { default: Expense } = await import('../models/Expense.js');
        const groups = await Group.find({ members: req.user._id });
        const groupIds = groups.map(g => g._id);

        // Single aggregation query instead of N+1 calls
        const stats = await Expense.aggregate([
            { $match: { group: { $in: groupIds }, paidBy: req.user._id } },
            {
                $group: {
                    _id: '$group',
                    totalExpenses: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        let totalExpenses = 0;
        let totalAmountSpent = 0;
        let topSquadName = null;
        let topSquadCount = 0;

        const groupMap = {};
        groups.forEach(g => { groupMap[g._id.toString()] = g.name; });

        stats.forEach(s => {
            totalExpenses += s.totalExpenses;
            totalAmountSpent += s.totalAmount;
            if (s.totalExpenses > topSquadCount) {
                topSquadCount = s.totalExpenses;
                topSquadName = groupMap[s._id.toString()] || 'Unknown';
            }
        });

        res.json({
            totalExpenses,
            totalAmountSpent,
            avgPerExpense: totalExpenses > 0 ? totalAmountSpent / totalExpenses : 0,
            topSquad: topSquadName,
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Preview a group by invite code (before joining)
// @route   GET /api/groups/invite/:inviteCode
// @access  Private
router.get('/invite/:inviteCode', protect, async (req, res, next) => {
    try {
        const group = await Group.findOne({ inviteCode: req.params.inviteCode })
            .populate('members', 'name')
            .populate('createdBy', 'name');
        if (!group) return res.status(404).json({ message: 'Invalid invite code' });

        const alreadyMember = group.members.some(m => m._id.equals(req.user._id));

        res.json({
            _id: group._id,
            name: group.name,
            category: group.category,
            description: group.description,
            memberCount: group.members.length,
            createdBy: group.createdBy?.name,
            alreadyMember,
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Join a group via invite code
// @route   POST /api/groups/join/:inviteCode
// @access  Private
router.post('/join/:inviteCode', protect, async (req, res, next) => {
    try {
        const group = await Group.findOne({ inviteCode: req.params.inviteCode });
        if (!group) return res.status(404).json({ message: 'Invalid invite code' });

        if (group.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'You are already a member', groupId: group._id });
        }

        group.members.push(req.user._id);
        await group.save();

        // Notify the creator that someone joined
        if (group.createdBy.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: group.createdBy,
                actor: req.user._id,
                group: group._id,
                type: 'GROUP_MEMBER_ADDED',
                message: `${req.user.name} joined your squad "${group.name}" via invite link.`
            });
        }

        res.json({ message: 'Joined successfully!', groupId: group._id });
    } catch (error) {
        next(error);
    }
});

// @desc    Get analytics for a group
// @route   GET /api/groups/:id/analytics
// @access  Private
router.get('/:id/analytics', protect, async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const analytics = await getGroupAnalytics(req.params.id);
        res.json(analytics);
    } catch (error) {
        next(error);
    }
});

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
router.post('/', protect, groupValidation, validateRequest, async (req, res, next) => {
    try {
        const { name, description, category, baseCurrency } = req.body;

        const group = await Group.create({
            name,
            description,
            category,
            baseCurrency,
            createdBy: req.user._id,
            members: [req.user._id], // Creator is automatically a member
        });

        res.status(201).json(group);
    } catch (error) {
        next(error);
    }
});

// @desc    Get all groups for the logged-in user
// @route   GET /api/groups
// @access  Private
router.get('/', protect, async (req, res, next) => {
    try {
        // Find groups where the current user is a member
        const groups = await Group.find({ members: req.user._id })
            .populate('members', 'name email avatar upiId')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(groups);
    } catch (error) {
        next(error);
    }
});

// @desc    Get an individual group by ID
// @route   GET /api/groups/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('members', 'name email avatar upiId')
            .populate('createdBy', 'name');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Ensure the user is a member of the group
        if (!group.members.some(member => member._id.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not authorized to access this group' });
        }

        res.json(group);
    } catch (error) {
        next(error);
    }
});

// @desc    Add a member to a group by email
// @route   POST /api/groups/:id/members
// @access  Private
router.post('/:id/members', protect, async (req, res, next) => {
    try {
        const { email } = req.body;

        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Only members can add other members
        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to add members' });
        }

        const userToAdd = await User.findOne({ email });
        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        if (group.members.includes(userToAdd._id)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        group.members.push(userToAdd._id);
        await group.save();

        // Notify the newly added user
        await Notification.create({
            recipient: userToAdd._id,
            actor: req.user._id,
            group: group._id,
            type: 'GROUP_MEMBER_ADDED',
            message: `${req.user.name} added you to the squad "${group.name}".`
        });

        res.json(group);
    } catch (error) {
        next(error);
    }
});

// @desc    Leave a group (remove yourself from members)
// @route   POST /api/groups/:id/leave
// @access  Private
router.post('/:id/leave', protect, async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.createdBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Group creator cannot leave. Delete the group instead.' });
        }

        if (!group.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'You are not a member of this group' });
        }

        // Check for unsettled debts before allowing leave
        const balances = await calculateBalances(req.params.id);
        const myBalance = balances[req.user._id.toString()] || 0;
        if (Math.abs(myBalance) > 0.05) {
            const owes = myBalance < 0;
            return res.status(400).json({
                message: owes
                    ? `You owe ₹${Math.abs(myBalance).toFixed(0)} in this group. Settle your debts before leaving.`
                    : `You are owed ₹${myBalance.toFixed(0)} in this group. Collect your debts or settle before leaving.`
            });
        }

        group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
        await group.save();

        res.json({ message: 'You have left the group' });
    } catch (error) {
        next(error);
    }
});

// @desc    Toggle archive status of a group
// @route   PUT /api/groups/:id/archive
// @access  Private (creator only)
router.put('/:id/archive', protect, async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the group creator can archive this group' });
        }

        group.isArchived = !group.isArchived;
        await group.save();

        res.json({ message: group.isArchived ? 'Group archived successfully' : 'Group unarchived successfully', isArchived: group.isArchived });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete a group and all its expenses + settlements
// @route   DELETE /api/groups/:id
// @access  Private (creator only)
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the group creator can delete this group' });
        }

        // Check for unsettled debts before allowing deletion
        const balances = await calculateBalances(req.params.id);
        const hasUnsettled = Object.values(balances).some(b => Math.abs(b) > 0.05);
        if (hasUnsettled) {
            return res.status(400).json({
                message: 'Cannot delete a group with unsettled debts. All members must settle up first.'
            });
        }

        // Import models inline to avoid circular deps
        const { default: Expense } = await import('../models/Expense.js');
        const { default: Settlement } = await import('../models/Settlement.js');

        await Expense.deleteMany({ group: group._id });
        await Settlement.deleteMany({ group: group._id });
        await group.deleteOne();

        res.json({ message: 'Group and all associated data deleted' });
    } catch (error) {
        next(error);
    }
});

export default router;
