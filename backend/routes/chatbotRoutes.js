const express = require('express');
const router = express.Router();
const multer = require('multer');
const chatbotController = require('../controllers/chatbotController');
const { authenticateJWT, authorizeRole } = require('../middleware/authMiddleware');

// Setup multer for temporary audio file storage
const upload = multer({ 
  dest: 'scratch/', 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication is now optional/removed so the chatbot is accessible without login
// If you want to identify users when they ARE logged in, we could use an optional auth middleware.
// For now, these routes are public.

// Routes
router.post('/message', chatbotController.chatMessage);
router.post('/voice', upload.single('audio'), chatbotController.voiceMessage);

module.exports = router;
