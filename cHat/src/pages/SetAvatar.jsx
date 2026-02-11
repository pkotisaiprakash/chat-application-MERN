import React, { useEffect, useState } from "react";
import axios from "axios";
import { Buffer } from "buffer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { setAvatarRoute } from "../utils/APIRoutes";
import "./SetAvatar.css";

export default function SetAvatar() {
    const api = `https://api.dicebear.com/7.x/bottts/svg`;
    const navigate = useNavigate();
    const [avatars, setAvatars] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAvatar, setSelectedAvatar] = useState(undefined);

    const toastOptions = {
        position: "bottom-right",
        autoClose: 8000,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
    };

    useEffect(() => {
        if (!localStorage.getItem("chat-app-user"))
            navigate("/login");
    }, [navigate]);

    const setProfilePicture = async () => {
        if (selectedAvatar === undefined) {
            toast.error("Please select an avatar", toastOptions);
        } else {
            try {
                const user = await JSON.parse(
                    localStorage.getItem("chat-app-user")
                );

                const { data } = await axios.post(`${setAvatarRoute}/${user._id}`, {
                    image: avatars[selectedAvatar],
                });

                if (data.isSet) {
                    user.isAvatarImageSet = true;
                    user.avatarImage = data.image;
                    localStorage.setItem(
                        "chat-app-user",
                        JSON.stringify(user)
                    );
                    toast.success("Avatar updated successfully!", toastOptions);
                    navigate("/");
                } else {
                    toast.error("Error setting avatar. Please try again.", toastOptions);
                }
            } catch (err) {
                console.error("Avatar update error:", err);
                toast.error("Error updating avatar. Please try again.", toastOptions);
            }
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = [];
            for (let i = 0; i < 4; i++) {
                const image = await axios.get(
                    `${api}?seed=${Math.round(Math.random() * 1000)}`
                );
                const buffer = Buffer.from(image.data);
                data.push(buffer.toString("base64"));
            }
            setAvatars(data);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Error setting up avatars, please try refreshing", toastOptions);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            {isLoading ? (
                <div className="container">
                    <div className="loader">Loading Avatars...</div>
                </div>
            ) : (
                <div className="container">
                    <div className="title-container">
                        <h1>Pick an Avatar as your profile picture</h1>
                    </div>
                    <div className="avatars">
                        {avatars.map((avatar, index) => {
                            return (
                                <div
                                    key={index}
                                    className={`avatar ${selectedAvatar === index ? "selected" : ""
                                        }`}
                                    onClick={() => setSelectedAvatar(index)}
                                >
                                    <img
                                        src={`data:image/svg+xml;base64,${avatar}`}
                                        alt="avatar"
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={setProfilePicture} className="submit-btn">
                        Set as Profile Picture
                    </button>
                    <button onClick={fetchData} className="submit-btn" style={{ marginTop: "1rem", backgroundColor: "#9a86f3" }}>
                        Refresh Avatars
                    </button>
                    <ToastContainer />
                </div>
            )}
        </>
    );
}
