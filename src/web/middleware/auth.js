import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mentorai-admin-secret-key-change-in-production';

export function authMiddleware(req, res, next) {
  // Get token from cookie or header
  const token = req.cookies?.adminToken || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    console.log('No token found');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
