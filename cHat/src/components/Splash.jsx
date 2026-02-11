import React, { useEffect } from 'react';
import './Splash.css';

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="splash-root">
      <div className="splash-circle">
        <img src="/snappy-icon.png" alt="SNAPPY" className="splash-icon" />
      </div>
      <h1 className="splash-title">SNAPPY</h1>
    </div>
  );
}
