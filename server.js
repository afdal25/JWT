const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

let users = [];

// Secret key
const JWT_SECRET = 'EHGJjRlPzVwlGpVGZQUhAUpDVDbvWmSqsosuQtHbbDQdLFXWeTPkMhzXWCZhqRkP';

// Register endpoint
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // mengecek apabila users sudah digunakan
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    // menyimpan user ke database
    const userId = users.length + 1;
    users.push({ userId, username, email, password });

    res.status(201).json({ message: 'User registered successfully.' });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
        { userId: user.userId, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' } 
    );

    res.json({
        token,
        user: {
            userId: user.userId,
            username: user.username,
        }
    });
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token is required.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

app.put('/update-email', authenticateToken, (req, res) => {
    const { userId } = req.user;
    const { newEmail } = req.body;

    if (!newEmail) {
        return res.status(400).json({ message: 'New email is required.' });
    }

    // Find and update user
    const user = users.find(u => u.userId === userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    user.email = newEmail;
    res.json({ message: 'Email updated successfully.', user });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});