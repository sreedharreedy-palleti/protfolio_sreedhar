const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyAdmin } = require('../middleware/auth.middleware');

const MessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// POST public contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields (name, email, message) are required.' });
    }
    const newMessage = await Message.create({ name, email, message });
    res.status(201).json({ success: true, message: 'Message sent successfully!', data: newMessage });
  } catch (error) {
    console.error('Error submitting message:', error.message);
    res.status(500).json({ error: 'Could not submit message: ' + error.message });
  }
});

// GET messages (Admin Only)
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: 'Failed to fetch messages: ' + error.message });
  }
});

// DELETE message (Admin Only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const deleted = await Message.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Error deleting message:', error.message);
    res.status(500).json({ error: 'Failed to delete message: ' + error.message });
  }
});

module.exports = router;