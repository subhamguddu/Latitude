const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('./models/User');
const Booking = require('./models/Booking');

const app = express();
const port = 5006;

// Initialize Razorpay with your test API keys
const razorpay = new Razorpay({
  key_id: 'rzp_test_GOMEOGYbdqt8u1', // Replace with your test key ID
  key_secret: 'QaU2arfwpCm3bP1X7KRfPumN' // Replace with your test key secret
});

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Route to handle user registration
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, phone, dob, country, favoriteDestination, travelStyle, interests } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword, // Store the hashed password
      phone,
      dob,
      country,
      favoriteDestination,
      travelStyle,
      interests,
    });

    await newUser.save();
    res.status(201).redirect("/login.html");
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user');
  }
});

// Route to handle user login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id; // Store user ID in session
      res.status(200).redirect('/indexlogin.html'); // Redirect to the dashboard page
    } else {
      res.status(401).send('Invalid email or password');
    }
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).send('Error logging in user');
  }
});

// Route to handle booking creation
app.post('/book', async (req, res) => {
  const { startDate, state, numTravellers, selectedPackage, totalPrice } = req.body;
  const userId = req.session.userId; // Retrieve user ID from session

  if (!userId) {
    return res.status(401).send('User not logged in');
  }

  try {
    const newBooking = new Booking({
      startDate,
      state,
      numTravellers,
      package: selectedPackage,
      totalPrice,
      userId
    });

    await newBooking.save();
    res.status(201).send('Booking successful');
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).send('Error creating booking');
  }
});

// Route to create a Razorpay order
app.post('/create-order', async (req, res) => {
  const { amount } = req.body; // Amount in INR

  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: 'receipt#1'
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send('Error creating order');
  }
});

// Route to verify payment
app.post('/verify-payment', (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const generated_signature = crypto.createHmac('sha256', 'QaU2arfwpCm3bP1X7KRfPumN')
                                    .update(order_id + "|" + payment_id)
                                    .digest('hex');

  if (generated_signature === signature) {
    res.send('Payment verified');
  } else {
    res.status(400).send('Payment verification failed');
  }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/traveldatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});
