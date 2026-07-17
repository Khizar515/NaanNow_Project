const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
    platformMarkupPercentage: { type: Number, default: 10 }, 
    perKmDeliveryRate: { type: Number, default: 30 },
}, { timestamps: true });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);