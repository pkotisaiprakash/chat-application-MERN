require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const scheduledMessageRoutes = require("./routes/scheduledMessages");
const groupRoutes = require("./routes/groups");
const Message = require("./models/Message");
const ScheduledMessage = require("./models/ScheduledMessage");
const Group = require("./models/Group");
const GroupMessage = require("./models/GroupMessage");
const app = express();
const socket = require("socket.io");
const cron = require("node-cron");
const fs = require('fs');
const path = require('path');

// More explicit CORS configuration for mobile
const corsOptions = {
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/scheduled", scheduledMessageRoutes);
app.use("/api/groups", groupRoutes);

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

const filesRoutes = require('./routes/files');
app.use('/api/files', filesRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("DB Connection Successful");
    })
    .catch((err) => {
        console.log(err.message);
    });

const server = app.listen(process.env.PORT, '0.0.0.0', () =>
    console.log(`Server started on Port ${process.env.PORT} - accessible from all network interfaces`)
);

// Cron job to check and send scheduled messages every minute
cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();
        const pendingMessages = await ScheduledMessage.find({
            scheduledTime: { $lte: now },
            status: 'pending'
        }).populate('from to');

        for (let scheduledMsg of pendingMessages) {
            // Create actual message
            const message = await Message.create({
                message: { text: scheduledMsg.message.text },
                users: [scheduledMsg.from._id, scheduledMsg.to._id],
                sender: scheduledMsg.from._id,
            });

            // Update scheduled message status
            scheduledMsg.status = 'sent';
            scheduledMsg.sentAt = new Date();
            scheduledMsg.isSent = true;
            await scheduledMsg.save();

            // Emit socket event if recipient is online
            const recipientSocket = global.onlineUsers.get(scheduledMsg.to._id.toString());
            if (recipientSocket && global.chatSocket) {
                global.chatSocket.to(recipientSocket).emit("msg-recieve", {
                    from: scheduledMsg.from._id,
                    msg: scheduledMsg.message.text,
                    senderName: scheduledMsg.from.username + " (Scheduled)",
                    id: message._id,
                });
            }
        }
    } catch (err) {
        console.error("Error in scheduled message cron job:", err);
    }
});

const io = socket(server, {
    cors: {
        origin: "*", // Allow all origins for mobile testing
        credentials: true,
    },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
    global.chatSocket = socket;

    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
        // Broadcast user is online
        io.emit("user-online", { userId });
    });

    socket.on("get-online-users", () => {
        const onlineUserIds = Array.from(onlineUsers.keys());
        socket.emit("online-users", { users: onlineUserIds });
    });

    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            // Include sender id and name so clients can show notifications
            socket.to(sendUserSocket).emit("msg-recieve", { from: data.from, msg: data.msg, senderName: data.senderName });
        }
    });

    // When a user opens a chat and marks messages as seen, notify the other user
    socket.on("message-seen", async (data) => {
        const { to, from } = data; // to = other user's id, from = viewer id
        const recipientSocket = onlineUsers.get(to);

        // Mark all messages from 'to' to 'from' as read in the database
        try {
            await Message.updateMany(
                {
                    users: { $all: [to, from] },
                    sender: to,  // Messages sent by the user who is being read from
                    isRead: false
                },
                { isRead: true }
            );
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }

        if (recipientSocket) {
            socket.to(recipientSocket).emit("msg-seen", { from });
        }
    });

    // Clear chat feature
    socket.on("clear-chat-request", (data) => {
        const { to, from } = data;
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
            socket.to(recipientSocket).emit("clear-chat-request", { from });
        }
    });

    socket.on("clear-chat-accept", (data) => {
        const { to, from } = data;
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
            socket.to(recipientSocket).emit("clear-chat-accepted");
        }
        // Messages are deleted via API call from client
    });

    socket.on("clear-chat-reject", (data) => {
        const { to, from } = data;
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
            socket.to(recipientSocket).emit("clear-chat-rejected");
        }
    });

    socket.on("edit-msg", (data) => {
        const { to, msgId, text } = data;
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
            socket.to(recipientSocket).emit("msg-edited", { msgId, text });
        }
    });

    socket.on("delete-msg", (data) => {
        const { to, msgId } = data;
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
            socket.to(recipientSocket).emit("msg-deleted", { msgId });
        }
    });

    socket.on("typing", (data) => {
        const { to, from } = data;
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
            socket.to(recipientSocket).emit("user-typing", { from });
        }
    });

    socket.on("stop-typing", (data) => {
        const { to, from } = data;
        const recipientSocket = onlineUsers.get(to);
        if (recipientSocket) {
            socket.to(recipientSocket).emit("user-stop-typing", { from });
        }
    });

    // Group messaging
    socket.on("send-group-msg", (data) => {
        const { groupId, senderId, sender, senderAvatar, msg, id } = data;
        // Broadcast to all clients (they will filter by groupId)
        socket.broadcast.emit("group-msg-recieve", {
            groupId,
            senderId,
            sender,
            senderAvatar,
            msg,
            id,
        });
    });

    socket.on("disconnect", () => {
        // Find and remove the user from onlineUsers
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                // Broadcast user is offline
                io.emit("user-offline", { userId });
                break;
            }
        }
    });
});
