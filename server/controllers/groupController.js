const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");

// Create a new group
module.exports.createGroup = async (req, res, next) => {
    try {
        const { groupName, description, members, adminId, avatarImage } = req.body;

        if (!groupName || !adminId) {
            return res.json({ msg: "Group name and admin ID required", status: false });
        }

        // Ensure admin is in members list
        const membersList = Array.isArray(members) ? members : [];
        if (!membersList.includes(adminId)) {
            membersList.push(adminId);
        }

        const groupData = {
            name: groupName,
            description: description || "",
            admin: adminId,
            members: membersList,
        };

        if (avatarImage) {
            groupData.avatarImage = avatarImage;
            groupData.isAvatarImageSet = true;
        }

        const group = await Group.create(groupData);

        const populatedGroup = await Group.findById(group._id).populate("members", "username avatarImage");

        console.log("✅ Group created:", group._id);
        return res.json({ status: true, msg: "Group created successfully", data: populatedGroup });
    } catch (ex) {
        console.error("❌ Error creating group:", ex);
        return res.json({ msg: "Error creating group: " + ex.message, status: false });
    }
};

// Get all groups for a user
module.exports.getUserGroups = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const groups = await Group.find({
            members: userId,
        })
            .populate("admin", "username avatarImage")
            .populate("members", "username avatarImage")
            .sort({ updatedAt: -1 });

        return res.json(groups);
    } catch (ex) {
        console.error("❌ Error getting user groups:", ex);
        return res.json({ msg: "Error getting groups", status: false });
    }
};

// Get group details
module.exports.getGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId)
            .populate("admin", "username avatarImage")
            .populate("members", "username avatarImage");

        if (!group) {
            return res.json({ msg: "Group not found", status: false });
        }

        return res.json(group);
    } catch (ex) {
        console.error("❌ Error getting group:", ex);
        return res.json({ msg: "Error getting group", status: false });
    }
};

// Add member to group
module.exports.addMember = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { userId, adminId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ msg: "Group not found", status: false });
        }

        // Check if requester is admin
        if (group.admin.toString() !== adminId) {
            return res.json({ msg: "Only admin can add members", status: false });
        }

        // Check if user already in group
        if (group.members.includes(userId)) {
            return res.json({ msg: "User already in group", status: false });
        }

        group.members.push(userId);
        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate("admin", "username avatarImage")
            .populate("members", "username avatarImage");

        console.log("✅ Member added to group:", groupId);
        return res.json({ status: true, msg: "Member added successfully", data: updatedGroup });
    } catch (ex) {
        console.error("❌ Error adding member:", ex);
        return res.json({ msg: "Error adding member", status: false });
    }
};

// Remove member from group
module.exports.removeMember = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { userId, adminId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ msg: "Group not found", status: false });
        }

        // Check if requester is admin (except if removing self)
        if (userId !== adminId && group.admin.toString() !== adminId) {
            return res.json({ msg: "Only admin can remove members", status: false });
        }

        group.members = group.members.filter((id) => id.toString() !== userId);
        
        // If admin left, transfer admin to first member
        if (group.admin.toString() === userId && group.members.length > 0) {
            group.admin = group.members[0];
        }
        
        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate("admin", "username avatarImage")
            .populate("members", "username avatarImage");

        console.log("✅ Member removed from group:", groupId);
        return res.json({ status: true, msg: "Member removed successfully", data: updatedGroup });
    } catch (ex) {
        console.error("❌ Error removing member:", ex);
        return res.json({ msg: "Error removing member", status: false });
    }
};

// Update group details
module.exports.updateGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { adminId, name, description, avatarImage, onlyAdminsCanMessage } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ msg: "Group not found", status: false });
        }

        // Check if requester is admin
        if (group.admin.toString() !== adminId) {
            return res.json({ msg: "Only admin can update group", status: false });
        }

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (avatarImage) {
            group.avatarImage = avatarImage;
            group.isAvatarImageSet = true;
        }
        if (onlyAdminsCanMessage !== undefined) {
            group.onlyAdminsCanMessage = onlyAdminsCanMessage;
        }

        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate("admin", "username avatarImage")
            .populate("members", "username avatarImage");

        console.log("✅ Group updated:", groupId);
        return res.json({ status: true, msg: "Group updated successfully", data: updatedGroup });
    } catch (ex) {
        console.error("❌ Error updating group:", ex);
        return res.json({ msg: "Error updating group", status: false });
    }
};

// Delete group (admin only)
module.exports.deleteGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { adminId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ msg: "Group not found", status: false });
        }

        // Check if requester is admin
        if (group.admin.toString() !== adminId) {
            return res.json({ msg: "Only admin can delete group", status: false });
        }

        // Delete all group messages
        await GroupMessage.deleteMany({ group: groupId });
        
        // Delete group
        await Group.findByIdAndDelete(groupId);

        console.log("✅ Group deleted:", groupId);
        return res.json({ status: true, msg: "Group deleted successfully" });
    } catch (ex) {
        console.error("❌ Error deleting group:", ex);
        return res.json({ msg: "Error deleting group", status: false });
    }
};

// Get group messages
module.exports.getGroupMessages = async (req, res, next) => {
    try {
        const { groupId } = req.params;

        const messages = await GroupMessage.find({
            group: groupId,
            isDeleted: false,
        })
            .populate("sender", "username avatarImage")
            .populate("isRead", "username avatarImage")
            .sort({ createdAt: 1 })
            .limit(50);

        return res.json(messages);
    } catch (ex) {
        console.error("❌ Error getting group messages:", ex);
        return res.json({ msg: "Error getting messages", status: false });
    }
};

// Send group message
module.exports.sendGroupMessage = async (req, res, next) => {
    try {
        const { groupId, senderId, message } = req.body;

        if (!groupId || !senderId || !message) {
            return res.json({ msg: "Missing required fields", status: false });
        }

        // Check if group exists and user is member
        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ msg: "Group not found", status: false });
        }

        if (!group.members.includes(senderId)) {
            return res.json({ msg: "You are not a member of this group", status: false });
        }

        // Check if only admins can send messages
        if (group.onlyAdminsCanMessage && group.admin.toString() !== senderId) {
            return res.json({ msg: "Only admins can send messages in this group", status: false });
        }

        // message may be string or object { text, fileUrl }
        const messageObj = typeof message === 'string' ? { text: message } : (message || {});

        const groupMsg = await GroupMessage.create({
            group: groupId,
            sender: senderId,
            message: { text: messageObj.text || null, fileUrl: messageObj.fileUrl || null },
        });

        const populatedMsg = await GroupMessage.findById(groupMsg._id).populate(
            "sender",
            "username avatarImage"
        );

        console.log("✅ Group message sent:", groupMsg._id);
        return res.json({ status: true, msg: "Message sent", data: populatedMsg });
    } catch (ex) {
        console.error("❌ Error sending group message:", ex);
        return res.json({ msg: "Error sending message", status: false });
    }
};

// Mark group messages as seen for a user
module.exports.markGroupMessagesSeen = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;

        if (!groupId || !userId) return res.json({ status: false, msg: 'Missing fields' });

        // Add userId to isRead array for messages that don't already have it
        await GroupMessage.updateMany(
            { group: groupId, isDeleted: false, isRead: { $ne: userId } },
            { $addToSet: { isRead: userId } }
        );

        return res.json({ status: true, msg: 'Marked as seen' });
    } catch (ex) {
        console.error('❌ Error marking group messages seen:', ex);
        return res.json({ status: false, msg: 'Error' });
    }
};

// Change group admin (transfer admin role)
module.exports.changeAdmin = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { currentAdminId, newAdminId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ msg: "Group not found", status: false });
        }

        // Check if requester is current admin
        if (group.admin.toString() !== currentAdminId) {
            return res.json({ msg: "Only current admin can transfer admin role", status: false });
        }

        // Check if new admin is a member of the group
        if (!group.members.includes(newAdminId)) {
            return res.json({ msg: "New admin must be a group member", status: false });
        }

        group.admin = newAdminId;
        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate("admin", "username avatarImage")
            .populate("members", "username avatarImage");

        console.log("✅ Admin changed in group:", groupId);
        return res.json({ status: true, msg: "Admin role transferred successfully", data: updatedGroup });
    } catch (ex) {
        console.error("❌ Error changing admin:", ex);
        return res.json({ msg: "Error changing admin", status: false });
    }
};

// Leave group (for members)
module.exports.leaveGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ msg: "Group not found", status: false });
        }

        // Check if user is a member
        if (!group.members.includes(userId)) {
            return res.json({ msg: "You are not a member of this group", status: false });
        }

        // If user is admin, transfer admin to first member or delete group if no other members
        if (group.admin.toString() === userId) {
            if (group.members.length > 1) {
                // Transfer admin to first other member
                const otherMembers = group.members.filter(id => id.toString() !== userId);
                group.admin = otherMembers[0];
            } else {
                // No other members, delete the group
                await GroupMessage.deleteMany({ group: groupId });
                await Group.findByIdAndDelete(groupId);
                console.log("✅ Group deleted (admin left with no other members):", groupId);
                return res.json({ status: true, msg: "Group deleted successfully", deleted: true });
            }
        }

        group.members = group.members.filter(id => id.toString() !== userId);
        await group.save();

        console.log("✅ User left group:", groupId);
        return res.json({ status: true, msg: "Left group successfully" });
    } catch (ex) {
        console.error("❌ Error leaving group:", ex);
        return res.json({ msg: "Error leaving group", status: false });
    }
};
