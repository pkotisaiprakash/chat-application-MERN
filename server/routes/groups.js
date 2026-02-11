const {
    createGroup,
    getUserGroups,
    getGroup,
    addMember,
    removeMember,
    updateGroup,
    deleteGroup,
    getGroupMessages,
    sendGroupMessage,
    markGroupMessagesSeen,
    changeAdmin,
    leaveGroup,
} = require("../controllers/groupController");

const router = require("express").Router();

// Group CRUD
router.post("/create", createGroup);
router.get("/user/:userId", getUserGroups);
router.get("/:groupId", getGroup);
router.put("/:groupId", updateGroup);
router.delete("/:groupId", deleteGroup);

// Group members
router.post("/:groupId/add-member", addMember);
router.post("/:groupId/remove-member", removeMember);

// Group messages
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/message", sendGroupMessage);
// Mark group messages as seen
router.post("/:groupId/seen", markGroupMessagesSeen);

// Change group admin
router.post("/:groupId/change-admin", changeAdmin);

// Leave group
router.post("/:groupId/leave", leaveGroup);

module.exports = router;
