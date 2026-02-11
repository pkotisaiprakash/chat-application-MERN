import React, { useState, useEffect, useRef } from "react";
import "./ChatContainer.css";
import ChatInput from "./ChatInput";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute, editMessageRoute, deleteMessageRoute, clearChatRoute, host } from "../utils/APIRoutes";
import { checkMessageAnimation, triggerAnimation } from "../utils/messageAnimations";

export default function ChatContainer({ currentChat, socket, isMobile, onBack, onMessageSent, onScheduleMessage }) {
    const [messages, setMessages] = useState([]);
    const [aliasName, setAliasName] = useState("");
    const [customAvatar, setCustomAvatar] = useState(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msgId: null });
    const [editingMessage, setEditingMessage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [clearChatRequested, setClearChatRequested] = useState(false);
    const [clearChatPending, setClearChatPending] = useState(false);
    const scrollRef = useRef();
    const [arrivalMessage, setArrivalMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [swipedMessage, setSwipedMessage] = useState(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    useEffect(() => {
        async function fetchData() {
            const user = localStorage.getItem("chat-app-user");
            if (!user) return;

            const data = JSON.parse(user);
            if (currentChat) {
                const response = await axios.post(recieveMessageRoute, {
                    from: data._id,
                    to: currentChat._id,
                });
                setMessages(response.data);

                // Notify the other user that messages were seen (so sender can show 'seen')
                if (socket && socket.current) {
                    socket.current.emit('message-seen', { to: currentChat._id, from: data._id });
                }
            }
        }
        fetchData();

        // load local alias and custom avatar for this chat
        const aliases = JSON.parse(localStorage.getItem('chat-app-aliases') || '{}');
        const avatars = JSON.parse(localStorage.getItem('chat-app-custom-avatars') || '{}');
        setAliasName(aliases[currentChat._id] || '');
        setCustomAvatar(avatars[currentChat._id] || null);
    }, [currentChat]);

    const handleSendMsg = async (msg) => {
        const user = localStorage.getItem("chat-app-user");
        if (!user) return;

        const data = JSON.parse(user);

        // msg can be a string or an object { fileUrl }
        const msgPayload = typeof msg === 'string' ? msg : msg;

        socket.current.emit("send-msg", {
            to: currentChat._id,
            from: data._id,
            msg: typeof msgPayload === 'string' ? msgPayload : (msgPayload.fileUrl || ''),
            senderName: aliasName || data.username,
        });

        const response = await axios.post(sendMessageRoute, {
            from: data._id,
            to: currentChat._id,
            message: msgPayload,
        });

        // Server returns the full message object
        const newMessage = {
            _id: response.data._id,
            fromSelf: true,
            message: response.data.message?.text || null,
            fileUrl: response.data.message?.fileUrl || null,
            createdAt: response.data.createdAt,
            isRead: false,
            isEdited: false,
            isDeleted: false
        };

        const msgs = [...messages];
        msgs.push(newMessage);
        setMessages(msgs);

        // Check if message should trigger special animation
        const animationConfig = checkMessageAnimation(msg);
        if (animationConfig) {
            triggerAnimation(animationConfig);
        }

        if (onMessageSent) onMessageSent(currentChat._id);
    };

    const handleEditMsg = async (msgId, newText) => {
        const user = localStorage.getItem("chat-app-user");
        if (!user) return;

        const data = JSON.parse(user);

        const response = await axios.put(`${editMessageRoute}/${msgId}`, {
            text: newText,
            userId: data._id,
        });

        if (response.data.status) {
            // Update local messages
            setMessages(messages.map(msg =>
                msg._id === msgId
                    ? { ...msg, message: newText, isEdited: true, editedAt: new Date() }
                    : msg
            ));

            // Emit socket event
            socket.current.emit("edit-msg", {
                to: currentChat._id,
                msgId,
                text: newText,
            });

            setEditingMessage(null);
        }
    };

    const handleClearChatRequest = () => {
        const user = localStorage.getItem("chat-app-user");
        if (!user) return;
        const data = JSON.parse(user);

        socket.current.emit("clear-chat-request", {
            to: currentChat._id,
            from: data._id,
        });
        setClearChatRequested(true);
    };

    const handleClearChatAccept = async () => {
        const user = localStorage.getItem("chat-app-user");
        if (!user) return;
        const data = JSON.parse(user);

        try {
            // Call API to delete messages from database
            await axios.post(clearChatRoute, {
                from: data._id,
                to: currentChat._id,
            });

            // Emit socket event
            socket.current.emit("clear-chat-accept", {
                to: currentChat._id,
                from: data._id,
            });

            setMessages([]);
            setClearChatPending(false);
        } catch (err) {
            console.error('Error clearing chat:', err);
        }
    };

    const handleClearChatReject = () => {
        const user = localStorage.getItem("chat-app-user");
        if (!user) return;
        const data = JSON.parse(user);

        socket.current.emit("clear-chat-reject", {
            to: currentChat._id,
            from: data._id,
        });
        setClearChatPending(false);
    };

    const handleDeleteMsg = async (msgId) => {
        const user = localStorage.getItem("chat-app-user");
        if (!user) return;

        const data = JSON.parse(user);

        const response = await axios.delete(`${deleteMessageRoute}/${msgId}`, {
            data: { userId: data._id }
        });

        if (response.data.status) {
            // Mark deleted in place (do not reorder)
            setMessages(prev => prev.map(m => m._id === msgId ? { ...m, message: "This message was deleted", isDeleted: true } : m));

            // Emit socket event
            socket.current.emit("delete-msg", {
                to: currentChat._id,
                msgId,
            });
        }

        setContextMenu({ visible: false, x: 0, y: 0, msgId: null });
    };

    useEffect(() => {
        if (socket.current) {
            socket.current.on("msg-recieve", (data) => {
                // data: { from, msg, senderName }
                if (data.from === currentChat?._id) {
                    setArrivalMessage({
                        _id: Date.now(), // Temp ID to prevent blank screen (key error)
                        fromSelf: false,
                        message: data.msg,
                        createdAt: new Date(),
                        senderId: data.from,
                        isRead: false,
                        isEdited: false,
                        isDeleted: false
                    });
                    
                    // Check if received message should trigger special animation
                    const animationConfig = checkMessageAnimation(data.msg);
                    if (animationConfig) {
                        triggerAnimation(animationConfig);
                    }
                    
                    // Send message-seen notification immediately
                    const user = localStorage.getItem("chat-app-user");
                    if (user) {
                        const userData = JSON.parse(user);
                        socket.current.emit('message-seen', { to: data.from, from: userData._id });
                    }
                }
            });

            socket.current.on("msg-edited", ({ msgId, text }) => {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg._id === msgId
                            ? { ...msg, message: text, isEdited: true }
                            : msg
                    )
                );
            });

            socket.current.on("msg-deleted", ({ msgId }) => {
                setMessages(prevMessages => prevMessages.map(m => m._id === msgId ? { ...m, message: "This message was deleted", isDeleted: true } : m));
            });

            socket.current.on("user-typing", (data) => {
                // Only show typing if it's from current chat
                if (data && data.from === currentChat?._id) {
                    setIsTyping(true);
                }
            });

            socket.current.on("user-stop-typing", (data) => {
                // Only hide typing if it's from current chat
                if (data && data.from === currentChat?._id) {
                    setIsTyping(false);
                }
            });

            // Handle seen notifications from other side (they saw our messages)
            socket.current.on('msg-seen', ({ from }) => {
                if (currentChat?._id === from) {
                    // Mark ALL messages from self as read
                    setMessages(prev => prev.map(m => m.fromSelf ? { ...m, isRead: true } : m));
                }
            });
        }
    }, [socket, currentChat]);

    useEffect(() => {
        arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
    }, [arrivalMessage]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Also scroll when typing indicator appears/disappears
    useEffect(() => {
        if (isTyping) {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isTyping]);

    // Handle clear chat requests
    useEffect(() => {
        if (!socket.current || !currentChat) return;

        const handleClearChatRequest = (data) => {
            if (data.from === currentChat._id) {
                setClearChatPending(true);
            }
        };

        const handleClearChatAccepted = () => {
            setMessages([]);
            setClearChatRequested(false);
        };

        const handleClearChatRejected = () => {
            setClearChatRequested(false);
        };

        socket.current.on("clear-chat-request", handleClearChatRequest);
        socket.current.on("clear-chat-accepted", handleClearChatAccepted);
        socket.current.on("clear-chat-rejected", handleClearChatRejected);

        return () => {
            socket.current?.off("clear-chat-request", handleClearChatRequest);
            socket.current?.off("clear-chat-accepted", handleClearChatAccepted);
            socket.current?.off("clear-chat-rejected", handleClearChatRejected);
        };
    }, [socket, currentChat]);


    const handleContextMenu = (e, msg) => {
        if (!msg.fromSelf || msg.isDeleted) return;

        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            msgId: msg._id,
            msgText: msg.message,
        });
    };

    // Touch handlers for swipe to reply (mobile)
    const handleTouchStart = (e, msg) => {
        if (!isMobile || msg.isDeleted) return;
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e, msg) => {
        if (!isMobile || msg.isDeleted) return;
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e, msg) => {
        if (!isMobile || msg.isDeleted) return;
        const swipeDistance = touchEndX.current - touchStartX.current;
        const minSwipeDistance = 50;
        
        // Swipe left (negative) on received messages to reply
        if (swipeDistance < -minSwipeDistance && !msg.fromSelf) {
            setReplyingTo(msg);
            setSwipedMessage(msg._id);
            setTimeout(() => setSwipedMessage(null), 2000);
        }
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString();
        }
    };

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, msgId: null });
        if (contextMenu.visible) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu.visible]);

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="chat-header-content">
                    {isMobile && (
                        <button onClick={() => onBack && onBack()} className="chat-back-btn">
                            ←
                        </button>
                    )}
                    <div className="chat-header-avatar">
                        <img
                            src={(customAvatar || currentChat.avatarImage || "").startsWith('data:')
                                ? (customAvatar || currentChat.avatarImage)
                                : `data:image/svg+xml;base64,${customAvatar || currentChat.avatarImage}`}
                            alt=""
                            className="chat-header-image"
                        />
                    </div>
                    <div className="chat-header-info">
                        <div className="chat-header-name-row">
                            {isRenaming ? (
                                <>
                                    <input value={aliasName} onChange={(e) => setAliasName(e.target.value)} className="chat-alias-input" />
                                    <button onClick={() => {
                                        // save alias
                                        const aliases = JSON.parse(localStorage.getItem('chat-app-aliases') || '{}');
                                        aliases[currentChat._id] = aliasName;
                                        localStorage.setItem('chat-app-aliases', JSON.stringify(aliases));
                                        setIsRenaming(false);
                                    }} className="chat-alias-save-btn">✓</button>
                                    <button onClick={() => {
                                        setAliasName(JSON.parse(localStorage.getItem('chat-app-aliases') || '{}')[currentChat._id] || '');
                                        setIsRenaming(false);
                                    }} className="chat-alias-cancel-btn">✕</button>
                                </>
                            ) : (
                                <>
                                    <h3 className="chat-header-name">{aliasName || currentChat.username}</h3>
                                    <button onClick={() => setIsRenaming(true)} className="chat-rename-btn">✎</button>
                                </>
                            )}
                        </div>
                        {currentChat.about && (
                            <p className="chat-header-about">{currentChat.about}</p>
                        )}
                    </div>
                </div>
            </div>
            {/* Clear Chat Pending Overlay */}
            {clearChatPending && (
                <div className="clear-chat-overlay">
                    <div className="clear-chat-modal">
                        <h3>Clear Chat Request</h3>
                        <p>The other user wants to clear your conversation history</p>
                        <div className="clear-chat-buttons">
                            <button
                                onClick={handleClearChatAccept}
                                className="clear-chat-accept-btn"
                            >
                                ✓ Accept
                            </button>
                            <button
                                onClick={handleClearChatReject}
                                className="clear-chat-reject-btn"
                            >
                                ✕ Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Chat Requested Alert */}
            {clearChatRequested && (
                <div className="clear-chat-request-alert">
                    <div className="clear-chat-request-alert-icon">⏳</div>
                    <div className="clear-chat-request-alert-content">
                        <p>Waiting for acceptance...</p>
                        <p>Waiting for other user to accept the clear chat request</p>
                    </div>
                    <button
                        onClick={() => setClearChatRequested(false)}
                        className="clear-chat-request-close-btn"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="chat-messages">
                {messages.map((message, index) => {
                    const date = new Date(message.createdAt);
                    const prevMessage = messages[index - 1];
                    const prevDate = prevMessage ? new Date(prevMessage.createdAt) : null;
                    const showDateDivider = !prevDate || date.toDateString() !== prevDate.toDateString();

                    return (
                        <div key={message._id || index} className="message-container">
                            {showDateDivider && (
                                <div className="date-separator">
                                    <span>{formatDate(message.createdAt)}</span>
                                </div>
                            )}
                            <div ref={scrollRef} 
                                className={`message-wrapper ${message.fromSelf ? "own" : "other"} ${swipedMessage === message._id ? 'swiped' : ''}`}
                                onTouchStart={(e) => handleTouchStart(e, message)}
                                onTouchMove={(e) => handleTouchMove(e, message)}
                                onTouchEnd={(e) => handleTouchEnd(e, message)}
                            >
                                <div className={`message-bubble ${message.isDeleted ? "deleted" : ""}`} onContextMenu={(e) => handleContextMenu(e, message)}>
                                    {message.isDeleted ? (
                                        <p className="message-deleted-text">
                                            <span>🚫</span>
                                            {message.message}
                                        </p>
                                    ) : (
                                        <>
                                            {message.fileUrl ? (
                                                // if image, show preview with download button, else show link with download
                                                (message.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) ? (
                                                    <div className="message-image-container">
                                                        <img src={`${host}${message.fileUrl}`} alt="file" className="message-image" />
                                                        <a 
                                                            href={`${host}${message.fileUrl}`} 
                                                            download
                                                            className="message-download-btn"
                                                            title="Download"
                                                        >
                                                            ⬇
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="message-file-container">
                                                        <a href={`${host}${message.fileUrl}`} target="_blank" rel="noopener noreferrer" className="message-file-link">
                                                            📎 {message.fileUrl.split('/').pop()}
                                                        </a>
                                                        <a 
                                                            href={`${host}${message.fileUrl}`} 
                                                            download
                                                            className="message-download-btn"
                                                            title="Download"
                                                        >
                                                            ⬇
                                                        </a>
                                                    </div>
                                                )
                                            ) : null}
                                            {!message.fileUrl && <p>{message.message}</p>}
                                            <div className="message-time-row">
                                                <span>{formatTime(message.createdAt)}</span>
                                                {message.isEdited && <span className="message-edited">(edited)</span>}
                                                {message.fromSelf && (
                                                    <span className={`message-status ${message.isRead ? "read" : "sent"}`}>
                                                        {message.isRead ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="chat-context-menu"
                    style={{
                        top: isMobile ? Math.min(contextMenu.y, window.innerHeight - 120) : contextMenu.y,
                        left: isMobile ? Math.max(8, Math.min(contextMenu.x, window.innerWidth - 140)) : contextMenu.x,
                    }}
                >
                    <button
                        className="chat-context-menu-item edit"
                        onClick={() => {
                            setEditingMessage({ _id: contextMenu.msgId, text: contextMenu.msgText });
                            setContextMenu({ visible: false, x: 0, y: 0, msgId: null });
                        }}
                    >
                        ✏️ Edit
                    </button>
                    <button
                        className="chat-context-menu-item delete"
                        onClick={() => handleDeleteMsg(contextMenu.msgId)}
                    >
                        🗑️ Delete
                    </button>
                </div>
            )}

            <ChatInput
                handleSendMsg={handleSendMsg}
                editingMessage={editingMessage}
                setEditingMessage={setEditingMessage}
                handleEditMsg={handleEditMsg}
                socket={socket}
                currentChat={currentChat}
                onClearChat={handleClearChatRequest}
                isMobile={isMobile}
                onScheduleMessage={onScheduleMessage}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
            />
        </div>
    );
}

