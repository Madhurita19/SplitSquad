import express from 'express';
import { protect } from '../middleware/auth.js';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import { broadcastGroupEvent } from './events.js';
import upload from '../middleware/upload.js';
import { expenseValidation, validateRequest } from '../middleware/validation.js';

const router = express.Router();

const calculateSplits = (amount, splitType, inputSplits) => {
    let calculatedSplits = [];

    if (splitType === 'equal') {
        // inputSplits is just an array of user IDs taking part
        const splitAmount = Number((amount / inputSplits.length).toFixed(2));
        // Fix rounding errors by adding difference to first person
        const totalSplit = splitAmount * inputSplits.length;
        let diff = amount - totalSplit;

        calculatedSplits = inputSplits.map((userId, index) => ({
            user: userId,
            amount: index === 0 ? Number((splitAmount + diff).toFixed(2)) : splitAmount
        }));
    }
    else if (splitType === 'exact') {
        // inputSplits is array of {user, amount}
        const sum = inputSplits.reduce((acc, curr) => acc + Number(curr.amount), 0);
        if (Math.abs(sum - amount) > 0.01) {
            throw new Error(`Total split amount (${sum}) does not match expense amount (${amount})`);
        }
        calculatedSplits = inputSplits;
    }
    else if (splitType === 'percentage') {
        // inputSplits is array of {user, percent}
        const sumPercent = inputSplits.reduce((acc, curr) => acc + Number(curr.percent), 0);
        if (Math.abs(sumPercent - 100) > 0.01) {
            throw new Error(`Total percentage (${sumPercent}) must equal 100`);
        }

        let currentSum = 0;
        calculatedSplits = inputSplits.map((split, index) => {
            let splitAmount;
            if (index === inputSplits.length - 1) {
                // Last person gets the remaining to avoid rounding issues
                splitAmount = Number((amount - currentSum).toFixed(2));
            } else {
                splitAmount = Number(((amount * split.percent) / 100).toFixed(2));
                currentSum += splitAmount;
            }
            return { user: split.user, amount: splitAmount };
        });
    }
    else if (splitType === 'shares') {
        // inputSplits is array of {user, share}
        const totalShares = inputSplits.reduce((acc, curr) => acc + Number(curr.share), 0);

        let currentSum = 0;
        calculatedSplits = inputSplits.map((split, index) => {
            let splitAmount;
            if (index === inputSplits.length - 1) {
                splitAmount = Number((amount - currentSum).toFixed(2));
            } else {
                splitAmount = Number(((amount * split.share) / totalShares).toFixed(2));
                currentSum += splitAmount;
            }
            return { user: split.user, amount: splitAmount };
        });
    }

    return calculatedSplits;
};

const calculateNextDate = (currentDate, interval) => {
    const nextDate = new Date(currentDate);
    switch (interval) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        default:
            return null;
    }
    return nextDate;
};

// @desc    Add an expense to a group
// @route   POST /api/expenses
// @access  Private
router.post('/', protect, upload.single('receipt'), expenseValidation, validateRequest, async (req, res, next) => {
    try {
        let { groupId, description, amount, originalCurrency, originalAmount, paidBy, splitType, splitsInput, category, date, note, recurrenceInterval } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this group' });
        }

        if (typeof splitsInput === 'string') {
            try { splitsInput = JSON.parse(splitsInput); } catch (e) { }
        }

        // Calculate actual split amounts based on input
        let finalSplits;
        try {
            finalSplits = calculateSplits(amount, splitType, splitsInput);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }

        const expenseDate = date ? new Date(date) : new Date();

        const expenseData = {
            group: groupId,
            description,
            amount,
            originalCurrency: originalCurrency || group.baseCurrency || 'INR',
            originalAmount: originalAmount || amount,
            paidBy: paidBy || req.user._id,
            splitType,
            splits: finalSplits,
            category,
            note,
            date: expenseDate
        };

        if (recurrenceInterval && ['daily', 'weekly', 'monthly', 'yearly'].includes(recurrenceInterval)) {
            expenseData.recurrence = {
                interval: recurrenceInterval,
                nextDate: calculateNextDate(expenseDate, recurrenceInterval)
            };
        }

        if (req.file) {
            expenseData.receipt = req.file.filename;
        }

        const expense = await Expense.create(expenseData);

        const notifications = group.members
            .filter(memberId => memberId.toString() !== req.user._id.toString())
            .map(memberId => ({
                recipient: memberId,
                actor: req.user._id,
                group: groupId,
                type: 'EXPENSE_ADDED',
                message: `${req.user.name} added a new expense: "${description}"`
            }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        broadcastGroupEvent(groupId, 'NEW_EXPENSE', expense);

        res.status(201).json(expense);
    } catch (error) {
        next(error);
    }
});

// @desc    Get all expenses for a generic group
// @route   GET /api/expenses/group/:groupId
// @access  Private
router.get('/group/:groupId', protect, async (req, res, next) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const expenses = await Expense.find({ group: req.params.groupId })
            .populate('paidBy', 'name avatar upiId')
            .populate('splits.user', 'name avatar upiId')
            .sort({ date: -1, createdAt: -1 });

        res.json(expenses);
    } catch (error) {
        next(error);
    }
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        const group = await Group.findById(expense.group);

        // Check if user is creator of expense or creator of group
        if (expense.paidBy.toString() !== req.user._id.toString() &&
            group.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete' });
        }

        await expense.deleteOne();
        broadcastGroupEvent(expense.group.toString(), 'DELETE_EXPENSE', { id: expense._id });
        res.json({ message: 'Expense removed' });
    } catch (error) {
        next(error);
    }
});
// @desc    Edit an expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put('/:id', protect, upload.single('receipt'), expenseValidation, validateRequest, async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        const group = await Group.findById(expense.group);

        // Only payer or group creator can edit
        if (expense.paidBy.toString() !== req.user._id.toString() &&
            group.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit' });
        }

        let { description, amount, originalCurrency, originalAmount, paidBy, splitType, splitsInput, category, date, note, recurrenceInterval } = req.body;

        if (typeof splitsInput === 'string') {
            try { splitsInput = JSON.parse(splitsInput); } catch (e) { }
        }

        let finalSplits = expense.splits;
        if (amount || splitType || splitsInput) {
            try {
                finalSplits = calculateSplits(amount || expense.amount, splitType || expense.splitType, splitsInput || expense.splits.map(s => s.user));
            } catch (err) {
                return res.status(400).json({ message: err.message });
            }
        }

        expense.description = description || expense.description;
        expense.amount = amount || expense.amount;
        if (originalCurrency) expense.originalCurrency = originalCurrency;
        if (originalAmount) expense.originalAmount = originalAmount;
        expense.paidBy = paidBy || expense.paidBy;
        if (splitType) expense.splitType = splitType;
        expense.splits = finalSplits;
        expense.category = category || expense.category;

        let newDate = expense.date;
        if (date) {
            expense.date = date;
            newDate = new Date(date);
        }

        if (note !== undefined) expense.note = note;

        // Handle Recurrence updates
        if (recurrenceInterval === 'none' || recurrenceInterval === '') {
            expense.recurrence = undefined;
        } else if (recurrenceInterval && ['daily', 'weekly', 'monthly', 'yearly'].includes(recurrenceInterval)) {
            // Recalculate based on the potentially updated date
            expense.recurrence = {
                interval: recurrenceInterval,
                nextDate: calculateNextDate(newDate, recurrenceInterval)
            };
        }

        if (req.file) {
            expense.receipt = req.file.filename;
        }

        await expense.save();

        const notifications = group.members
            .filter(memberId => memberId.toString() !== req.user._id.toString())
            .map(memberId => ({
                recipient: memberId,
                actor: req.user._id,
                group: expense.group,
                type: 'EXPENSE_UPDATED',
                message: `${req.user.name} updated the expense: "${expense.description}"`
            }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        broadcastGroupEvent(expense.group.toString(), 'EDIT_EXPENSE', expense);
        res.json(expense);
    } catch (error) {
        next(error);
    }
});

export default router;
