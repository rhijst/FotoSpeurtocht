const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const User = require('../models/User');

exports.register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password_hash: hashedPassword,
            role: role || 'participant',
        });

        res.status(201).json({
            id: user._id,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};