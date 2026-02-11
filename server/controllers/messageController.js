const Message = require("../models/Message");

module.exports.getMessages = async (req, res, next) => {
    try {
        const { from, to } = req.body;

        const messages = await Message.find({
            users: {
                $all: [from, to],
            },
        }).sort({ createdAt: 1 });

        const projectedMessages = messages.map((msg) => {
            return {
                _id: msg._id,
                fromSelf: msg.sender.toString() === from,
                message: msg.message.text || null,
                fileUrl: msg.message.fileUrl || null,
                isEdited: msg.isEdited,
                isDeleted: msg.isDeleted,
                isRead: msg.isRead,
                editedAt: msg.editedAt,
                createdAt: msg.createdAt,
            };
        });

        res.json(projectedMessages);
    } catch (ex) {
        next(ex);
    }
};

module.exports.addMessage = async (req, res, next) => {
    try {
        const { from, to, message } = req.body;

        // message may be a string (text) or an object { text, fileUrl }
        const messageObj = typeof message === 'string' ? { text: message } : (message || {});

        const data = await Message.create({
            message: { text: messageObj.text || null, fileUrl: messageObj.fileUrl || null },
            users: [from, to],
            sender: from,
        });

        if (data) return res.json(data); // Return the full message object with _id
        else return res.json({ msg: "Failed to add message to the database" });
    } catch (ex) {
        next(ex);
    }
};

module.exports.editMessage = async (req, res, next) => {
    try {
        const { msgId } = req.params;
        const { text, userId } = req.body;

        const message = await Message.findById(msgId);
        if (!message) {
            return res.json({ msg: "Message not found", status: false });
        }

        // Verify the user is the sender
        if (message.sender.toString() !== userId) {
            return res.json({ msg: "Unauthorized", status: false });
        }

        if (message.isDeleted) {
            return res.json({ msg: "Cannot edit deleted message", status: false });
        }

        message.message.text = text;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        return res.json({ status: true, msg: "Message edited successfully" });
    } catch (ex) {
        next(ex);
    }
};

module.exports.deleteMessage = async (req, res, next) => {
    try {
        const { msgId } = req.params;
        const { userId } = req.body;

        const message = await Message.findById(msgId);
        if (!message) {
            return res.json({ msg: "Message not found", status: false });
        }

        // Verify the user is the sender
        if (message.sender.toString() !== userId) {
            return res.json({ msg: "Unauthorized", status: false });
        }

        message.isDeleted = true;
        message.message.text = "This message was deleted";
        await message.save({ timestamps: false }); // Don't update updatedAt

        return res.json({ status: true, message });
    } catch (ex) {
        next(ex);
    }
};

module.exports.clearChat = async (req, res, next) => {
    try {
        const { from, to } = req.body;

        // Delete all messages between these two users
        console.log(`Clearing chat between ${from} and ${to}`);
        const result = await Message.deleteMany({
            users: {
                $all: [from, to],
            },
        });
        console.log(`Deleted ${result.deletedCount} messages`);

        return res.json({ status: true, msg: "Chat cleared successfully", deletedCount: result.deletedCount });
    } catch (ex) {
        next(ex);
    }
};
