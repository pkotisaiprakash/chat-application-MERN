import React, { useState, useEffect } from "react";
import "./ScheduleMessage.css";
import axios from "axios";
import { scheduleMessageRoute, getScheduledMessagesRoute, cancelScheduledMessageRoute } from "../utils/APIRoutes";
import { FiClock, FiX } from "react-icons/fi";
import { MdSchedule } from "react-icons/md";

export default function ScheduleMessage({ currentChat, onClose }) {
    const [message, setMessage] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showList, setShowList] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (showList) {
            fetchScheduledMessages();
        }
    }, [showList]);

    const fetchScheduledMessages = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("chat-app-user"));
            const response = await axios.get(`${getScheduledMessagesRoute}/${user._id}`);
            // Filter for current chat
            const filtered = response.data.filter((msg) => msg.to._id === currentChat._id);
            setScheduledMessages(filtered);
        } catch (err) {
            console.error("Error fetching scheduled messages:", err);
        }
    };

    const handleSchedule = async () => {
        setErrorMessage("");

        if (!message.trim()) {
            setErrorMessage("Please enter a message");
            return;
        }

        if (!scheduledTime) {
            setErrorMessage("Please select a date and time");
            return;
        }

        const scheduledDate = new Date(scheduledTime);
        const now = new Date();

        if (scheduledDate <= new Date(now.getTime() + 1000)) {
            setErrorMessage("Please select a time at least 1 second in the future");
            return;
        }

        setIsLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem("chat-app-user"));

            console.log("📤 Scheduling message:", {
                from: user._id,
                to: currentChat._id,
                message,
                scheduledTime: scheduledDate.toISOString(),
            });

            const response = await axios.post(scheduleMessageRoute, {
                from: user._id,
                to: currentChat._id,
                message: message.trim(),
                scheduledTime: scheduledDate.toISOString(),
            });

            if (response.data.status) {
                setSuccessMessage("✅ Message scheduled successfully!");
                setMessage("");
                setScheduledTime("");
                setTimeout(() => setSuccessMessage(""), 3000);
                fetchScheduledMessages();
            } else {
                setErrorMessage(response.data.msg || "Failed to schedule message");
                console.error("❌ Schedule error:", response.data);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.msg || err.message || "Error scheduling message";
            setErrorMessage(errorMsg);
            console.error("❌ Error scheduling message:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async (msgId) => {
        try {
            const user = JSON.parse(localStorage.getItem("chat-app-user"));
            const response = await axios.post(`${cancelScheduledMessageRoute}/${msgId}`, {
                userId: user._id,
            });

            if (response.data.status) {
                fetchScheduledMessages();
            }
        } catch (err) {
            console.error("Error cancelling scheduled message:", err);
        }
    };

    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };


    return (
        <div className="schedule-modal-overlay">
            <div className="schedule-modal">
                {/* Header */}
                <div className="schedule-header">
                    <div className="schedule-header-icon">
                        <MdSchedule />
                        <h2>Schedule Message</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="schedule-close-btn"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Section */}
                {!showList ? (
                    <div className="schedule-form">
                        {successMessage && (
                            <div className="schedule-success">
                                {successMessage}
                            </div>
                        )}

                        {errorMessage && (
                            <div className="schedule-error">
                                ⚠️ {errorMessage}
                            </div>
                        )}

                        {/* Message Input */}
                        <div className="schedule-form-group">
                            <label>Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="schedule-message-input"
                                rows="4"
                            />
                        </div>

                        {/* Date Time Input */}
                        <div className="schedule-form-group">
                            <label>Schedule Time</label>
                            <input
                                type="datetime-local"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="schedule-datetime-input"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="schedule-buttons">
                            <button
                                onClick={handleSchedule}
                                disabled={isLoading}
                                className="schedule-btn primary"
                            >
                                <FiClock />
                                {isLoading ? 'Scheduling...' : 'Schedule Message'}
                            </button>
                            <button
                                onClick={() => setShowList(true)}
                                className="schedule-btn secondary"
                            >
                                View Scheduled
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="scheduled-list">
                        <div className="scheduled-list-header">
                            <button
                                onClick={() => setShowList(false)}
                                className="back-btn"
                            >
                                ← Back
                            </button>
                            <h3>Scheduled Messages ({scheduledMessages.length})</h3>
                        </div>

                        {scheduledMessages.length === 0 ? (
                            <p className="no-scheduled">
                                No scheduled messages yet
                            </p>
                        ) : (
                            <div className="scheduled-items">
                                {scheduledMessages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className="scheduled-item"
                                    >
                                        <div className="scheduled-item-header">
                                            <p className="scheduled-message-text">{msg.message.text}</p>
                                            <button
                                                onClick={() => handleCancel(msg._id)}
                                                className="cancel-scheduled-btn"
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                        <p className="scheduled-time">
                                            <FiClock />
                                            {formatDateTime(msg.scheduledTime)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
