import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { loginRoute } from "../utils/APIRoutes";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const [values, setValues] = useState({
        username: "",
        password: "",
    });

    const toastOptions = {
        position: "bottom-right",
        autoClose: 8000,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
    };

    useEffect(() => {
        if (localStorage.getItem("chat-app-user")) {
            navigate("/");
        }
    }, [navigate]);

    const handleChange = (event) => {
        setValues({ ...values, [event.target.name]: event.target.value });
    };

    const validateForm = () => {
        const { username, password } = values;
        if (username === "") {
            toast.error("Username and Password are required.", toastOptions);
            return false;
        } else if (password === "") {
            toast.error("Username and Password are required.", toastOptions);
            return false;
        }
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log("Attempting login to:", loginRoute);
        if (validateForm()) {
            const { username, password } = values;
            try {
                console.log("Sending login request for user:", username);
                const { data } = await axios.post(loginRoute, {
                    username,
                    password,
                });
                console.log("Login response:", data);
                if (data.status === false) {
                    toast.error(data.msg, toastOptions);
                }
                if (data.status === true) {
                    try {
                        localStorage.setItem(
                            "chat-app-user",
                            JSON.stringify(data.user)
                        );
                    } catch (storageError) {
                        console.error("LocalStorage error:", storageError);
                        toast.error("Storage error. Please disable private browsing mode.", toastOptions);
                        return;
                    }
                    navigate("/");
                }
            } catch (error) {
                console.error("Login error:", error);
                toast.error("Cannot connect to server. Please check your network connection.", toastOptions);
            }
        }
    };

    return (
        <>
            <div className="login-container">
                {/* Debug info - remove in production */}
                <div style={{ fontSize: '10px', color: 'gray', padding: '5px' }}>
                    API URL: {loginRoute}
                </div>
                <form action="" onSubmit={(event) => handleSubmit(event)}>
                    <div className="brand">
                        <h1>SNAPPY</h1>
                    </div>
                    <input
                        type="text"
                        placeholder="Username or Email"
                        name="username"
                        min="3"
                        onChange={(e) => handleChange(e)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        name="password"
                        onChange={(e) => handleChange(e)}
                    />
                    <button type="submit">Log In</button>
                    <span>
                        Don't have an account ? <Link to="/register">Create One.</Link>
                    </span>
                    <span className="forgot-password-link">
                        <Link to="/forgotpassword">Forgot Password?</Link>
                    </span>
                </form>
            </div>
            <ToastContainer />
        </>
    );
}

export default Login;
