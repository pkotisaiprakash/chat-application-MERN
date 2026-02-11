import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    getGroupMessagesRoute,
    sendGroupMessageRoute,
    host,
    updateGroupRoute,
    addGroupMemberRoute,
    removeGroupMemberRoute,
    changeGroupAdminRoute,
    leaveGroupRoute,
    getUserByUsernameRoute,
} from "../utils/APIRoutes";
import { FiArrowLeft, FiSettings, FiX, FiUser, FiUserPlus, FiUserMinus, FiShield, FiEdit2, FiTrash2 } from "react-icons/fi";
import "./GroupChat.css";

export default function GroupChat({ group, currentUser, socket, onBack, isMobile, onGroupUpdated, onGroupDeleted }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [editName, setEditName] = useState(group?.name || "");
    const [isEditingName, setIsEditingName] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberUsername, setNewMemberUsername] = useState("");
    const [selectedMemberForAdmin, setSelectedMemberForAdmin] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [onlyAdminsCanMessage, setOnlyAdminsCanMessage] = useState(group?.onlyAdminsCanMessage || false);
    const scrollRef = useRef();

    const isAdmin = group?.admin?._id === currentUser?._id || group?.admin === currentUser?._id;

    useEffect(() => {
        if (group) {
            fetchGroupMessages();
            
            // After fetching, mark messages as seen for this user
            markMessagesSeen();

            // Listen for new group messages
            if (socket && socket.current) {
                socket.current.on("group-msg-recieve", handleNewMessage);
                socket.current.on("group-updated", handleGroupUpdated);
                
                return () => {
                    socket.current.off("group-msg-recieve", handleNewMessage);
                    socket.current.off("group-updated", handleGroupUpdated);
                };
            }
        }
    }, [group, socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (group) {
            setEditName(group.name || "");
            setOnlyAdminsCanMessage(group.onlyAdminsCanMessage || false);
        }
    }, [group]);

    const fetchGroupMessages = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(
                `http://${window.location.hostname}:3001/api/groups/${group._id}/messages`
            );
            setMessages(response.data || []);
        } catch (err) {
            console.error("Error fetching group messages:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const markMessagesSeen = async () => {
        try {
            if (!currentUser || !group) return;
            await axios.post(
                `${getGroupMessagesRoute}/${group._id}/seen`,
                { userId: currentUser._id }
            );
        } catch (err) {
            console.error('Error marking group messages seen:', err);
        }
    };

    const handleNewMessage = (data) => {
        if (data.groupId === group._id) {
            setMessages((prev) => [...prev, {
                _id: data.id,
                sender: {
                    _id: data.senderId,
                    username: data.sender,
                    avatarImage: data.senderAvatar,
                },
                message: { text: data.msg },
                createdAt: new Date().toISOString(),
            }]);
        }
    };

    const handleGroupUpdated = (data) => {
        if (data.groupId === group._id) {
            if (data.type === 'member-added' || data.type === 'member-removed' || data.type === 'admin-changed' || data.type === 'name-changed') {
                fetchGroupMessages();
                if (onGroupUpdated) onGroupUpdated();
            }
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const messageText = newMessage;
        setNewMessage("");

        try {
            const response = await axios.post(
                `http://${window.location.hostname}:3001/api/groups/${group._id}/message`,
                {
                    groupId: group._id,
                    senderId: currentUser._id,
                    message: messageText,
                }
            );

            if (response.data.status) {
                const newMsg = response.data.data;
                setMessages((prev) => [...prev, newMsg]);

                // Emit to other users
                if (socket && socket.current) {
                    socket.current.emit("send-group-msg", {
                        groupId: group._id,
                        senderId: currentUser._id,
                        sender: currentUser.username,
                        senderAvatar: currentUser.avatarImage,
                        msg: messageText,
                        id: newMsg._id,
                    });
                }
            }
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const handleUpdateGroupName = async () => {
        if (!editName.trim() || editName === group.name) {
            setIsEditingName(false);
            return;
        }

        try {
            const response = await axios.put(
                `http://${window.location.hostname}:3001/api/groups/${group._id}`,
                {
                    adminId: currentUser._id,
                    name: editName.trim(),
                }
            );

            if (response.data.status) {
                setIsEditingName(false);
                if (socket && socket.current) {
                    socket.current.emit("group-update", {
                        groupId: group._id,
                        type: "name-changed",
                        data: response.data.data,
                    });
                }
                if (onGroupUpdated) onGroupUpdated();
            }
        } catch (err) {
            console.error("Error updating group name:", err);
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            const response = await axios.post(
                `http://${window.location.hostname}:3001/api/groups/${group._id}/remove-member`,
                {
                    userId: memberId,
                    adminId: currentUser._id,
                }
            );

            if (response.data.status) {
                if (socket && socket.current) {
                    socket.current.emit("group-update", {
                        groupId: group._id,
                        type: "member-removed",
                        data: response.data.data,
                    });
                }
                if (onGroupUpdated) onGroupUpdated();
            }
        } catch (err) {
            console.error("Error removing member:", err);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberUsername.trim()) return;

        try {
            // First, get user by username
            const userResponse = await axios.get(
                `${getUserByUsernameRoute}/${newMemberUsername.trim()}`
            );

            if (!userResponse.data || !userResponse.data._id) {
                alert("User not found");
                return;
            }

            const userId = userResponse.data._id;

            // Add user to group
            const response = await axios.post(
                `http://${window.location.hostname}:3001/api/groups/${group._id}/add-member`,
                {
                    userId: userId,
                    adminId: currentUser._id,
                }
            );

            if (response.data.status) {
                setShowAddMember(false);
                setNewMemberUsername("");
                if (socket && socket.current) {
                    socket.current.emit("group-update", {
                        groupId: group._id,
                        type: "member-added",
                        data: response.data.data,
                    });
                }
                if (onGroupUpdated) onGroupUpdated();
            }
        } catch (err) {
            console.error("Error adding member:", err);
            alert("Error adding member: " + (err.response?.data?.msg || err.message));
        }
    };

    const handleChangeAdmin = async (memberId) => {
        try {
            const response = await axios.post(
                `http://${window.location.hostname}:3001/api/groups/${group._id}/change-admin`,
                {
                    currentAdminId: currentUser._id,
                    newAdminId: memberId,
                }
            );

            if (response.data.status) {
                setSelectedMemberForAdmin(null);
                if (socket && socket.current) {
                    socket.current.emit("group-update", {
                        groupId: group._id,
                        type: "admin-changed",
                        data: response.data.data,
                    });
                }
                if (onGroupUpdated) onGroupUpdated();
            }
        } catch (err) {
            console.error("Error changing admin:", err);
        }
    };

    const handleDeleteGroup = async () => {
        try {
            const response = await axios.delete(
                `http://${window.location.hostname}:3001/api/groups/${group._id}`,
                {
                    data: { adminId: currentUser._id }
                }
            );

            if (response.data.status) {
                setShowConfirmModal(false);
                if (onGroupDeleted) onGroupDeleted();
            }
        } catch (err) {
            console.error("Error deleting group:", err);
        }
    };

    const handleLeaveGroup = async () => {
        try {
            const response = await axios.post(
                `http://${window.location.hostname}:3001/api/groups/${group._id}/leave`,
                {
                    userId: currentUser._id,
                }
            );

            if (response.data.status) {
                setShowConfirmModal(false);
                if (onGroupDeleted) onGroupDeleted();
            }
        } catch (err) {
            console.error("Error leaving group:", err);
        }
    };

    const confirmActionHandler = () => {
        if (confirmAction === 'delete') {
            handleDeleteGroup();
        } else if (confirmAction === 'leave') {
            handleLeaveGroup();
        }
    };

    const handleToggleAdminsOnlyMessaging = async () => {
        try {
            const response = await axios.put(
                `http://${window.location.hostname}:3001/api/groups/${group._id}`,
                {
                    adminId: currentUser._id,
                    onlyAdminsCanMessage: !onlyAdminsCanMessage,
                }
            );

            if (response.data.status) {
                setOnlyAdminsCanMessage(!onlyAdminsCanMessage);
                if (socket && socket.current) {
                    socket.current.emit("group-update", {
                        groupId: group._id,
                        type: "settings-changed",
                        data: response.data.data,
                    });
                }
                if (onGroupUpdated) onGroupUpdated();
            }
        } catch (err) {
            console.error("Error updating group settings:", err);
        }
    };

    const getAvatar = (avatarImage, username) => {
        if (avatarImage) {
            return avatarImage.startsWith("data:") 
                ? avatarImage 
                : `data:image/svg+xml;base64,${avatarImage}`;
        }
        return null;
    };

    return (
        <div className="group-chat-container">
            {/* Header */}
            <div className="group-chat-header">
                {isMobile && (
                    <button
                        onClick={onBack}
                        className="back-button"
                    >
                        <FiArrowLeft className="text-xl" />
                    </button>
                )}
                <div className="group-header-info">
                    {group.isAvatarImageSet && (
                        <img
                            src={getAvatar(group.avatarImage, group.name)}
                            alt={group.name}
                            className="group-header-avatar"
                        />
                    )}
                    <div>
                        <h3 className="group-header-title">{group.name}</h3>
                        <p className="group-header-members">
                            {group.members?.length} members
                        </p>
                    </div>
                </div>
                <button 
                    className="settings-button"
                    onClick={() => setShowSettings(true)}
                >
                    <FiSettings className="text-xl" />
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-modal-header">
                            <h2>Group Settings</h2>
                            <button className="close-button" onClick={() => setShowSettings(false)}>
                                <FiX />
                            </button>
                        </div>
                        
                        <div className="settings-modal-content">
                            {/* Group Name (Admin only) */}
                            {isAdmin && (
                                <div className="setting-item">
                                    <label>Group Name</label>
                                    <div className="edit-name-row">
                                        {isEditingName ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="edit-name-input"
                                                />
                                                <button 
                                                    className="save-name-btn"
                                                    onClick={handleUpdateGroupName}
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    className="cancel-name-btn"
                                                    onClick={() => {
                                                        setEditName(group.name);
                                                        setIsEditingName(false);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="group-name-display">{group.name}</span>
                                                <button 
                                                    className="edit-name-btn"
                                                    onClick={() => setIsEditingName(true)}
                                                >
                                                    <FiEdit2 /> Edit
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Admin Info */}
                            <div className="setting-item">
                                <label>Admin</label>
                                <div className="admin-info">
                                    {group.admin && (
                                        <>
                                            <div className="admin-avatar">
                                                {group.admin.avatarImage ? (
                                                    <img 
                                                        src={getAvatar(group.admin.avatarImage, group.admin.username)} 
                                                        alt={group.admin.username}
                                                    />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {group.admin.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span>{group.admin.username}</span>
                                            {isAdmin && (
                                                <button 
                                                    className="transfer-admin-btn"
                                                    onClick={() => {
                                                        const nonAdminMembers = group.members.filter(m => m._id !== group.admin._id);
                                                        if (nonAdminMembers.length > 0) {
                                                            setSelectedMemberForAdmin(nonAdminMembers[0]._id);
                                                        }
                                                    }}
                                                >
                                                    Transfer Admin
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Members List */}
                            <div className="setting-item">
                                <label>Members ({group.members?.length})</label>
                                <div className="members-list">
                                    {group.members?.map((member) => (
                                        <div key={member._id} className="member-item">
                                            <div className="member-avatar">
                                                {member.avatarImage ? (
                                                    <img 
                                                        src={getAvatar(member.avatarImage, member.username)} 
                                                        alt={member.username}
                                                    />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {member.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="member-info">
                                                <span className="member-name">
                                                    {member.username}
                                                    {member._id === group.admin?._id && (
                                                        <FiShield className="admin-badge" title="Admin" />
                                                    )}
                                                </span>
                                            </div>
                                            {isAdmin && member._id !== group.admin?._id && (
                                                <div className="member-actions">
                                                    <button 
                                                        className="make-admin-btn"
                                                        onClick={() => setSelectedMemberForAdmin(member._id)}
                                                        title="Make Admin"
                                                    >
                                                        <FiShield />
                                                    </button>
                                                    <button 
                                                        className="remove-member-btn"
                                                        onClick={() => handleRemoveMember(member._id)}
                                                        title="Remove"
                                                    >
                                                        <FiUserMinus />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add Member (Admin only) */}
                            {isAdmin && (
                                <div className="setting-item">
                                    <label>Add Member</label>
                                    {showAddMember ? (
                                        <div className="add-member-row">
                                            <input
                                                type="text"
                                                value={newMemberUsername}
                                                onChange={(e) => setNewMemberUsername(e.target.value)}
                                                placeholder="Enter username"
                                                className="add-member-input"
                                            />
                                            <button 
                                                className="add-member-btn"
                                                onClick={handleAddMember}
                                            >
                                                Add
                                            </button>
                                            <button 
                                                className="cancel-add-btn"
                                                onClick={() => {
                                                    setShowAddMember(false);
                                                    setNewMemberUsername("");
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            className="show-add-member-btn"
                                            onClick={() => setShowAddMember(true)}
                                        >
                                            <FiUserPlus /> Add Member
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Only Admins Can Message Toggle (Admin only) */}
                            {isAdmin && (
                                <div className="setting-item">
                                    <label>Messaging Settings</label>
                                    <div className="toggle-setting-row">
                                        <span className="toggle-label">Only admins can send messages</span>
                                        <button 
                                            className={`toggle-btn ${onlyAdminsCanMessage ? 'active' : ''}`}
                                            onClick={handleToggleAdminsOnlyMessaging}
                                        >
                                            <span className="toggle-slider"></span>
                                        </button>
                                    </div>
                                    <p className="setting-description">
                                        {onlyAdminsCanMessage 
                                            ? "Only group admins can send messages in this group"
                                            : "All group members can send messages"}
                                    </p>
                                </div>
                            )}

                            {/* Transfer Admin Confirmation */}
                            {selectedMemberForAdmin && (
                                <div className="confirm-modal">
                                    <p>Are you sure you want to transfer admin role to this member?</p>
                                    <div className="confirm-buttons">
                                        <button 
                                            className="confirm-btn"
                                            onClick={() => handleChangeAdmin(selectedMemberForAdmin)}
                                        >
                                            Yes, Transfer
                                        </button>
                                        <button 
                                            className="cancel-btn"
                                            onClick={() => setSelectedMemberForAdmin(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="settings-actions">
                                {isAdmin ? (
                                    <button 
                                        className="delete-group-btn"
                                        onClick={() => {
                                            setConfirmAction('delete');
                                            setShowConfirmModal(true);
                                        }}
                                    >
                                        <FiTrash2 /> Delete Group
                                    </button>
                                ) : (
                                    <button 
                                        className="leave-group-btn"
                                        onClick={() => {
                                            setConfirmAction('leave');
                                            setShowConfirmModal(true);
                                        }}
                                    >
                                        <FiUserMinus /> Leave Group
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirm Action</h3>
                        <p>
                            {confirmAction === 'delete' 
                                ? "Are you sure you want to delete this group? This action cannot be undone."
                                : "Are you sure you want to leave this group?"}
                        </p>
                        <div className="confirm-buttons">
                            <button 
                                className="confirm-btn danger"
                                onClick={confirmActionHandler}
                            >
                                {confirmAction === 'delete' ? 'Delete' : 'Leave'}
                            </button>
                            <button 
                                className="cancel-btn"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="group-messages" ref={scrollRef}>
                {isLoading ? (
                    <p className="text-center text-gray-400 py-8">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">
                        No messages yet. Start the conversation!
                    </p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`group-message ${
                                msg.sender._id === currentUser._id ? "self" : "other"
                            }`}
                        >
                            {msg.sender._id !== currentUser._id && (
                                <div className="message-avatar">
                                    {msg.sender.avatarImage ? (
                                        <img
                                            src={getAvatar(msg.sender.avatarImage, msg.sender.username)}
                                            alt={msg.sender.username}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {msg.sender.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className={`message-content ${msg.sender._id === currentUser._id ? "self-content" : "other-content"}`}>
                                {msg.sender._id !== currentUser._id && (
                                    <p className="sender-name">{msg.sender.username}</p>
                                )}
                                <div className="message-bubble">
                                    {msg.message.fileUrl ? (
                                    (msg.message.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) ? (
                                            <img src={`${host}${msg.message.fileUrl}`} alt="file" className="max-w-xs rounded-md" />
                                        ) : (
                                            <a href={`${host}${msg.message.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-200 underline">Open file</a>
                                        )
                                    ) : (
                                        msg.message.text
                                    )}
                                </div>
                                <p className="message-time">{formatTime(msg.createdAt)}</p>
                                {/* Seen avatars for messages sent by current user */}
                                {msg.sender._id === currentUser._id && msg.isRead && msg.isRead.length > 0 && (
                                    <div className="seen-avatars mt-1 flex items-center -space-x-2">
                                        {msg.isRead.slice(0, 5).map((u) => (
                                            <img key={u._id} src={u.avatarImage?.startsWith('data:') ? u.avatarImage : `data:image/svg+xml;base64,${u.avatarImage}`} alt={u.username} className="w-5 h-5 rounded-full border-2 border-white" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="group-message-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="send-button"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
