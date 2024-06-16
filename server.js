const express = require('express');
const mongoose = require('mongoose');
const Registeruser = require('./model');
const jwt = require('jsonwebtoken');
const middleware = require('./middleware');
const cors = require('cors');

const app = express();
const PORT = 4000;
const JWT_SECRET = 'jwtSecret';
const DB_URI = "mongodb+srv://test:test@cluster0.pqfzmfe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('DB Connection established'))
  .catch(err => console.error('DB Connection error:', err));

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// Routes

// Register route
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmpassword } = req.body;

    // Check if user already exists
    const exist = await Registeruser.findOne({ email });
    if (exist) {
      return res.status(400).send('User Already Exists');
    }

    // Check if passwords match
    if (password !== confirmpassword) {
      return res.status(400).send('Passwords do not match');
    }

    // Create and save new user
    const newUser = new Registeruser({ username, email, password, confirmpassword });
    await newUser.save();
    res.status(200).send('Registered Successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const exist = await Registeruser.findOne({ email });
    if (!exist) {
      return res.status(400).send('User Not Found');
    }

    // Check if password matches
    if (exist.password !== password) {
      return res.status(400).send('Invalid credentials');
    }

    // Create JWT payload and sign token
    const payload = { user: { id: exist.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: 3600000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Profile route
app.get('/myprofile', middleware, async (req, res) => {
  try {
    const user = await Registeruser.findById(req.user.id);
    if (!user) {
      return res.status(400).send('User not found');
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
