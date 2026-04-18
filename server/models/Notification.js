const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['warning', 'danger', 'success', 'info'], default: 'info' },
    isRead: { type: Boolean, default: false },
    meta: { type: Object, default: {} }, // extra data like percentage, amount etc
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
