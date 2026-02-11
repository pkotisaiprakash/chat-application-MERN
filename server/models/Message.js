const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        message: {
                text: { type: String },
                fileUrl: { type: String },
            },
        users: Array,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Message', messageSchema);
