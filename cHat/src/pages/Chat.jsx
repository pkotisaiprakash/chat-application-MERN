import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { allUsersRoute, host } from "../utils/APIRoutes";
import Contacts from "../components/Contacts";
import ChatContainer from "../components/ChatContainer";
import Welcome from "../components/Welcome";
import Profile from "../components/Profile";
import FloatingCredits from "../components/FloatingCredits";
import Groups from "../components/Groups";
import GroupChat from "../components/GroupChat";
import ScheduleMessage from "../components/ScheduleMessage";
import { io } from "socket.io-client";


export default function Chat() {
    const navigate = useNavigate();
    const socket = useRef();
    const [contacts, setContacts] = useState([]);
    const [currentChat, setCurrentChat] = useState(undefined);
    const [currentGroup, setCurrentGroup] = useState(undefined);
    const [currentUser, setCurrentUser] = useState(undefined);
    const [showProfile, setShowProfile] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [activeTab, setActiveTab] = useState("contacts"); // contacts or groups
    const [showScheduleMessage, setShowScheduleMessage] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!localStorage.getItem("chat-app-user")) {
                navigate("/login");
            } else {
                setCurrentUser(
                    await JSON.parse(localStorage.getItem("chat-app-user"))
                );
            }
        }
        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (currentUser) {
            socket.current = io(host);
            socket.current.emit("add-user", currentUser._id);

            // Get initial list of online users
            socket.current.emit("get-online-users");

            // Listen for online/offline status
            socket.current.on("user-online", (data) => {
                setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
            });

            socket.current.on("user-offline", (data) => {
                setOnlineUsers(prev => prev.filter(id => id !== data.userId));
            });

            socket.current.on("online-users", (data) => {
                setOnlineUsers(data.users);
            });

            return () => {
                socket.current?.off("user-online");
                socket.current?.off("user-offline");
                socket.current?.off("online-users");
            };
        }
    }, [currentUser]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log('Notifications already granted');
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                        console.log('Notification permission granted');
                    }
                });
            }
        }
    }, []);

    useEffect(() => {
        async function fetchData() {
            if (currentUser) {
                if (currentUser.isAvatarImageSet) {
                    const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
                    // Sort contacts by last message timestamp (most recent first)
                    const sortedContacts = data.data.sort((a, b) => {
                        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                        return timeB - timeA;
                    });
                    setContacts(sortedContacts);
                } else {
                    navigate("/setAvatar");
                }
            }
        }
        fetchData();
    }, [currentUser, navigate]);

    const handleChatChange = (chat) => {
        setCurrentChat(chat);
    };

    const refetchContacts = async () => {
        if (currentUser) {
            try {
                const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
                // Sort contacts by last message timestamp (most recent first)
                const sortedContacts = data.data.sort((a, b) => {
                    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                    return timeB - timeA;
                });
                setContacts(sortedContacts);
            } catch (error) {
                console.error('Error refetching contacts:', error);
            }
        }
    };

    // Track window resize for responsive behavior
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleBackToContacts = () => {
        setCurrentChat(undefined);
    };

    const handleMessageSent = () => {
        // Refetch contacts when message is sent to update order
        refetchContacts();
    };

    // Listen for profile open event
    useEffect(() => {
        const handleOpenProfile = () => setShowProfile(true);
        window.addEventListener('openProfile', handleOpenProfile);
        return () => window.removeEventListener('openProfile', handleOpenProfile);
    }, []);

    // Reset unread count when selecting a chat
    useEffect(() => {
        if (currentChat) {
            setContacts(prev => prev.map(c => c._id === currentChat._id ? { ...c, unreadCount: 0 } : c));
        }
    }, [currentChat]);

    // Listen for incoming messages to show unread badges when chat not selected
    useEffect(() => {
        if (!socket.current) return;
        const handler = (data) => {
            // data should contain { from, msg, senderName }
            if (!currentChat || currentChat._id !== data.from) {
                setContacts(prev => {
                    // Update unread count AND lastMessageTime for the sender
                    const updated = prev.map(c => 
                        c._id === data.from 
                            ? { 
                                ...c, 
                                unreadCount: (c.unreadCount || 0) + 1,
                                lastMessageTime: new Date().toISOString()
                            } 
                            : c
                    );
                    // Sort contacts by last message timestamp (most recent first)
                    return updated.sort((a, b) => {
                        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                        return timeB - timeA;
                    });
                });
                // Also refetch from server to get latest data
                setTimeout(() => refetchContacts(), 100);
                // Show browser notification
                try {
                    if (window.Notification && Notification.permission === 'granted') {
                        const senderName = data.senderName || 'New message';
                        const notificationTitle = senderName;
                        const notificationOptions = {
                            body: data.msg.substring(0, 100), // Limit message length in notification
                            icon: '/favicon.ico',
                            tag: `chat-${data.from}`, // Replace previous notification from same user
                            badge: '/favicon.ico',
                        };
                        new Notification(notificationTitle, notificationOptions);
                    }
                } catch (e) {
                    console.error('Notification error:', e);
                }
            }
        };
        socket.current.on('msg-recieve', handler);
        return () => {
            socket.current.off('msg-recieve', handler);
        };
    }, [socket, currentChat]);

    return (
        <>
            <div className="h-screen w-screen bg-gradient-to-br from-[#0f0f23] to-[#1a1a3e] grid grid-cols-1 md:grid-cols-[25%_75%] overflow-hidden">
                {/* Mobile & Desktop: Left Sidebar with tabs */}
                <div
                    className={`transition-all duration-300 ease-in-out flex flex-col ${isMobile && (currentChat !== undefined || currentGroup !== undefined)
                        ? "-translate-x-full absolute w-full h-full"
                        : "relative"
                        }`}
                    style={{ zIndex: isMobile && currentChat === undefined && currentGroup === undefined ? 10 : 0 }}
                >
                    {/* Tabs moved into Contacts (will appear under search bar) */}

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        <Contacts 
                            contacts={contacts} 
                            changeChat={handleChatChange} 
                            onlineUsers={onlineUsers}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            currentUser={currentUser}
                            onSelectGroup={(group) => {
                                setCurrentGroup(group);
                                setCurrentChat(undefined);
                                setActiveTab('groups');
                            }}
                        />
                    </div>
                </div>

                {/* Desktop & Mobile: Chat area */}
                {currentChat === undefined && currentGroup === undefined ? (
                    // Show Welcome screen only on desktop when no chat or group selected
                    !isMobile ? (
                        <Welcome />
                    ) : null
                ) : currentChat !== undefined ? (
                    // Show ChatContainer when chat is selected
                    <div
                        className={`${isMobile ? 'absolute w-full h-full transition-all duration-300 ease-in-out translate-x-0' : 'relative'}`}
                        style={{ zIndex: isMobile ? 20 : 'auto' }}
                    >
                        <ChatContainer 
                            currentChat={currentChat} 
                            socket={socket} 
                            isMobile={isMobile} 
                            onBack={handleBackToContacts} 
                            onMessageSent={handleMessageSent}
                            onScheduleMessage={() => setShowScheduleMessage(true)}
                        />
                    </div>
                ) : (
                    // Show GroupChat when group is selected
                    <div
                        className={`${isMobile ? 'absolute w-full h-full transition-all duration-300 ease-in-out translate-x-0' : 'relative'}`}
                        style={{ zIndex: isMobile ? 20 : 'auto' }}
                    >
                        <GroupChat 
                            group={currentGroup} 
                            currentUser={currentUser} 
                            socket={socket} 
                            isMobile={isMobile}
                            onBack={() => setCurrentGroup(undefined)}
                        />
                    </div>
                )}
            </div>
            {showProfile && (
                <Profile
                    user={currentUser}
                    onClose={() => setShowProfile(false)}
                    onUpdate={(updatedUser) => {
                        setCurrentUser(updatedUser);
                        setShowProfile(false);
                        // Refetch contacts after profile update to show new avatar to others
                        setTimeout(() => refetchContacts(), 100);
                    }}
                />
            )}
            <FloatingCredits />
            {showScheduleMessage && (
                <ScheduleMessage
                    currentChat={currentChat}
                    onClose={() => setShowScheduleMessage(false)}
                />
            )}
        </>
    );
}
