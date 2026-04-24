const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const allowedRoles = [
  "LEGAL_PROFESSIONAL",
  "COMPLIANCE_OFFICER",
  "SYSTEM_ADMIN"
];

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }

    const userRole = allowedRoles.includes(role)
      ? role
      : "LEGAL_PROFESSIONAL";

    const existing = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4)",
      [name, email, hashedPassword, userRole]
    );

    res.json({
      message: "Signup successful",
      role: userRole
    });
  } catch (err) {
    res.status(500).json({
      error: "Signup failed",
      details: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userData.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const user = userData.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({
      error: "Login failed",
      details: err.message
    });
  }
};