const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['customer', 'restaurant_owner', 'admin', 'rider'], 
        default: 'customer' 
    },
    profilePic: { type: String, default: '/uploads/defaults/profile-avatar.png' },
    earningsBalance: { type: Number, default: 0 }, 
    
    //Rider Verification
    isApprovedRider: { type: Boolean, default: false },
    riderProofs: [{ type: String }],
    address: { type: String }, 
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);