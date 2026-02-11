import React, { useState, useRef, useEffect } from "react";
import io from 'socket.io-client';
import './home.css';

function Home() {
    // Auth State
    const [currentUser, setCurrentUser] = useState(null); // { _id, username, friends, ... }
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');

    // Chat State
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [typingUser, setTypingUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [friendUsernameInput, setFriendUsernameInput] = useState('');

    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUser]);

    // Socket & Data Effects
    useEffect(() => {
        if (!currentUser) return;

        const newSocket = io("http://localhost:3001");
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('register_user', currentUser.username);
            fetchFriends();
        });

        // Listen for status updates to refresh friend list status
        newSocket.on('user_status', () => {
            // Ideally we just update the specific user, but re-fetching list is easier for now
            fetchFriends();
        });

        return () => newSocket.close();
    }, [currentUser]);

    const fetchFriends = async () => {
        if (!currentUser) return;
        try {
            const res = await fetch(`http://localhost:3001/api/users/${currentUser._id}/friends`);
            if (res.ok) {
                const data = await res.json();
                setFriends(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const getRoomId = (user1, user2) => [user1, user2].sort().join('_');
        const currentRoom = selectedUser ? getRoomId(currentUser.username, selectedUser.username) : null;

        const handleReceiveMessage = (data) => {
            if (currentRoom && data.room === currentRoom) {
                setMessages((prev) => [...prev, {
                    type: 'received',
                    user: data.user,
                    text: data.text,
                    time: data.time
                }]);
            }
        };

        const handleLoadMessages = (history) => {
            const formatted = history.map(msg => ({
                type: msg.user === currentUser.username ? 'sent' : 'received',
                user: msg.user,
                text: msg.text,
                time: msg.time
            }));
            setMessages(formatted);
        };

        const handleTyping = (data) => {
            if (currentRoom && data.room === currentRoom && data.user !== currentUser.username) {
                setTypingUser(data.user);
            }
        };

        const handleStopTyping = (data) => {
            if (currentRoom && data.room === currentRoom) {
                setTypingUser(null);
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('load_messages', handleLoadMessages);
        socket.on('typing', handleTyping);
        socket.on('stop_typing', handleStopTyping);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('load_messages', handleLoadMessages);
            socket.off('typing', handleTyping);
            socket.off('stop_typing', handleStopTyping);
        };
    }, [socket, selectedUser, currentUser]);

    // Auth Handlers
    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        const endpoint = authMode === 'login' ? 'login' : 'register';

        try {
            const res = await fetch(`http://localhost:3001/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: authUsername, password: authPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                setCurrentUser(data);
                setAuthUsername('');
                setAuthPassword('');
            } else {
                setAuthError(data.message || 'Authentication failed');
            }
        } catch (err) {
            setAuthError('Network error');
        }
    };

    // Chat Handlers
    const handleAddFriend = async () => {
        if (!friendUsernameInput.trim()) return;
        try {
            const res = await fetch('http://localhost:3001/api/add-friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id, friendUsername: friendUsernameInput }),
            });
            const data = await res.json();
            if (res.ok) {
                setFriendUsernameInput('');
                fetchFriends();
                alert(`Added ${data.friend.username} as a friend!`);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Error adding friend');
        }
    };

    const handleChatSelect = (user) => {
        const getRoomId = (u1, u2) => [u1, u2].sort().join('_');
        if (selectedUser && socket) {
            const oldRoom = getRoomId(currentUser.username, selectedUser.username);
            socket.emit('leave_room', oldRoom);
            socket.emit('stop_typing', { room: oldRoom, user: currentUser.username });
        }

        setTypingUser(null);
        setSelectedUser(user);

        if (socket) {
            const newRoom = getRoomId(currentUser.username, user.username);
            socket.emit('join_room', newRoom);
        }
    };

    const handleBackToChats = () => {
        // Cleanup logic similar to ChatSelect
        const getRoomId = (u1, u2) => [u1, u2].sort().join('_');
        const room = selectedUser ? getRoomId(currentUser.username, selectedUser.username) : null;
        if (room && socket) {
            socket.emit('leave_room', room);
            socket.emit('stop_typing', { room, user: currentUser.username });
        }

        setIsClosing(true);
        setTimeout(() => {
            setSelectedUser(null);
            setMessages([]);
            setTypingUser(null);
            setIsClosing(false);
        }, 400);
    };

    const handleSendMessage = () => {
        if (inputValue.trim() && selectedUser) {
            const getRoomId = (u1, u2) => [u1, u2].sort().join('_');
            const room = getRoomId(currentUser.username, selectedUser.username);
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const msgData = {
                room,
                user: currentUser.username,
                text: inputValue.trimEnd(),
                time,
            };

            if (socket) {
                socket.emit('send_message', msgData);
                socket.emit('stop_typing', { room, user: currentUser.username });
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }

            setMessages((prev) => [...prev, {
                type: 'sent',
                user: 'Me',
                text: inputValue.trimEnd(),
                time,
            }]);
            setInputValue('');
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        if (socket && selectedUser) {
            const getRoomId = (u1, u2) => [u1, u2].sort().join('_');
            const room = getRoomId(currentUser.username, selectedUser.username);
            socket.emit('typing', { room, user: currentUser.username });

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', { room, user: currentUser.username });
            }, 2000);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const filteredFriends = friends.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

    // --- Render ---

    if (!currentUser) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
                    {authError && <p className="error">{authError}</p>}
                    <form onSubmit={handleAuth}>
                        <input
                            type="text"
                            placeholder="Username"
                            value={authUsername}
                            onChange={e => setAuthUsername(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={authPassword}
                            onChange={e => setAuthPassword(e.target.value)}
                            required
                        />
                        <button type="submit">{authMode === 'login' ? 'Login' : 'Register'}</button>
                    </form>
                    <p>
                        {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <span onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="link">
                            {authMode === 'login' ? 'Register' : 'Login'}
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container ">
            <div className="chats">
                <div className="user-profile">
                    <img src={'https://cdn-icons-png.flaticon.com/512/147/147144.png'} alt="My Icon" />
                    <h3>{currentUser.username} (Me)</h3>
                </div>

                <div className="add-friend">
                    <input
                        type="text"
                        placeholder="Add friend by username..."
                        value={friendUsernameInput}
                        onChange={e => setFriendUsernameInput(e.target.value)}
                    />
                    <button onClick={handleAddFriend}>+</button>
                </div>

                <div className="search">
                    <div className="search-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            placeholder="Search friends..."
                            className="ipsearch"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="chat-list">
                    {filteredFriends.map((friend) => (
                        <li
                            key={friend._id}
                            onClick={() => handleChatSelect(friend)}
                            className={selectedUser && selectedUser.username === friend.username ? 'selected' : ''}
                        >
                            <img src={'https://cdn-icons-png.flaticon.com/512/147/147144.png'} alt="User Icon" width={"40px"} height={"40px"} style={{ borderRadius: "20px", marginLeft: "10px" }} />
                            {friend.username}
                            <span className={`status-indicator ${friend.status === 'Online' ? 'online' : 'offline'}`}></span>
                        </li>
                    ))}
                </div>
            </div>

            <div className={`selected-chat ${selectedUser ? 'full-mobile' : ''} ${isClosing ? 'closing' : ''}`}>
                {selectedUser ? (
                    <>
                        <div className="chat-name">
                            <button className="back-btn" onClick={handleBackToChats}>←</button>
                            <img src={'https://cdn-icons-png.flaticon.com/512/147/147144.png'} alt="User Icon" />
                            <h3>{selectedUser.username}</h3>
                            <p className="status">● {selectedUser.status}</p>
                        </div>
                        <div className="chat-window">
                            <div className="messages">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`message ${msg.type}`}>
                                        <p className="user">{msg.user === currentUser.username ? 'Me' : msg.user}</p>
                                        <p>{msg.text}</p>
                                        <p className="message-timestamp">{msg.time}</p>
                                    </div>
                                ))}
                                {typingUser && (
                                    <div className="message received typing-indicator">
                                        <p className="user">{typingUser}</p>
                                        <p>Typing...</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="message-input">
                                <textarea
                                    placeholder="Type your message..."
                                    className="ipmsg"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                />
                                <button onClick={handleSendMessage}>Send</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <p>Select a friend to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;