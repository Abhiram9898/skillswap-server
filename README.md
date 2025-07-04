# 🧠 SkillSwap – Backend
![_- visual selection](https://github.com/user-attachments/assets/5e395230-995f-4214-a765-566a9a609605)

Welcome to the **backend repository** for **SkillSwap**, the server-side application that powers the platform. Built with **Node.js**, **Express**, and **MongoDB**, it provides a secure, scalable, and real-time API for managing users, skills, bookings, reviews, and chat functionality.

---

## ✨ Features

### 📦 RESTful API
Robust set of endpoints for core functionalities:  
- Authentication
- Users
- Skills
- Bookings
- Reviews
- Messages

---

### 👤 User Management
- Secure registration and login with JWT
- Password hashing using `bcryptjs`
- Role-based access (Student, Instructor, Admin)
- User profile view/update
- Admin functions: view/delete users, statistics

---

### 🛠️ Skill Management
- Full CRUD for skills
- Public access to view skills
- Instructor-only skill management
- Search and filter support

---

### 📅 Booking System
- Book skills with real-time conflict detection
- Manage statuses: pending, confirmed, completed, cancelled
- User/instructor-specific booking views
- Admin access to all bookings

---

### 📝 Review System
- Post reviews (after completed booking only)
- Prevents duplicate reviews
- Auto-calculates average rating
- Fetch all reviews per skill

---

### 💬 Real-time Chat (Socket.IO)
- Authenticated chat between student & instructor
- Room-based messaging per booking
- Stores messages in DB
- TTL indexing for pruning old messages

---

### 🔐 Security & Middleware
- JWT Authentication
- Password hashing (bcrypt)
- CORS configuration
- Helmet for HTTP headers
- Rate limiting
- Input validation (`express-validator`)
- Global error handling

---

### 🗄️ Database
- MongoDB with `Mongoose` ODM
- Schema validation
- Efficient indexing
- Document population for relationships

---

## 🚀 Technologies Used

| Purpose              | Technology |
|----------------------|------------|
| Backend Runtime      | Node.js |
| Web Framework        | Express.js (v5.x) |
| Database             | MongoDB |
| ODM                  | Mongoose (v8.x) |
| Real-time Messaging  | Socket.IO (v4.x) |
| Authentication       | JSON Web Token (JWT) |
| Password Hashing     | bcryptjs |
| Validation           | express-validator |
| Error Handling       | express-async-handler |
| Security Headers     | Helmet |
| CORS Middleware      | cors |
| Environment Config   | dotenv |
| Logging              | Morgan |
| Cookie Handling      | cookie-parser |
| File Upload (future) | Multer (planned) |

---

## 🛠️ Setup & Installation

### ✅ Prerequisites
- Node.js v18+
- npm or Yarn
- MongoDB (local or Atlas)

### 📥 Clone the Repository
```bash
git clone <your-backend-repo-url>
cd server
📦 Install Dependencies
bash
Copy
Edit
npm install
# OR
yarn install
⚙️ Environment Variables
Create a .env file in server/:

env
Copy
Edit
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillswap
CLIENT_URL=http://localhost:5173
JWT_SECRET=YOUR_SUPER_STRONG_RANDOM_JWT_SECRET_KEY
Note:

Use MongoDB Atlas for production

Use your deployed frontend URL for CLIENT_URL

Generate strong secrets via:

bash
Copy
Edit
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Never commit your .env file!

▶️ Start Development Server
bash
Copy
Edit
npm start
# OR
npm run dev
Server will run at http://localhost:5000

📂 Project Structure
bash
Copy
Edit
server/
│
├── controllers/       # Route handlers (auth, skill, booking, review, etc.)
├── middleware/        # Auth, error, validation, rate-limiter, etc.
├── models/            # Mongoose schemas (User, Skill, Booking, Message)
├── routes/            # API route definitions
├── index.js           # Main app entry (Express + Socket.IO setup)
├── config/            # DB connection, socket config (optional)
└── .env               # Sensitive configuration
⚡ API Endpoints Overview
🔐 Authentication
bash
Copy
Edit
POST    /api/auth/register        # Register new user
POST    /api/auth/login           # Login & receive JWT
POST    /api/auth/logout          # Logout
GET     /api/auth/me              # Get current user's profile
👥 Users
pgsql
Copy
Edit
GET     /api/users/:id            # Get user by ID
PUT     /api/users/:id            # Update profile
DELETE  /api/users/:id            # Delete user (Admin)
GET     /api/users                # Get all users (Admin)
GET     /api/users/stats          # User stats (Admin)
📘 Skills
bash
Copy
Edit
POST    /api/skills               # Create skill (Instructor)
GET     /api/skills               # View all skills (with filters)
GET     /api/skills/:id           # View skill by ID
GET     /api/skills/instructor    # Instructor's skills
PUT     /api/skills/:id           # Update skill (Owner)
DELETE  /api/skills/:id           # Delete skill (Owner/Admin)
📅 Bookings
bash
Copy
Edit
POST    /api/bookings             # Book a skill
GET     /api/bookings/user/:id    # User’s bookings
GET     /api/bookings/instructor/:id # Instructor’s bookings
PUT     /api/bookings/:id/status  # Update status
DELETE  /api/bookings/:id         # Cancel booking
GET     /api/bookings/admin/all   # All bookings (Admin)
💬 Messages
bash
Copy
Edit
GET     /api/messages/:bookingId  # All messages for booking
POST    /api/messages             # Send message (fallback for sockets)
⭐ Reviews
bash
Copy
Edit
POST    /api/reviews              # Add review (after booking)
GET     /api/reviews/:id          # Get all reviews for skill
☁️ Deployment (Render Example)
🗃 Database
Use MongoDB Atlas (Free Tier)

🔑 Environment Variables (Render)
MONGODB_URI – Your Atlas URI

CLIENT_URL – Frontend production URL

JWT_SECRET – Secure random string

NODE_ENV=production

⚙️ Render Configuration
Setting	Value
Build Command	npm install
Start Command	node index.js
Health Check	/api/health (optional)

Note: For file uploads, integrate with services like Cloudinary or AWS S3.

🤝 Contributing
We welcome contributions!
Fork the repo, make changes, and submit a pull request.
Let’s build SkillSwap together 🚀

📄 License
This project is licensed under the ISC License.
