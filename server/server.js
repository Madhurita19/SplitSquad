import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import expenseRoutes from './routes/expenses.js';
import settlementRoutes from './routes/settlements.js';
import eventRoutes from './routes/events.js';
import notificationRoutes from './routes/notifications.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { initExpenseCron } from './jobs/expenseCron.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Initialize recurring expense cron job
initExpenseCron();

// Rate Limiting Config
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per window
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit auth attempts to 15 per window
    message: { message: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());

// Apply global rate limiter
app.use('/api/', apiLimiter);

// Main Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);

import path from 'path';
const __dirname = path.resolve();

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Route
app.get('/', (req, res) => {
    res.send('SplitSquad API is running...');
});

// Error Handling Middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
