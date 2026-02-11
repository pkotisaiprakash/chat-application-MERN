import React, { useState, useEffect } from "react";
import axios from "axios";
import { getUserGroupsRoute } from "../utils/APIRoutes";
import { FiPlus, FiUsers } from "react-icons/fi";
import "./Groups.css";

export default function Groups({ currentUser, onSelectGroup, onCreateGroup }) {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchGroups();
        }
    }, [currentUser]);

    const fetchGroups = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${getUserGroupsRoute}/${currentUser._id}`);
            setGroups(response.data || []);
        } catch (err) {
            console.error("Error fetching groups:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGroupClick = (group) => {
        onSelectGroup(group);
    };

    return (
        <div className="groups-container">
            <div className="groups-header">
                <div className="groups-header-left">
                    <FiUsers className="groups-header-icon" />
                    <h3 className="groups-header-title">Groups</h3>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="create-group-btn"
                    title="Create group"
                >
                    <FiPlus className="create-group-icon" />
                </button>
            </div>

            <div className="groups-list">
                {isLoading ? (
                    <p className="loading-message">Loading groups...</p>
                ) : groups.length === 0 ? (
                    <p className="empty-message">
                        No groups yet. Create one!
                    </p>
                ) : (
                    groups.map((group) => (
                        <div
                            key={group._id}
                            onClick={() => handleGroupClick(group)}
                            className="group-item"
                        >
                            <div className="group-avatar">
                                {group.isAvatarImageSet ? (
                                    <img
                                        src={
                                            group.avatarImage.startsWith("data:")
                                                ? group.avatarImage
                                                : `data:image/svg+xml;base64,${group.avatarImage}`
                                        }
                                        alt={group.name}
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {group.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="group-info">
                                <h4 className="group-name">{group.name}</h4>
                                <p className="group-members">
                                    {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showCreateModal && (
                <CreateGroupModal
                    currentUser={currentUser}
                    onClose={() => setShowCreateModal(false)}
                    onGroupCreated={() => {
                        setShowCreateModal(false);
                        fetchGroups();
                    }}
                />
            )}
        </div>
    );
}

function CreateGroupModal({ currentUser, onClose, onGroupCreated }) {
    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    useEffect(() => {
        fetchAvailableUsers();
    }, []);

    const fetchAvailableUsers = async () => {
        try {
            const response = await axios.get(`http://${window.location.hostname}:3001/api/auth/allusers/${currentUser._id}`);
            setAvailableUsers(response.data || []);
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            alert("Please enter a group name");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                `http://${window.location.hostname}:3001/api/groups/create`,
                {
                    groupName: groupName.trim(),
                    description: description.trim(),
                    members: selectedMembers,
                    avatarImage: avatarUrl,
                    adminId: currentUser._id,
                }
            );

            if (response.data.status) {
                onGroupCreated();
            } else {
                alert(response.data.msg || "Failed to create group");
            }
        } catch (err) {
            console.error("Error creating group:", err);
            alert("Error creating group");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarUploading(true);
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await axios.post(`http://${window.location.hostname}:3001/api/files/upload`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data && res.data.url) {
                setAvatarUrl(res.data.url);
            }
        } catch (err) {
            console.error('Avatar upload failed', err);
            alert('Failed to upload avatar');
        } finally {
            setAvatarUploading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content create-group-modal">
                <div className="modal-header">
                    <h2>Create New Group</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="create-group-form">
                    {/* Avatar Upload */}
                    <div className="form-group">
                        <label className="form-label">Group Avatar (optional)</label>
                        <div className="avatar-upload-section">
                            <div className="avatar-preview">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="avatar" />
                                ) : (
                                    <div className="avatar-placeholder">📷</div>
                                )}
                            </div>
                            <div>
                                <input type="file" id="group-avatar" onChange={handleAvatarChange} className="hidden" />
                                <label htmlFor="group-avatar" className="upload-btn">{avatarUploading ? 'Uploading...' : 'Upload Avatar'}</label>
                            </div>
                        </div>
                    </div>
                    {/* Group Name */}
                    <div className="form-group">
                        <label className="form-label">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className="form-input"
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter group description..."
                            className="form-textarea"
                            rows="3"
                        />
                    </div>

                    {/* Members Selection */}
                    <div className="form-group">
                        <label className="form-label">Add Members</label>
                        <div className="members-selection">
                            {isLoadingUsers ? (
                                <p className="loading-text">Loading users...</p>
                            ) : availableUsers.length === 0 ? (
                                <p className="empty-text">No other users available</p>
                            ) : (
                                availableUsers.map((user) => (
                                    <label
                                        key={user._id}
                                        className={`member-option ${selectedMembers.includes(user._id) ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedMembers.includes(user._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedMembers([...selectedMembers, user._id]);
                                                } else {
                                                    setSelectedMembers(
                                                        selectedMembers.filter((id) => id !== user._id)
                                                    );
                                                }
                                            }}
                                        />
                                        <span className="member-name">{user.username}</span>
                                        {selectedMembers.includes(user._id) && (
                                            <span className="selected-indicator">✓</span>
                                        )}
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <button
                            onClick={handleCreateGroup}
                            disabled={isLoading}
                            className="create-btn"
                        >
                            {isLoading ? 'Creating...' : 'Create Group'}
                        </button>
                        <button
                            onClick={onClose}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
