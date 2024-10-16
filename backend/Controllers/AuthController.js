const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usersSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,  // Ensure usernames are unique
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

const Users = mongoose.model('Users', usersSchema);

const router = express.Router();

// Login Controller
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        let user = await Users.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid password" });
        }

        return res.json({
            message: "Login successful",
            success: true,
        });
    } catch (error) {
        res.status(500).json({ message: "Unable to handle request", error: error.message });
    }
});

// Signup Controller
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        let existingUser = await Users.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new Users({
            username,
            password: hashedPassword,
        });

        await user.save();

        return res.status(201).json({
            message: "User created successfully",
            success: true,
        });
    } catch (error) {
        res.status(500).json({ message: "Unable to handle request", error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await Users.find();
        return res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Unable to handle request", error: error.message });
    }
});

module.exports = router;
