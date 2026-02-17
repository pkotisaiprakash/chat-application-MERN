# 💬 Snappy Chat

A real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js). Features include instant messaging, group chats, scheduled messages, and more.

![Snappy Chat](https://via.placeholder.com/800x400/8b5cf6/ffffff?text=Snappy+Chat)

## ✨ Features

- 💬 **Real-time Messaging** - Instant chat with Socket.io
- 👥 **Group Chats** - Create and manage group conversations
- 📅 **Scheduled Messages** - Schedule messages to be sent later
- 🔔 **Forgot Password** - Secure OTP-based password reset
- 🎨 **Beautiful UI** - Modern, responsive design with animations
- 📱 **Mobile Friendly** - Works on all devices
- 🔒 **Secure** - JWT authentication and password hashing

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pkotisaiprakash/chat-application-MERN.git
   cd snappy-chat
   ```

2. **Set up the server**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Set up the client**
   ```bash
   cd cHat
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 📁 Project Structure

```
snappy-chat/
├── cHat/                    # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   └── utils/          # Utility functions
│   ├── public/             # Static files
│   └── .env.example        # Environment template
├── server/                  # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── .env.example        # Environment template
│   └── index.js            # Entry point
└── README.md               # This file
```

## 🔧 Environment Variables

### Server (.env)

```env
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/chat_app
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration (for forgot password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@gmail.com

FRONTEND_URL=http://localhost:5173
OTP_EXPIRY_MINUTES=15
```

### Client (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Snappy Chat
VITE_ENABLE_ANIMATIONS=true
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgotpassword` - Request password reset
- `POST /api/auth/verifyotp` - Verify OTP
- `POST /api/auth/resetpassword` - Reset password

### Users
- `GET /api/auth/allusers/:id` - Get all users
- `GET /api/auth/username/:username` - Get user by username
- `PUT /api/auth/setavatar/:id` - Set user avatar
- `PUT /api/auth/updateabout/:id` - Update about section
- `PUT /api/auth/updateusername/:id` - Update username

### Messages
- `POST /api/messages/addmsg` - Send message
- `GET /api/messages/getmsg/:from/:to` - Get messages between users
- `DELETE /api/messages/deletemsg/:id` - Delete message
- `PUT /api/messages/editmsg/:id` - Edit message

### Groups
- `POST /api/groups/create` - Create group
- `GET /api/groups/user/:userId` - Get user's groups
- `POST /api/groups/addmember` - Add member to group
- `POST /api/groups/removemember` - Remove member from group

### Scheduled Messages
- `POST /api/scheduled/schedule` - Schedule a message
- `GET /api/scheduled/scheduled/:userId` - Get scheduled messages
- `DELETE /api/scheduled/cancel/:id` - Cancel scheduled message

## 🎨 Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Socket.io Client
- Framer Motion (animations)

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- Socket.io
- JWT Authentication
- Nodemailer (email)
- BCrypt (password hashing)

## 📝 License

MIT License - feel free to use this project for learning or as a starting point for your own projects.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

Project Link: [https://github.com/pkotisaiprakash/chat-application-MERN](https://github.com/pkotisaiprakash/chat-application-MERN)
