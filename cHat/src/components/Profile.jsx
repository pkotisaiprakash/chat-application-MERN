import React, { useState, useEffect } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BiPowerOff, BiEdit } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import { setAvatarRoute, deleteAvatarRoute, updateAboutRoute, updateUsernameRoute } from "../utils/APIRoutes";

export default function Profile({ user, onClose, onUpdate }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState(user?.username || "");
    const [about, setAbout] = useState(user?.about || "Hey there! I'm using Snappy.");
    const [isEditing, setIsEditing] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(user?.avatarImage || null);
    const [saveStatus, setSaveStatus] = useState("");
    const fileInputRef = React.useRef();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const handleDeleteProfile = async () => {
        const confirmed = window.confirm(
            '⚠️ WARNING: This will permanently delete your profile and all your messages. Are you absolutely sure?'
        );
        
        if (!confirmed) return;

        const doubleConfirm = window.prompt(
            'Type your username "' + user?.username + '" to confirm deletion:'
        );

        if (doubleConfirm !== user?.username) {
            alert('Username does not match. Profile not deleted.');
            return;
        }

        try {
            setSaveStatus("Deleting profile...");
            await axios.delete(`${deleteAvatarRoute.split('/').slice(0, -2).join('/')}/deleteprofile/${user._id}`);
            
            localStorage.clear();
            setSaveStatus("Profile deleted successfully!");
            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (err) {
            console.error('Error deleting profile:', err);
            setSaveStatus("Error deleting profile. Please try again.");
            setTimeout(() => setSaveStatus(""), 3000);
        }
    };

    const handleSave = async () => {
        try {
            setSaveStatus("Saving...");
            const updatedUser = { ...user, username, about };

            // Update username if changed
            if (username !== user?.username) {
                try {
                    const { data } = await axios.put(`${updateUsernameRoute}/${user._id}`, {
                        username,
                    });
                    if (!data.status) {
                        setSaveStatus(data.msg || "Username update failed");
                        setTimeout(() => setSaveStatus(""), 3000);
                        return;
                    }
                    updatedUser.username = data.username;
                } catch (err) {
                    console.error('Error updating username:', err);
                    setSaveStatus("Username update failed");
                    setTimeout(() => setSaveStatus(""), 3000);
                    return;
                }
            }

            // If user uploaded a custom avatar, send it to server
            if (uploadPreview && uploadPreview !== user?.avatarImage) {
                try {
                    // Send the full data URL (with mime type) so valid images render correctly
                    const { data } = await axios.post(`${setAvatarRoute}/${user._id}`, {
                        image: uploadPreview,
                    });

                    if (data.isSet) {
                        updatedUser.isAvatarImageSet = true;
                        updatedUser.avatarImage = data.image; // This will now be the full data URL
                        setUploadPreview(data.image);
                    }
                } catch (err) {
                    console.error('Error uploading avatar:', err);
                    setSaveStatus("Avatar upload failed");
                    setTimeout(() => setSaveStatus(""), 3000);
                    return;
                }
            }

            // Update about if changed
            if (about !== user?.about) {
                try {
                    await axios.put(`${updateAboutRoute}/${user._id}`, {
                        about,
                    });
                    updatedUser.about = about;
                } catch (err) {
                    console.error('Error updating about:', err);
                }
            }

            localStorage.setItem("chat-app-user", JSON.stringify(updatedUser));

            // Dispatch event to update other components (Contacts, etc.)
            window.dispatchEvent(new Event("user-update"));

            setIsEditing(false);
            setSaveStatus("Saved!");
            setTimeout(() => setSaveStatus(""), 2000);
            if (onUpdate) onUpdate(updatedUser);
        } catch (error) {
            console.error("Error updating profile:", error);
            setSaveStatus("Error saving");
            setTimeout(() => setSaveStatus(""), 3000);
        }
    };

    const handleDeleteAvatar = async () => {
        try {
            setSaveStatus("Deleting avatar...");
            const { data } = await axios.delete(`${deleteAvatarRoute}/${user._id}`);
            if (!data.isSet) {
                const updatedUser = { ...user, isAvatarImageSet: false, avatarImage: "" };
                localStorage.setItem("chat-app-user", JSON.stringify(updatedUser));
                // Dispatch event to update other components
                window.dispatchEvent(new Event("user-update"));

                setUploadPreview("");
                setSaveStatus("Avatar deleted!");
                setTimeout(() => setSaveStatus(""), 2000);
                if (onUpdate) onUpdate(updatedUser);
            }
        } catch (err) {
            console.error('Error deleting avatar:', err);
            setSaveStatus("Delete failed");
            setTimeout(() => setSaveStatus(""), 3000);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            // Store the full data URL (already includes mime type)
            setUploadPreview(result);
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current && fileInputRef.current.click();
    };

    return (
        <div
            className="profile-modal-overlay"
            onClick={onClose}
        >
            <div
                className="profile-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="profile-header">
                    <h2 className="profile-title">Profile</h2>
                    <button
                        onClick={onClose}
                        className="profile-close-btn"
                    >
                        ×
                    </button>
                </div>

                {/* Two Column Layout */}
                <div className="profile-body">
                    {/* Left Column - Avatar */}
                    <div className="profile-left">
                        <div className="profile-avatar-section">
                            <div className="profile-avatar">
                                <img
                                    src={uploadPreview && uploadPreview.startsWith('data:') ? uploadPreview : `data:image/svg+xml;base64,${uploadPreview || user?.avatarImage}`}
                                    alt="avatar"
                                />
                            </div>
                            <div className="profile-avatar-actions">
                                <button
                                    className="profile-change-avatar"
                                    onClick={triggerFileInput}
                                >
                                    <BiEdit /> Upload
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                {uploadPreview && (uploadPreview.startsWith('data:') || uploadPreview !== user?.avatarImage) && (
                                    <button
                                        onClick={handleSave}
                                        className="profile-save-avatar"
                                    >
                                        ✓ Save
                                    </button>
                                )}
                                {user?.isAvatarImageSet && (
                                    <button
                                        onClick={handleDeleteAvatar}
                                        className="profile-delete-avatar"
                                    >
                                        🗑 Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Save Status */}
                        {saveStatus && (
                            <div className={`profile-save-status ${saveStatus.includes('Error') || saveStatus.includes('error') ? 'error' : 'success'}`}>
                                {saveStatus}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Details */}
                    <div className="profile-right">
                        {/* Username */}
                        <div className="profile-field">
                            <label>Username</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="profile-input"
                                />
                            ) : (
                                <div className="profile-display-value">
                                    <span>{username}</span>
                                    <button
                                        className="profile-edit-btn"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        ✎
                                    </button>
                                </div>
                            )}
                            {isEditing && (
                                <div className="profile-edit-actions">
                                    <button
                                        onClick={handleSave}
                                        className="profile-save-btn"
                                    >
                                        ✓ Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUsername(user?.username || "");
                                            setIsEditing(false);
                                        }}
                                        className="profile-cancel-btn"
                                    >
                                        ✕ Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Email (Read-only) */}
                        <div className="profile-field">
                            <label>Email</label>
                            <div className="profile-display-value readonly">
                                {user?.email || "Not set"}
                            </div>
                        </div>

                        {/* About */}
                        <div className="profile-field">
                            <label>About</label>
                            {isEditing ? (
                                <>
                                    <textarea
                                        value={about}
                                        onChange={(e) => setAbout(e.target.value)}
                                        className="profile-textarea"
                                        rows="4"
                                    />
                                    <div className="profile-edit-actions">
                                        <button
                                            onClick={handleSave}
                                            className="profile-save-btn"
                                        >
                                            ✓ Done
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAbout(user?.about || "Hey there! I'm using Snappy.");
                                                setIsEditing(false);
                                            }}
                                            className="profile-cancel-btn"
                                        >
                                            ✕ Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="profile-display-value about-value">
                                    <span>{about}</span>
                                    <button
                                        className="profile-edit-btn"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        ✎
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="profile-actions">
                            {!isEditing && (
                                <>
                                    <button
                                        onClick={() => {
                                            const confirmed = window.confirm('Are you sure you want to logout?');
                                            if (confirmed) handleLogout();
                                        }}
                                        className="profile-logout"
                                    >
                                        <BiPowerOff /> Logout
                                    </button>
                                    <button
                                        onClick={handleDeleteProfile}
                                        className="profile-delete-btn"
                                    >
                                        <MdDelete /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
