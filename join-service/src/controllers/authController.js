const bcrypt = require('bcrypt');
const User = require('../models/User');
const { getChannel } = require('../config/rabbit');

exports.verify = async (req, res) => {
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

        res.json({ userId: user._id, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

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

        const channel = getChannel();
        channel.publish('events', 'user.registered', Buffer.from(JSON.stringify({ email: user.email })));

        res.status(201).json({
            id: user._id,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};