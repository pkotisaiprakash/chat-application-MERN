const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        avatarImage: {
            type: String,
            default: "",
        },
        isAvatarImageSet: {
            type: Boolean,
            default: false,
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        // Group settings
        onlyAdminsCanMessage: {
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

module.exports = mongoose.model("Group", groupSchema);
