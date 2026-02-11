const mongoose = require('mongoose');

const scheduledMessageSchema = new mongoose.Schema(
    {
        message: {
            text: { type: String, required: true },
        },
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        scheduledTime: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'cancelled'],
            default: 'pending',
        },
        sentAt: {
            type: Date,
        },
        isSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('ScheduledMessage', scheduledMessageSchema);
