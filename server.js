const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const projectRoutes = require('./routes/projects.routes');
const messageRoutes = require('./routes/messages.routes');
const experienceRoutes = require('./routes/experience.routes');
const aboutRoutes = require('./routes/about.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database connection
connectDB();

// Core Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret', 'x-access-token', 'Accept'],
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Base informational endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Portfolio Backend API is running successfully',
    endpoints: {
      auth: '/api/auth',
      about: '/api/about',
      content: '/api/content',
      projects: '/api/projects',
      experience: '/api/experience',
      messages: '/api/messages',
      contact: '/api/contact',
      health: '/api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

// Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contact', messageRoutes); // Alias for contact form submissions

// Direct resume download shortcuts for any user/recruiter
app.get('/api/resume', (req, res) => res.redirect('/api/about/cv/download'));
app.get('/resume', (req, res) => res.redirect('/api/about/cv/download'));

// 404 Handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err);
  res.status(500).json({ error: 'Internal Server Error: ' + (err.message || 'Unknown error') });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});