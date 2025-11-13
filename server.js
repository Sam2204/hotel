const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose'); // <-- NEW: MongoDB driver

const app = express();
const PORT = 3000;

// ----------------------------------------------------
// 1. MongoDB Connection Setup (The DevOps Way)
// ----------------------------------------------------

// Use the environment variable MONGODB_URI. 
// This allows you to pass the secret connection string during docker run or CI/CD deployment.
const MONGODB_URI = process.env.MONGODB_URI;

// Throw an error if the URI is not set, as the app is unusable without the database
if (!MONGODB_URI) {
    console.error("CRITICAL ERROR: MONGODB_URI environment variable is not set.");
    process.exit(1); // Exit the process
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// ----------------------------------------------------
// 2. Define the User Schema (Model)
// ----------------------------------------------------
// This schema defines the structure of the 'users' collection in MongoDB.
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // NOTE: In production, always hash this password using 'bcrypt'!
    password: { type: String, required: true },
    phone: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// ----------------------------------------------------
// 3. Middleware Setup
// ----------------------------------------------------
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve static files (HTML/CSS) from the current directory
app.use(express.static(__dirname));

// REMOVED: XLSX, path requires, and helper functions (readUsers, writeUsers)

// ----------------------------------------------------
// 4. Signup Route (Uses Database)
// ----------------------------------------------------
app.post('/signup', async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
        // Find a user by email in MongoDB (Replaces users.find(u => u.email === email))
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists!' });
        }

        // Create and save the new user (Replaces users.push + writeUsers)
        const newUser = new User({ name, email, password, phone });
        await newUser.save();

        res.json({ message: 'Signup successful!' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// ----------------------------------------------------
// 5. Login Route (Uses Database)
// ----------------------------------------------------
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });

        // User not found OR password mismatch (Replaces checking the users array)
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Success
        res.json({ message: 'Login successful!', user: { name: user.name, email: user.email } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// ----------------------------------------------------
// 6. Start Server
// ----------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});