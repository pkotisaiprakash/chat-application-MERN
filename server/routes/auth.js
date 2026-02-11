const {
    register,
    login,
    setAvatar,
    getAllUsers,
    logOut,
    deleteAvatar,
    updateAbout,
    updateUsername,
    deleteProfile,
    getUserByUsername,
    forgotPassword,
    verifyOTP,
    resetPassword,
} = require("../controllers/userController");

const router = require("express").Router();

// Health check endpoint
router.get("/test", (req, res) => {
    res.json({ status: "ok", message: "Auth API is working" });
});

router.post("/register", register);
router.post("/login", login);
router.post("/setavatar/:id", setAvatar);
router.delete("/deleteavatar/:id", deleteAvatar);
router.put("/updateabout/:id", updateAbout);
router.put("/updateusername/:id", updateUsername);
router.get("/allusers/:id", getAllUsers);
router.get("/logout/:id", logOut);
router.get("/username/:username", getUserByUsername);
router.delete("/deleteprofile/:id", deleteProfile);

// Forgot Password Routes
router.post("/forgotpassword", forgotPassword);
router.post("/verifyotp", verifyOTP);
router.post("/resetpassword", resetPassword);

module.exports = router;
