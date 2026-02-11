const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            text: { type: String },
            fileUrl: { type: String },
        },
        isRead: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("GroupMessage", groupMessageSchema);
