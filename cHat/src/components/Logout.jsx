import React from "react";
import { useNavigate } from "react-router-dom";
import { BiPowerOff } from "react-icons/bi";
import axios from "axios";
// import { logoutRoute } from "../utils/APIRoutes"; // We didn't define logoutRoute, but we can just clear local storage


export default function Logout() {
    const navigate = useNavigate();
    const handleClick = async () => {
        // const id = await JSON.parse(
        //   localStorage.getItem("chat-app-user")
        // )._id;
        // const data = await axios.get(`${logoutRoute}/${id}`);
        // if (data.status === 200) {
        localStorage.clear();
        navigate("/login");
        // }
    };
    return (
        <button
            className="flex justify-center items-center p-4 m-2 rounded-full bg-[#9a86f3] border-none cursor-pointer text-white text-xl hover:bg-[#7b61ff] transition-colors duration-300"
            onClick={handleClick}
        >
            <BiPowerOff />
        </button>
    );
}
