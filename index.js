require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const { saveMessage } = require('./controllers/messageController');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Check required ENV variables
if (!process.env.MONGODB_URI || !process.env.CLIENT_URL || !process.env.JWT_SECRET) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Initialize app
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.get('/', (req, res) => res.send('SkillSwap API is running...'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/skills', require('./routes/skillRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Global Error Handler
app.use(errorHandler);

// Start HTTP server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.io Setup with updated configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io/',
  pingInterval: 25000,  // Increased from 10s
  pingTimeout: 20000,   // Increased from 5s
  maxHttpBufferSize: 1e8, // 100MB
  connectTimeout: 30000
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found.'));
    }

    socket.user = user; 
    next();
  } catch (error) {
    console.error('Socket.IO JWT Verification Error:', error.message);
    next(new Error('Authentication error: Invalid token.'));
  }
});

io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id, 'User ID:', socket.user._id, 'Role:', socket.user.role);

  socket.on('joinRoom', (bookingId) => {
    socket.join(bookingId);
    console.log(`👥 User ${socket.user._id} (${socket.user.role}) joined room ${bookingId}`);
  });

  socket.on('sendMessage', async ({ bookingId, message, sender }) => {
    console.log('📩 Message received from:', {
      userId: socket.user._id,
      role: socket.user.role,
      bookingId,
      messageLength: message?.length
    });

    try {
      // Validate message
      if (!message || typeof message !== 'string' || message.length > 5000) {
        throw new Error(`Invalid message (length: ${message?.length})`);
      }

      // Verify sender
      if (!sender || !sender._id || socket.user._id.toString() !== sender._id.toString()) {
        console.warn('⚠️ Security Alert: Mismatched sender ID', {
          socketUser: socket.user._id.toString(),
          payloadSender: sender?._id?.toString()
        });
        return socket.emit('messageError', { message: 'Unauthorized sender ID.' });
      }

      const messageData = {
        bookingId,
        message: message.trim(),
        senderId: socket.user._id,
        role: socket.user.role
      };

      const savedMessage = await saveMessage(messageData);
      
      const messageToEmit = {
        _id: savedMessage._id,
        bookingId: savedMessage.bookingId,
        message: savedMessage.message,
        sender: {
          _id: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        },
        createdAt: savedMessage.createdAt
      };

      io.to(bookingId).emit('receiveMessage', messageToEmit);
      console.log('✅ Message delivered to room:', bookingId);
      
    } catch (error) {
      console.error('💥 Message Error:', {
        userId: socket.user._id,
        role: socket.user.role,
        error: error.message
      });
      
      socket.emit('messageError', { 
        message: `Failed to send ${socket.user.role} message`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', {
      socketId: socket.id,
      userId: socket.user?._id,
      role: socket.user?.role,
      reason: reason,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('error', (error) => {
    console.error('⚡ Socket Error:', {
      userId: socket.user?._id,
      role: socket.user?.role,
      error: error.message
    });
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});