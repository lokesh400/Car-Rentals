const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/user');  // User model
const app = express();
const port = 3000;

const Car = require('./models/car');

// Connect to MongoDB
mongoose.connect(process.env.mongo_url)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Failed to connect to MongoDB:', err));

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up EJS view engine
app.set('view engine', 'ejs');
app.set('views', './views');  // Directory where EJS files are stored
app.use(express.static(path.join(__dirname, 'public')));

// Flash messages middleware
app.use(flash());

// Session management setup
app.use(session({
  secret: 'secret-key', // Use a strong secret key
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours session expiry
    httpOnly: true, // Prevent XSS
    secure: process.env.NODE_ENV,
    sameSite: 'strict', // Prevent CSRF
  },
}));


// Global middleware to handle flash messages and user sessions
app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // User object in session
  res.locals.error_msg = req.flash('error_msg');  // Flash error messages
  res.locals.success_msg = req.flash('success_msg');  // Flash success messages
  next();
});

const adminrouter = require("./routes/cars.js");

// Home route (public)
app.get('/',(req, res) => {
  res.render('index');
});
// Admin route (protected by authentication)
app.get('/admin', ensureAuthenticated, async (req, res) => {
   if (req.session.user.role === 'admin') {
     const cars = await Car.find();
     res.render('admin-dashboard', { cars });
  } else {
    req.flash('error_msg', 'You are not authorized to access this page');
    res.redirect('/');
  }
});

// Register page
app.get('/auth/register', (req, res) => {
  res.render('register');
});

// Register route
app.post('/auth/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Basic validation
  if (password !== confirmPassword) {
    req.flash('error_msg', 'Passwords do not match');
    return res.redirect('/auth/register');
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error_msg', 'Email is already taken');
      return res.redirect('/auth/register');
    }

    const newUser = new User({ name, email, username: email, password });
    await newUser.save();
    req.flash('success_msg', 'Registration successful! Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error during registration');
    res.redirect('/auth/register');
  }
});

// Login page
app.get('/auth/login', (req, res) => {
  res.render('login');
});

// Login route
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    // Store user info in session
    req.session.user = user;

    // Redirect to admin
    res.redirect('/admin');
  } catch (err) {
    console.log(err);
    req.flash('error_msg', 'Error during login');
    res.redirect('/auth/login');
  }
});

// Logout route
app.get('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.redirect('/');
  });
});

app.use("/",adminrouter);


// Edit car details
app.get('/admin/edit-car/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    res.render('edit-car', { car });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
});

// Handle updating car details
app.post('/admin/edit-car/:id', async (req, res) => {
  const { name, brand, year, pricePerDay } = req.body;
  try {
    await Car.findByIdAndUpdate(req.params.id, { name, brand, year, pricePerDay });
    res.redirect('/admin');
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
});

// Delete car
app.post('/admin/delete-car/:id', async (req, res) => {
  try {
    await Car.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
});










// Middleware to protect routes that need authentication
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', 'You must be logged in to view that page');
  res.redirect('/auth/login');
}

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
