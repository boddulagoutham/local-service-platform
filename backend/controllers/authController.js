
const { pool } = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registerUser(req, res) {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        if (!["customer", "provider"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existing] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existing.length) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, ?)`,
            [name.trim(), normalizedEmail, hashedPassword, role]
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: result.insertId,
                name: name.trim(),
                email: normalizedEmail,
                role
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        const [rows] = await pool.execute(
            `SELECT id, name, email, password, role
             FROM users WHERE email = ?`,
            [email.trim().toLowerCase()]
        );

        if (!rows.length) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Login failed"
        });
    }
}

module.exports = { registerUser, loginUser };
