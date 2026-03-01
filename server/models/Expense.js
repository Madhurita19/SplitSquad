import mongoose from 'mongoose';

const splitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    originalCurrency: {
        type: String,
        default: 'INR',
        trim: true,
        uppercase: true,
        maxLength: 3
    },
    originalAmount: {
        type: Number
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    splitType: {
        type: String,
        enum: ['equal', 'exact', 'percentage', 'shares'],
        required: true,
        default: 'equal'
    },
    splits: [splitSchema],
    category: {
        type: String,
        enum: ['food', 'transport', 'stay', 'shopping', 'entertainment', 'other'],
        default: 'other'
    },
    note: {
        type: String,
        maxLength: 300
    },
    date: {
        type: Date,
        default: Date.now
    },
    receipt: {
        type: String
    },
    recurrence: {
        interval: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        nextDate: {
            type: Date
        }
    }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
