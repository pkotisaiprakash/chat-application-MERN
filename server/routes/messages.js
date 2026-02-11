const { addMessage, getMessages, editMessage, deleteMessage, clearChat } = require("../controllers/messageController");
const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);
router.put("/editmsg/:msgId", editMessage);
router.delete("/deletemsg/:msgId", deleteMessage);
router.post("/clearchat/", clearChat);

module.exports = router;
