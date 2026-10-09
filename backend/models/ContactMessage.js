const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  phone: { type: String, trim: true, default: '', maxlength: 20 },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null for public submissions
  ipAddress: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);
