import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        maxLength: 500
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['trip', 'flat', 'event', 'other'],
        default: 'other'
    },
    inviteCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(4).toString('hex') // 8-char hex code
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    baseCurrency: {
        type: String,
        default: 'INR',
        trim: true,
        uppercase: true,
        maxLength: 3
    }
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);

export default Group;
