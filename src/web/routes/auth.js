import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'mentorai-admin-secret-key-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Mentor$ecure#2025!';
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;

// Admin credentials
const ADMIN_USERS = [];

// Initialize admin user
async function initializeAdmin() {
  if (ADMIN_USERS.length === 0) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    ADMIN_USERS.push({
      id: '1',
      username: ADMIN_USERNAME,
      passwordHash: passwordHash,
      role: 'superadmin'
    });
    console.log('✅ Admin user initialized');
  }
}

// Initialize on module load
initializeAdmin();

router.post('/login', async (req, res) => {
  try {
    // Ensure admin is initialized
    await initializeAdmin();
    
    const { username, password } = req.body;
    
    console.log('Login attempt:', username);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const user = ADMIN_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      console.log('Invalid password for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log('Login successful:', username);
    
    res.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true });
});

router.get('/verify', (req, res) => {
  const token = req.cookies.adminToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.json({ authenticated: false });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: decoded });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

export default router;
