import React, { useState, useRef, useEffect } from "react";
import "./FloatingCredits.css";
import { MdDragIndicator } from "react-icons/md";
import { MdEmail, MdPhone } from "react-icons/md";

export default function FloatingCredits() {
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isMinimized, setIsMinimized] = useState(true);
    const panelRef = useRef(null);
    const isDraggingRef = useRef(false);
    const positionRef = useRef({ x: 20, y: 20 });
    const offsetRef = useRef({ x: 0, y: 0 });

    const handleStart = (e) => {
        if (e.target.closest('button')) return;
        isDraggingRef.current = true;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        offsetRef.current = {
            x: clientX - positionRef.current.x,
            y: clientY - positionRef.current.y,
        };
    };

    useEffect(() => {
        const handleMove = (e) => {
            if (!isDraggingRef.current) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            if (panelRef.current) {
                const rect = panelRef.current.getBoundingClientRect();
                const panelWidth = rect.width;
                const panelHeight = rect.height;

                const newX = Math.max(0, Math.min(clientX - offsetRef.current.x, window.innerWidth - panelWidth));
                const newY = Math.max(0, Math.min(clientY - offsetRef.current.y, window.innerHeight - panelHeight));

                positionRef.current = { x: newX, y: newY };
                setPosition({ x: newX, y: newY });
            }
        };

        const handleEnd = () => {
            isDraggingRef.current = false;
        };

        document.addEventListener('mousemove', handleMove, { passive: true });
        document.addEventListener('mouseup', handleEnd, { passive: true });
        document.addEventListener('touchmove', handleMove, { passive: true });
        document.addEventListener('touchend', handleEnd, { passive: true });

        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };
    }, []);

    return (
        <div
            ref={panelRef}
            className={`floating-panel ${isMinimized ? 'minimized' : ''} ${isDraggingRef.current ? 'dragging' : ''}`}
            style={{ 
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {/* Header - Draggable */}
            <div
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                className="floating-panel-header"
            >
                <MdDragIndicator className="floating-drag-icon" />
                <h3 className="floating-panel-title">Developer</h3>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="floating-panel-toggle"
                >
                    {isMinimized ? '+' : '−'}
                </button>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div className="floating-panel-content">
                    {/* Name and Title */}
                    <div className="floating-panel-section">
                        <h4 className="floating-panel-name">Koti Sai Prakash</h4>
                        <p className="floating-panel-role">Full Stack Developer</p>
                    </div>

                    {/* Contact Buttons */}
                    <div className="floating-panel-contacts">
                        <a
                            href="mailto:kotisaiprakash7@gmail.com"
                            className="floating-contact-btn email"
                        >
                            <MdEmail className="floating-contact-icon" />
                            <div className="floating-contact-info">
                                <p className="floating-contact-label">Email</p>
                                <p className="floating-contact-value">kotisaiprakash7@gmail.com</p>
                            </div>
                        </a>

                        <a
                            href="tel:+916301696299"
                            className="floating-contact-btn phone"
                        >
                            <MdPhone className="floating-contact-icon" />
                            <div className="floating-contact-info">
                                <p className="floating-contact-label">Call</p>
                                <p className="floating-contact-value">+91 6301696299</p>
                            </div>
                        </a>
                    </div>

                    {/* Footer */}
                    <div className="floating-panel-footer">
                        <p>© 2026 SNAPPYwave</p>
                    </div>
                </div>
            )}
        </div>
    );
}
