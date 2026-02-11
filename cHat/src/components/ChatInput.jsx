import React, { useState, useEffect, useRef } from "react";
import "./ChatInput.css";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import { MdCancel } from "react-icons/md";
import { FiClock } from "react-icons/fi";
import Picker from "emoji-picker-react";
import axios from "axios";
import { fileUploadRoute } from "../utils/APIRoutes";

export default function ChatInput({ handleSendMsg, editingMessage, setEditingMessage, handleEditMsg, socket, currentChat, onClearChat, isMobile, onScheduleMessage, replyingTo, onCancelReply }) {
    const [msg, setMsg] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (editingMessage) {
            setMsg(editingMessage.text);
        }
    }, [editingMessage]);

    // focus input when entering edit mode
    useEffect(() => {
        if (editingMessage && inputRef.current) {
            // small timeout to ensure input is rendered
            setTimeout(() => {
                inputRef.current.focus();
                // move cursor to end
                const len = inputRef.current.value.length;
                inputRef.current.setSelectionRange(len, len);
            }, 50);
        }
    }, [editingMessage]);

    const handleEmojiPickerhideShow = () => {
        setShowEmojiPicker(!showEmojiPicker);
    };

    const handleEmojiClick = (event, emojiObject) => {
        let message = msg;
        message += event.emoji;
        setMsg(message);
    };

    const handleInputChange = (e) => {
        setMsg(e.target.value);

        if (socket && socket.current && currentChat) {
            const user = localStorage.getItem("chat-app-user");
            if (user) {
                const data = JSON.parse(user);

                // Emit typing event
                socket.current.emit("typing", {
                    to: currentChat._id,
                    from: data._id
                });

                // Clear previous timeout
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                // Set timeout to emit stop-typing after 1 second of inactivity
                typingTimeoutRef.current = setTimeout(() => {
                    socket.current.emit("stop-typing", {
                        to: currentChat._id,
                        from: data._id
                    });
                }, 1000);
            }
        }
    };

    const sendChat = (event) => {
        event.preventDefault();
        if (msg.length > 0) {
            // Clear typing timeout and emit stop-typing
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (socket && socket.current && currentChat) {
                const user = localStorage.getItem("chat-app-user");
                if (user) {
                    const data = JSON.parse(user);
                    socket.current.emit("stop-typing", {
                        to: currentChat._id,
                        from: data._id
                    });
                }
            }

            if (editingMessage) {
                handleEditMsg(editingMessage._id, msg);
            } else {
                // Include reply info if replying to a message
                const messageData = replyingTo 
                    ? { text: msg, replyTo: replyingTo._id, replyToMessage: replyingTo.message }
                    : msg;
                handleSendMsg(messageData);
            }
            setMsg("");
            setShowEmojiPicker(false); // auto-hide emoji picker on send
        }
    };

    const handleCancel = () => {
        setEditingMessage(null);
        setMsg("");
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await axios.post(fileUploadRoute, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data && res.data.url) {
                // send file message
                const fileUrl = res.data.url;
                handleSendAsFile(fileUrl);
            }
        } catch (err) {
            console.error('File upload failed', err);
        } finally {
            // reset input
            if (fileInputRef.current) fileInputRef.current.value = null;
        }
    };

    const handleSendAsFile = (fileUrl) => {
        if (editingMessage) {
            // editing not supported for file messages currently
            setEditingMessage(null);
            return;
        }
        handleSendMsg({ fileUrl });
    };

    return (
        <div className="chat-input-container">
            {/* Reply Indicator */}
            {replyingTo && (
                <div className="reply-indicator">
                    <div className="reply-info">
                        <span className="reply-label">Replying to</span>
                        <span className="reply-text">{replyingTo.message?.substring(0, 50)}{replyingTo.message?.length > 50 ? '...' : ''}</span>
                    </div>
                    <button className="cancel-reply-btn" onClick={onCancelReply}>
                        <MdCancel />
                    </button>
                </div>
            )}
            <div className="chat-input-row">
                <div className="chat-input-actions">
                    <button
                        onClick={() => onScheduleMessage && onScheduleMessage()}
                        className="chat-schedule-btn"
                        title="Schedule message"
                    >
                        <FiClock />
                    </button>
                    <button
                        onClick={handleEmojiPickerhideShow}
                        className="chat-emoji-btn"
                    >
                        <BsEmojiSmileFill />
                    </button>
                    {showEmojiPicker && (
                        <div className="emoji-picker-container">
                            <Picker
                                onEmojiClick={handleEmojiClick}
                                disableSearchBar={true}
                                disableSkinTonePicker={true}
                            />
                        </div>
                    )}
                </div>
                <form className="chat-input-form" onSubmit={(event) => sendChat(event)}>
                    {editingMessage && (
                        <div className="editing-indicator">
                            <span>Editing</span>
                            <MdCancel
                                className="cancel-edit-btn"
                                onClick={handleCancel}
                            />
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder={editingMessage ? "Edit..." : "Type your message here..."}
                        onChange={handleInputChange}
                        value={msg}
                        ref={inputRef}
                        className="chat-input-field"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                    <button type="submit" className="chat-send-btn">
                        <IoMdSend />
                    </button>
                </form>
                <div className="chat-input-extras">
                    <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="file-btn">📎</label>
                    <button
                        onClick={onClearChat}
                        className="clear-chat-btn"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}
