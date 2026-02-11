const ScheduledMessage = require("../models/ScheduledMessage");
const Message = require("../models/Message");

module.exports.scheduleMessage = async (req, res, next) => {
    try {
        const { from, to, message, scheduledTime } = req.body;

        // Validate required fields
        if (!from || !to || !message || !scheduledTime) {
            return res.json({ 
                msg: "Missing required fields: from, to, message, scheduledTime", 
                status: false 
            });
        }

        // Parse scheduled time
        const scheduledDate = new Date(scheduledTime);
        const now = new Date();

        // Add 1 second buffer for race condition
        if (scheduledDate <= new Date(now.getTime() + 1000)) {
            return res.json({ 
                msg: "Scheduled time must be at least 1 second in the future", 
                status: false 
            });
        }

        // Validate it's not too far in the future (prevent abuse)
        const maxFutureDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
        if (scheduledDate > maxFutureDate) {
            return res.json({ 
                msg: "Cannot schedule messages more than 1 year in the future", 
                status: false 
            });
        }

        const scheduledMsg = await ScheduledMessage.create({
            message: { text: String(message).trim() },
            from,
            to,
            scheduledTime: scheduledDate,
            status: 'pending',
        });

        console.log("✅ Message scheduled successfully:", {
            msgId: scheduledMsg._id,
            from,
            to,
            scheduledTime: scheduledDate.toISOString(),
        });

        return res.json({ 
            status: true, 
            msg: "Message scheduled successfully", 
            data: scheduledMsg 
        });
    } catch (ex) {
        console.error("❌ Error in scheduleMessage:", ex);
        return res.json({
            msg: "Error scheduling message: " + ex.message,
            status: false
        });
    }
};

module.exports.getScheduledMessages = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const scheduledMessages = await ScheduledMessage.find({
            from: userId,
            status: 'pending'
        })
            .populate('to', 'username avatarImage')
            .sort({ scheduledTime: 1 });

        return res.json(scheduledMessages);
    } catch (ex) {
        next(ex);
    }
};

module.exports.cancelScheduledMessage = async (req, res, next) => {
    try {
        const { msgId } = req.params;
        const { userId } = req.body;

        const scheduledMsg = await ScheduledMessage.findById(msgId);
        if (!scheduledMsg) {
            return res.json({ msg: "Scheduled message not found", status: false });
        }

        // Verify user is the sender
        if (scheduledMsg.from.toString() !== userId) {
            return res.json({ msg: "Unauthorized", status: false });
        }

        // Mark as cancelled instead of deleting
        scheduledMsg.status = 'cancelled';
        await scheduledMsg.save();

        return res.json({ status: true, msg: "Scheduled message cancelled" });
    } catch (ex) {
        next(ex);
    }
};

module.exports.rescheduleMessage = async (req, res, next) => {
    try {
        const { msgId } = req.params;
        const { userId, newScheduledTime } = req.body;

        // Validate new scheduled time is in the future
        if (new Date(newScheduledTime) <= new Date()) {
            return res.json({ msg: "New scheduled time must be in the future", status: false });
        }

        const scheduledMsg = await ScheduledMessage.findById(msgId);
        if (!scheduledMsg) {
            return res.json({ msg: "Scheduled message not found", status: false });
        }

        // Verify user is the sender
        if (scheduledMsg.from.toString() !== userId) {
            return res.json({ msg: "Unauthorized", status: false });
        }

        if (scheduledMsg.status !== 'pending') {
            return res.json({ msg: "Can only reschedule pending messages", status: false });
        }

        scheduledMsg.scheduledTime = new Date(newScheduledTime);
        await scheduledMsg.save();

        return res.json({ status: true, msg: "Message rescheduled successfully", data: scheduledMsg });
    } catch (ex) {
        next(ex);
    }
};

module.exports.sendScheduledMessage = async (req, res, next) => {
    try {
        const { scheduledMsgId, io } = req.body;

        const scheduledMsg = await ScheduledMessage.findById(scheduledMsgId);
        if (!scheduledMsg || scheduledMsg.status !== 'pending') {
            return res.json({ msg: "Invalid scheduled message", status: false });
        }

        // Create actual message
        const message = await Message.create({
            message: { text: scheduledMsg.message.text },
            users: [scheduledMsg.from, scheduledMsg.to],
            sender: scheduledMsg.from,
        });

        // Update scheduled message status
        scheduledMsg.status = 'sent';
        scheduledMsg.sentAt = new Date();
        scheduledMsg.isSent = true;
        await scheduledMsg.save();

        // Emit socket event if io is provided
        if (io) {
            io.to(scheduledMsg.to.toString()).emit("msg-recieve", {
                from: scheduledMsg.from,
                msg: scheduledMsg.message.text,
                senderName: "Scheduled Message",
                id: message._id,
            });
        }

        return res.json({ status: true, msg: "Scheduled message sent", data: message });
    } catch (ex) {
        next(ex);
    }
};
