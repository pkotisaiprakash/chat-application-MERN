// Use the same hostname as the page (works on LAN/mobile).
// For mobile access, set VITE_API_URL to your PC's IP (e.g., http://192.168.1.100:3001)
// Or manually configure via localStorage (key: "chat-api-url")
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const apiUrl = import.meta.env.VITE_API_URL;

// Check for manual override in localStorage
let manualUrl = null;
try {
    manualUrl = localStorage.getItem('chat-api-url');
} catch (e) {}

// Production fallback - set this in .env for production
const productionApiUrl = import.meta.env.VITE_PRODUCTION_API_URL;

let serverUrl;
if (manualUrl) {
    serverUrl = manualUrl;
} else if (apiUrl) {
    serverUrl = apiUrl;
} else if (productionApiUrl) {
    serverUrl = productionApiUrl;
} else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Default to localhost for PC browsers
    serverUrl = `http://localhost:3001`;
} else {
    // Use the hostname for LAN/mobile access
    serverUrl = `http://${hostname}:3001`;
}

export const host = serverUrl;
export const loginRoute = `${host}/api/auth/login`;

// Helper function to set server URL manually (for mobile)
export const setServerUrl = (url) => {
    try {
        localStorage.setItem('chat-api-url', url);
    } catch (e) {
        console.error('Cannot set localStorage:', e);
    }
};
export const registerRoute = `${host}/api/auth/register`;
export const logoutRoute = `${host}/api/auth/logout`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const recieveMessageRoute = `${host}/api/messages/getmsg`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;
export const deleteAvatarRoute = `${host}/api/auth/deleteavatar`;
export const updateAboutRoute = `${host}/api/auth/updateabout`;
export const updateUsernameRoute = `${host}/api/auth/updateusername`;
export const clearChatRoute = `${host}/api/messages/clearchat`;
export const editMessageRoute = `${host}/api/messages/editmsg`;
export const deleteMessageRoute = `${host}/api/messages/deletemsg`;
export const scheduleMessageRoute = `${host}/api/scheduled/schedule`;
export const getScheduledMessagesRoute = `${host}/api/scheduled/scheduled`;
export const rescheduleMessageRoute = `${host}/api/scheduled/reschedule`;
export const cancelScheduledMessageRoute = `${host}/api/scheduled/cancel`;
export const sendScheduledMessageRoute = `${host}/api/scheduled/send`;

// File upload
export const fileUploadRoute = `${host}/api/files/upload`;

// User routes
export const getUserByUsernameRoute = `${host}/api/auth/username`;

// Forgot Password Routes
export const forgotPasswordRoute = `${host}/api/auth/forgotpassword`;
export const verifyOTPRoute = `${host}/api/auth/verifyotp`;
export const resetPasswordRoute = `${host}/api/auth/resetpassword`;

// Group routes
export const createGroupRoute = `${host}/api/groups/create`;
export const getUserGroupsRoute = `${host}/api/groups/user`;
export const getGroupRoute = `${host}/api/groups`;
export const updateGroupRoute = `${host}/api/groups`;
export const deleteGroupRoute = `${host}/api/groups`;
export const addGroupMemberRoute = `${host}/api/groups`;
export const removeGroupMemberRoute = `${host}/api/groups`;
export const changeGroupAdminRoute = `${host}/api/groups`;
export const leaveGroupRoute = `${host}/api/groups`;
export const getGroupMessagesRoute = `${host}/api/groups`;
export const sendGroupMessageRoute = `${host}/api/groups`;
