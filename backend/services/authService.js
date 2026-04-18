const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'tamil-travel-planner-secret-key-2026';
const JWT_EXPIRES_IN = '7d';
/**
 * Initialize users table in the database.
 * (Now handled dynamically in db.js via pool initializeSchema,
 * so we can leave this empty or removed, but keeping it for compat)
 */
async function initUsersTable() {
  // handled in db.js securely.
}

/**
 * Register a new user.
 */
async function registerUser({ name, email, phone, password }) {
  const db = await getDb(); // returns pool

  // Check if email already exists
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது');
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Insert user
  const result = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, phone || null, passwordHash]
  );
  
  const insertId = result.rows[0].id;

  // Generate JWT
  const token = jwt.sign(
    { userId: insertId, email, name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    userId: insertId,
    name,
    email,
    phone,
    token,
  };
}

/**
 * Login an existing user.
 */
async function loginUser({ email, password }) {
  const db = await getDb();

  const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) {
    throw new Error('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது');
  }

  const user = userRes.rows[0];

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    throw new Error('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது');
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    token,
  };
}

/**
 * Verify a JWT token and return user info.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Get user profile by ID.
 */
async function getUserById(userId) {
  const db = await getDb();
  const userRes = await db.query('SELECT id, name, email, phone, created_at FROM users WHERE id = $1', [userId]);
  return userRes.rows[0] || null;
}

async function getUserByEmail(email) {
  const db = await getDb();
  const userRes = await db.query(
    'SELECT id, name, email, phone, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return userRes.rows[0] || null;
}

async function updateUserPassword(userId, password) {
  const db = await getDb();
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [passwordHash, userId]
  );
}

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  getUserById,
  getUserByEmail,
  updateUserPassword,
  initUsersTable,
};
