const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_portfolio_key_987654321_secure';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'myadminsecret123';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const secretHeader = req.headers['x-admin-secret'];
  const tokenHeader = req.headers['x-access-token'];

  // Check Bearer token first
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (tokenHeader) {
    token = tokenHeader.trim();
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      return next();
    } catch (err) {
      // If token verification failed, check if fallback x-admin-secret is valid
      if (secretHeader && secretHeader === ADMIN_SECRET) {
        req.admin = { role: 'admin', username: ADMIN_USERNAME };
        return next();
      }
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired admin session token.',
        code: 'TOKEN_EXPIRED_OR_INVALID',
      });
    }
  }

  // Fallback to x-admin-secret header
  if (secretHeader) {
    if (secretHeader === ADMIN_SECRET) {
      req.admin = { role: 'admin', username: ADMIN_USERNAME };
      return next();
    }
    return res.status(401).json({
      error: 'Unauthorized: Invalid Admin Secret provided.',
      code: 'SECRET_INVALID',
    });
  }

  return res.status(401).json({
    error: 'Unauthorized: Admin authentication token or secret is required.',
    code: 'AUTH_REQUIRED',
  });
};

module.exports = {
  verifyAdmin,
  JWT_SECRET,
};
