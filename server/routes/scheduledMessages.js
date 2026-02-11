const {
    scheduleMessage,
    getScheduledMessages,
    cancelScheduledMessage,
    rescheduleMessage,
    sendScheduledMessage
} = require("../controllers/scheduledMessageController");
const router = require("express").Router();

router.post("/schedule", scheduleMessage);
router.get("/scheduled/:userId", getScheduledMessages);
router.put("/reschedule/:msgId", rescheduleMessage);
router.post("/cancel/:msgId", cancelScheduledMessage);
router.post("/send/:msgId", sendScheduledMessage);

module.exports = router;
