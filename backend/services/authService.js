const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tamil-travel-planner-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

function getSupabase() {
  return require('../db').supabase;
}

async function initUsersTable() {
  // Tables already exist on Supabase
}

async function registerUser({ name, email, phone, password }) {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('email', email)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error('இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, phone: phone || null, password_hash: passwordHash })
    .select('id')
    .single();

  if (error) throw new Error(`Registration failed: ${error.message}`);

  const token = jwt.sign(
    { userId: data.id, email, name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { userId: data.id, name, email, phone, token };
}

async function loginUser({ email, password }) {
  const supabase = getSupabase();

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .limit(1);

  if (error || !users || users.length === 0) {
    throw new Error('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது');
  }

  const user = users[0];
  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    throw new Error('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது');
  }

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

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function getUserById(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, created_at')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

async function getUserByEmail(email) {
  const supabase = getSupabase();
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, phone, password_hash, created_at')
    .ilike('email', email)
    .limit(1);

  if (error || !users || users.length === 0) return null;
  return users[0];
}

async function updateUserPassword(userId, password) {
  const supabase = getSupabase();
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', userId);

  if (error) throw new Error(`Password update failed: ${error.message}`);
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
