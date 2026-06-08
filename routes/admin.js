const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const AdminSettings = require('../models/AdminSettings');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRestaurants = await Restaurant.countDocuments();

        const activeOrders = await Order.countDocuments({
            status: { $nin: ['Delivered', 'Cancelled'] }
        });

        const completedOrders = await Order.find({ status: 'Delivered' });
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.financials.grandTotal, 0);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: {
                totalUsers,
                totalRestaurants,
                activeOrders,
                totalRevenue: Math.round(totalRevenue)
            }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Server error loading dashboard.');
        res.redirect('/');
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.render('admin/users', { title: 'User Management', users });
    } catch (error) {
        req.flash('error_msg', 'Server error loading users.');
        res.redirect('/admin/dashboard');
    }
});

//List all restaurants for approval management
router.get('/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find().populate('ownerId', 'name email').sort({ createdAt: -1 });
        res.render('admin/restaurants', { title: 'Restaurant Applications', restaurants });
    } catch (error) {
        req.flash('error_msg', 'Server error loading restaurants.');
        res.redirect('/admin/dashboard');
    }
});

// List all riders for approval management
router.get('/riders', async (req, res) => {
    try {
        const riders = await User.find({ role: 'rider' }).select('-password').sort({ createdAt: -1 });
        res.render('admin/riders', { title: 'Rider Applications', riders });
    } catch (error) {
        req.flash('error_msg', 'Server error loading riders.');
        res.redirect('/admin/dashboard');
    }
});

//Approve a restaurant to go live
router.post('/approve-restaurant/:id', async (req, res) => {
    try {
        const shop = await Restaurant.findById(req.params.id);
        if (!shop) {
            req.flash('error_msg', 'Restaurant not found.');
            return res.redirect('/admin/restaurants');
        }

        shop.isApproved = true;
        shop.adminStatusMessage = 'Approved and active.';
        await shop.save();

        req.flash('success_msg', `"${shop.name}" has been APPROVED.`);
        res.redirect('/admin/restaurants');
    } catch (error) {
        req.flash('error_msg', 'Server error during approval.');
        res.redirect('/admin/restaurants');
    }
});

// Suspend a restaurant and provide a reason
router.post('/revoke-restaurant/:id', async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            req.flash('error_msg', 'You must provide a reason for revocation.');
            return res.redirect('/admin/restaurants');
        }

        const shop = await Restaurant.findById(req.params.id);
        if (!shop) {
            req.flash('error_msg', 'Restaurant not found.');
            return res.redirect('/admin/restaurants');
        }

        shop.isApproved = false;
        shop.isOpen = false;
        shop.adminStatusMessage = `Suspended by Admin: ${reason}`;

        await shop.save();

        req.flash('success_msg', `"${shop.name}" has been REVOKED.`);
        res.redirect('/admin/restaurants');
    } catch (error) {
        req.flash('error_msg', 'Server error during revocation.');
        res.redirect('/admin/restaurants');
    }
});

// Promote or demote a user account
router.post('/change-role/:userId', async (req, res) => {
    try {
        const { newRole } = req.body;
        const validRoles = ['customer', 'restaurant_owner', 'admin', 'rider'];

        if (!validRoles.includes(newRole)) {
            req.flash('error_msg', 'Invalid role provided.');
            return res.redirect('/admin/users');
        }

        // Prevent the admin from accidentally demoting themselves
        if (req.params.userId === req.user.userId) {
            req.flash('error_msg', 'You cannot change your own admin role.');
            return res.redirect('/admin/users');
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/admin/users');
        }

        user.role = newRole;
        await user.save();

        req.flash('success_msg', `${user.name} is now a ${newRole.toUpperCase().replace('_', ' ')}.`);
        res.redirect('/admin/users');
    } catch (error) {
        req.flash('error_msg', 'Server error changing role.');
        res.redirect('/admin/users');
    }
});

//Show settings form
router.get('/settings', async (req, res) => {
    try {
        const platformSettings = await AdminSettings.findOne();
        res.render('admin/settings', { title: 'Platform Settings', platformSettings });
    } catch (error) {
        req.flash('error_msg', 'Server error loading settings.');
        res.redirect('/admin/dashboard');
    }
});

// Update global financial markup and delivery rates
router.post('/settings', async (req, res) => {
    try {
        const { platformMarkupPercentage, perKmDeliveryRate } = req.body;

        let settings = await AdminSettings.findOne();

        if (!settings) {
            settings = new AdminSettings({ platformMarkupPercentage, perKmDeliveryRate });
        } else {
            if (platformMarkupPercentage) settings.platformMarkupPercentage = platformMarkupPercentage;
            if (perKmDeliveryRate) settings.perKmDeliveryRate = perKmDeliveryRate;
        }

        await settings.save();
        req.flash('success_msg', 'Platform settings updated!');
        res.redirect('/admin/settings');
    } catch (error) {
        req.flash('error_msg', 'Server error updating settings.');
        res.redirect('/admin/settings');
    }
});

//Approve a rider after checking their uploaded proofs
router.post('/approve-rider/:id', async (req, res) => {
    try {
        const rider = await User.findById(req.params.id);
        if (!rider || rider.role !== 'rider') {
            req.flash('error_msg', 'Rider not found.');
            return res.redirect('/admin/riders');
        }

        rider.isApprovedRider = true;
        await rider.save();

        req.flash('success_msg', `${rider.name} is now an APPROVED Rider.`);
        res.redirect('/admin/riders');
    } catch (error) {
        req.flash('error_msg', 'Server error during approval.');
        res.redirect('/admin/riders');
    }
});

module.exports = router;