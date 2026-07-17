require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const console = require('console');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore || require('connect-mongo').default || require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const engine = require('ejs-mate');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://database:27017/Naan_Now';

<<<<<<< HEAD
// EJS
=======
//EJS
>>>>>>> b65457ea009fe5d62929b9ca5b27c0a3b9db7ef2
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

<<<<<<< HEAD
// Static files
=======

>>>>>>> b65457ea009fe5d62929b9ca5b27c0a3b9db7ef2
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

<<<<<<< HEAD
// Session Management
=======
//Session management
>>>>>>> b65457ea009fe5d62929b9ca5b27c0a3b9db7ef2
app.use(session({
    secret: process.env.JWT_SECRET || 'naannow-session-secret-dev',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        collectionName: 'sessions',
<<<<<<< HEAD
        ttl: 7 * 24 * 60 * 60 // 7 days
=======
        ttl: 7 * 24 * 60 * 60 // 7 days 
>>>>>>> b65457ea009fe5d62929b9ca5b27c0a3b9db7ef2
    }),
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        httpOnly: true,
<<<<<<< HEAD
        secure: false //true for https
=======
        secure: false // true for https
>>>>>>> b65457ea009fe5d62929b9ca5b27c0a3b9db7ef2
    }
}));

//flash messages
app.use(flash());

//Global variables accessable to all EJS in project
app.use((req, res, next) => {
    // session user and flash messages available in ALL EJS templates
    res.locals.currentUser = req.session.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.warning_msg = req.flash('warning_msg');
    res.locals.info_msg = req.flash('info_msg');
    next();
});

//Routes
app.use('/auth', require('./routes/auth'));
app.use('/wallet', require('./routes/wallet'));
app.use('/restaurants', require('./routes/restaurant'));
app.use('/menu', require('./routes/menu'));
app.use('/orders', require('./routes/order'));
app.use('/admin', require('./routes/admin'));
app.use('/riders', require('./routes/rider'));
app.use('/users', require('./routes/user'));
app.use('/cart', require('./routes/cart'));

// Homepage Route
const Restaurant = require('./models/Restaurant');
app.get('/', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isApproved: true, isOpen: true })
            .select('-verificationDocuments');
        res.render('home/index', { title: 'Home', restaurants });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error loading restaurants.');
        res.render('home/index', { title: 'Home', restaurants: [] });
    }
});

//ScoketIO
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`⚡ User Connected: ${socket.id}`);

    socket.on('join_room', (orderId) => {
        socket.join(orderId);
        console.log(`👤 User joined Order Room: ${orderId}`);
    });

    // Event: Chat message
    socket.on('send_message', async (data) => {
        // data = { orderId, senderId, senderName, text }
        try {
            const ChatSession = require('./models/ChatSession');
            const session = await ChatSession.findOne({ orderId: data.orderId });
            if (session) {
                session.messages.push({
                    senderId: data.senderId,
                    text: data.text,
                    timestamp: new Date()
                });
                await session.save();
            }
            // Sends the message to EVERYONE in the room EXCEPT the sender
            socket.to(data.orderId).emit('receive_message', data);
        } catch (error) {
            console.error('Chat save error:', error);
        }
    });

    // Event: Live GPS tracking
    socket.on('update_location', (data) => {
        // data = { orderId, coordinates: [lon, lat] }
        socket.to(data.orderId).emit('location_updated', data.coordinates);
    });

    socket.on('disconnect', () => {
        console.log(`🔴 User Disconnected: ${socket.id}`);
    });
});

//Invalid Route handler
app.use((req, res) => {
    res.status(404).render('home/index', {
        title: '404 — Not Found',
        restaurants: []
    });
});

//Database Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));


//Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});