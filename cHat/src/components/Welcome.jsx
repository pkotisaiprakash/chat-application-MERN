import React, { useState, useEffect } from "react";

export default function Welcome() {
    const [userName, setUserName] = useState("");
    useEffect(() => {
        async function fetchData() {
            const data = await JSON.parse(
                localStorage.getItem("chat-app-user")
            );
            if (data) {
                setUserName(data.username);
            }
        }
        fetchData();
    }, []);
    return (
        <div className="flex justify-center items-center flex-col text-white h-full w-full gap-4">
            <h1 className="text-3xl font-bold">
                Welcome, <span className="text-[#4e0eff]">{userName}!</span>
            </h1>
            <h3 className="text-lg font-medium">Please select a chat to Start messaging.</h3>
        </div>
    );
}
