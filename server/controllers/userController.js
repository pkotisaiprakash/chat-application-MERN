const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOTPEmail } = require("../utils/emailService");

module.exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const usernameCheck = await User.findOne({ username });
        if (usernameCheck)
            return res.json({ msg: "Username already used", status: false });
        const emailCheck = await User.findOne({ email });
        if (emailCheck)
            return res.json({ msg: "Email already used", status: false });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            username,
            op: password,
            password: hashedPassword,
        });
        delete user.password;
        return res.json({ status: true, user });
    } catch (ex) {
        next(ex);
    }
};

module.exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        // Check for username OR email
        const user = await User.findOne({
            $or: [{ username: username }, { email: username }]
        });
        if (!user)
            return res.json({ msg: "Incorrect Username/Email or Password", status: false });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.json({ msg: "Incorrect Username or Password", status: false });
        delete user.password;

        // Generate JWT
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });

        return res.json({ status: true, user, token });
    } catch (ex) {
        next(ex);
    }
};

module.exports.setAvatar = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const avatarImage = req.body.image;
        const userData = await User.findByIdAndUpdate(
            userId,
            {
                isAvatarImageSet: true,
                avatarImage,
            },
            { new: true }
        );
        return res.json({
            isSet: userData.isAvatarImageSet,
            image: userData.avatarImage,
        });
    } catch (ex) {
        next(ex);
    }
};

module.exports.getAllUsers = async (req, res, next) => {
    try {
        // Exclude the current user from the list
        const users = await User.find({ _id: { $ne: req.params.id } }).select([
            "email",
            "username",
            "avatarImage",
            "about",
            "_id",
        ]);

        // For each user, compute last message timestamp with current user for sorting
        const Message = require('../models/Message');
        const enriched = await Promise.all(users.map(async (u) => {
            const last = await Message.findOne({ users: { $all: [req.params.id, u._id] } }).sort({ createdAt: -1 }).select('createdAt');
            return {
                _id: u._id,
                username: u.username,
                email: u.email,
                avatarImage: u.avatarImage,
                about: u.about,
                lastMessageTime: last ? last.createdAt : null,
            };
        }));

        return res.json(enriched);
    } catch (ex) {
        next(ex);
    }
};

module.exports.deleteAvatar = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const userData = await User.findByIdAndUpdate(
            userId,
            {
                isAvatarImageSet: false,
                avatarImage: "",
            },
            { new: true }
        );
        return res.json({
            isSet: userData.isAvatarImageSet,
            image: userData.avatarImage,
            msg: "Avatar deleted successfully",
        });
    } catch (ex) {
        next(ex);
    }
};

module.exports.updateAbout = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { about } = req.body;
        const userData = await User.findByIdAndUpdate(
            userId,
            { about },
            { new: true }
        );
        return res.json({
            status: true,
            about: userData.about,
        });
    } catch (ex) {
        next(ex);
    }
};

module.exports.updateUsername = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { username } = req.body;

        // Check if username is already taken
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
            return res.json({ status: false, msg: "Username already taken" });
        }

        const userData = await User.findByIdAndUpdate(
            userId,
            { username },
            { new: true }
        );
        return res.json({
            status: true,
            username: userData.username,
        });
    } catch (ex) {
        next(ex);
    }
};

module.exports.logOut = (req, res, next) => {
    try {
        if (!req.params.id) return res.json({ msg: "User id is required " });
        // In a stateless JWT setup, logout is mostly frontend (clearing token).
        // But we can respond success here.
        return res.status(200).send();
    } catch (ex) {
        next(ex);
    }
};

module.exports.deleteProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.json({ status: false, msg: "User id is required" });
        }

        // Delete user
        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.json({ status: false, msg: "User not found" });
        }

        // Delete all messages from this user
        const Message = require("../models/Message");
        await Message.deleteMany({
            $or: [
                { from: userId },
                { to: userId }
            ]
        });

        return res.json({
            status: true,
            msg: "Profile deleted successfully"
        });
    } catch (ex) {
        next(ex);
    }
};

// Get user by username (for adding members to groups)
module.exports.getUserByUsername = async (req, res, next) => {
    try {
        const { username } = req.params;
        
        const user = await User.findOne({ username }).select([
            "email",
            "username",
            "avatarImage",
            "about",
            "_id",
        ]);
        
        if (!user) {
            return res.json({ status: false, msg: "User not found" });
        }
        
        return res.json({ status: true, data: user });
    } catch (ex) {
        console.error("❌ Error getting user by username:", ex);
        return res.json({ status: false, msg: "Error getting user" });
    }
};

// Generate OTP for password reset
module.exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ status: false, msg: "No account with this email exists" });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP and expiry (15 minutes)
        user.resetOTP = otp;
        user.resetOTPExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        
        // Send OTP via email
        await sendOTPEmail(email, otp);
        
        return res.json({ 
            status: true, 
            msg: "OTP sent to your email",
            // For development: return OTP (remove in production)
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    } catch (ex) {
        console.error("❌ Error in forgot password:", ex);
        return res.json({ status: false, msg: "Error processing request" });
    }
};

// Verify OTP
module.exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ status: false, msg: "User not found" });
        }
        
        // Check if OTP exists and is valid
        if (!user.resetOTP || !user.resetOTPExpiry) {
            return res.json({ status: false, msg: "No OTP request found. Please request a new OTP." });
        }
        
        // Check if OTP is expired
        if (new Date() > user.resetOTPExpiry) {
            // Clear expired OTP
            user.resetOTP = null;
            user.resetOTPExpiry = null;
            await user.save();
            return res.json({ status: false, msg: "OTP has expired. Please request a new one." });
        }
        
        // Verify OTP
        if (user.resetOTP !== otp) {
            return res.json({ status: false, msg: "Invalid OTP" });
        }
        
        return res.json({ status: true, msg: "OTP verified successfully" });
    } catch (ex) {
        console.error("❌ Error verifying OTP:", ex);
        return res.json({ status: false, msg: "Error verifying OTP" });
    }
};

// Reset password with verified OTP
module.exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ status: false, msg: "User not found" });
        }
        
        // Verify OTP again
        if (!user.resetOTP || !user.resetOTPExpiry) {
            return res.json({ status: false, msg: "No OTP verification found" });
        }
        
        if (new Date() > user.resetOTPExpiry) {
            user.resetOTP = null;
            user.resetOTPExpiry = null;
            await user.save();
            return res.json({ status: false, msg: "OTP has expired" });
        }
        
        if (user.resetOTP !== otp) {
            return res.json({ status: false, msg: "Invalid OTP" });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password and clear OTP
        user.password = hashedPassword;
        user.resetOTP = null;
        user.resetOTPExpiry = null;
        await user.save();
        
        return res.json({ status: true, msg: "Password reset successfully" });
    } catch (ex) {
        console.error("❌ Error resetting password:", ex);
        return res.json({ status: false, msg: "Error resetting password" });
    }
};
