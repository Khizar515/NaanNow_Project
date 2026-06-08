const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    // Link the card to a specific user
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Card Details
    cardHolderName: { type: String, required: true },
    cardNumber: { type: String, required: true, unique: true },
    expiryDate: { type: String, required: true },
    
    // Security
    cvv: { type: String, required: true }, 
    pin: { type: String, required: true },
    
    // The simulated money
    balance: { type: Number, default: 5000 },
    
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);