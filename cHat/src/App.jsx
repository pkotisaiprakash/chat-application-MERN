import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetAvatar from "./pages/SetAvatar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Splash from "./components/Splash";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route path="/" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}
