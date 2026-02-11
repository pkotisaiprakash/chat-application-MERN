import React, { useState, useEffect } from "react";
import { FiSearch, FiMessageSquare } from "react-icons/fi";
import Groups from "./Groups";
import "./Contacts.css";

export default function Contacts({ contacts, changeChat, onlineUsers = [], activeTab = 'contacts', setActiveTab = () => { }, currentUser, onSelectGroup }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentUserImage, setCurrentUserImage] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);
  const [aliasesMap, setAliasesMap] = useState({});
  const [customAvatarsMap, setCustomAvatarsMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      const data = await JSON.parse(
        localStorage.getItem("chat-app-user")
      );
      if (data) {
        setCurrentUserName(data.username);
        setCurrentUserImage(data.avatarImage);
      }
    }
    fetchData();

    // load local aliases and avatars
    setAliasesMap(JSON.parse(localStorage.getItem('chat-app-aliases') || '{}'));
    setCustomAvatarsMap(JSON.parse(localStorage.getItem('chat-app-custom-avatars') || '{}'));

    const handleUserUpdate = () => {
      const data = JSON.parse(localStorage.getItem("chat-app-user"));
      if (data) {
        setCurrentUserName(data.username);
        setCurrentUserImage(data.avatarImage);
      }
    };

    window.addEventListener("user-update", handleUserUpdate);
    return () => window.removeEventListener("user-update", handleUserUpdate);
  }, []);

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  const filteredContacts = contacts.filter(contact => {
    const displayName = aliasesMap[contact._id] || contact.username;
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getAvatarSrc = (avatar) => {
    if (!avatar) return null;
    return avatar.startsWith('data:') ? avatar : `data:image/svg+xml;base64,${avatar}`;
  };

  return (
    <>
      {currentUserImage && currentUserName && (
        <div className="contacts-wrapper">
          {/* Brand Header */}
          <a href="/" className="contacts-brand">
            <div className="brand-content">
              <img src="snappy-icon.png" alt="logo" className="brand-logo" />
              <h1>SNAPPY <span>Wave</span></h1>
            </div>
          </a>

          {/* Search Bar */}
          <div className="contacts-search">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="contacts-tabs">
              <button
                className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
                onClick={() => setActiveTab('contacts')}
              >
                <FiMessageSquare /> Contacts
              </button>
              <button
                className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
                onClick={() => setActiveTab('groups')}
              >
                <FiMessageSquare /> Groups
              </button>
            </div>
          </div>

          {/* Contact/List */}
          <div className="contacts-list">
            {activeTab === 'contacts' ? (
              filteredContacts.length > 0 ? (
                filteredContacts.map((contact, index) => {
                  const isOnline = onlineUsers.includes(contact._id);
                  return (
                    <div
                      className={`contact-item ${index === currentSelected ? 'selected' : ''}`}
                      key={contact._id}
                      onClick={() => changeCurrentChat(index, contact)}
                    >
                      <div className="contact-avatar">
                        <img
                          src={getAvatarSrc(customAvatarsMap[contact._id] || contact.avatarImage)}
                          alt=""
                        />
                        {isOnline && <span className="online-indicator"></span>}
                      </div>
                      <div className="contact-info">
                        <div className="contact-header">
                          <h3>{aliasesMap[contact._id] || contact.username}</h3>
                          {contact.unreadCount > 0 && (
                            <span className="unread-badge">{contact.unreadCount > 99 ? '99+' : contact.unreadCount}</span>
                          )}
                        </div>
                        <p className={isOnline ? 'status-online' : 'status-offline'}>
                          {isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-contacts">No users found</div>
              )
            ) : (
              <div className="groups-container">
                <Groups currentUser={currentUser} onSelectGroup={onSelectGroup} />
              </div>
            )}
          </div>

          {/* Current User Profile */}
          <div
            className="current-user-section"
            onClick={() => {
              const event = new CustomEvent('openProfile');
              window.dispatchEvent(event);
            }}
          >
            <div className="user-avatar">
              <img
                src={getAvatarSrc(currentUserImage)}
                alt="avatar"
              />
            </div>
            <div className="user-info">
              <h2>{currentUserName}</h2>
              <p>Tap to view profile</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
