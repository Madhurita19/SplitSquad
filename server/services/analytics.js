import mongoose from 'mongoose';
import Expense from '../models/Expense.js';

export const getGroupAnalytics = async (groupId) => {
    const objectId = new mongoose.Types.ObjectId(groupId);

    // 1. Total spent by category
    const categorySpending = await Expense.aggregate([
        { $match: { group: objectId } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]);

    // 2. Total paid by each member (who is swiping their card the most)
    const memberPaid = await Expense.aggregate([
        { $match: { group: objectId } },
        { $group: { _id: '$paidBy', totalPaid: { $sum: '$amount' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 1, name: '$user.name', avatar: '$user.avatar', totalPaid: 1 } },
        { $sort: { totalPaid: -1 } }
    ]);

    // 3. User's personal share (who is actually costing the most)
    const memberShares = await Expense.aggregate([
        { $match: { group: objectId } },
        { $unwind: '$splits' }, // Deconstruct the splits array
        { $group: { _id: '$splits.user', totalShare: { $sum: '$splits.amount' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 1, name: '$user.name', avatar: '$user.avatar', totalShare: 1 } },
        { $sort: { totalShare: -1 } }
    ]);

    // 4. Monthly spending trend
    const spendingTrend = await Expense.aggregate([
        { $match: { group: objectId } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                total: { $sum: '$amount' }
            }
        },
        { $sort: { _id: 1 } } // Sort chronologically
    ]);

    return {
        categorySpending,
        memberPaid,
        memberShares,
        spendingTrend
    };
};
