const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyAdmin, JWT_SECRET } = require('../middleware/auth.middleware');
const AdminLockout = require('../models/AdminLockout');

// Lockout configurations
const MAX_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS, 10) || 5;
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_TIME_MINUTES, 10) || 15;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;

// Resilient In-Memory Fallback Cache (ensures zero latency & uptime if Mongo is buffering)
const memoryLockoutStore = new Map();

// Helper to get client identifier (IP address)
const getClientIdentifier = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || req.ip || '127.0.0.1';
  return `ip_${ip}`;
};

// Helper to retrieve lockout status
const getLockoutStatus = async (identifier) => {
  const now = Date.now();

  // Check in-memory store
  let memRecord = memoryLockoutStore.get(identifier);

  // Check MongoDB
  try {
    const dbRecord = await AdminLockout.findOne({ identifier }).lean();
    if (dbRecord) {
      memRecord = {
        failedAttempts: dbRecord.failedAttempts || 0,
        isLocked: dbRecord.isLocked || false,
        lockedUntil: dbRecord.lockedUntil ? new Date(dbRecord.lockedUntil).getTime() : null,
      };
      memoryLockoutStore.set(identifier, memRecord);
    }
  } catch (err) {
    // Non-fatal, use memory store
  }

  if (!memRecord) {
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutRemainingSeconds: 0,
      lockedUntil: null,
    };
  }

  // Check if lockout has expired
  if (memRecord.isLocked) {
    if (memRecord.lockedUntil && memRecord.lockedUntil > now) {
      const remainingSeconds = Math.ceil((memRecord.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        failedAttempts: memRecord.failedAttempts,
        remainingAttempts: 0,
        lockoutRemainingSeconds: remainingSeconds,
        lockedUntil: new Date(memRecord.lockedUntil).toISOString(),
      };
    } else {
      // Lockout expired, reset automatically
      memRecord.isLocked = false;
      memRecord.failedAttempts = 0;
      memRecord.lockedUntil = null;
      memoryLockoutStore.set(identifier, memRecord);

      try {
        await AdminLockout.findOneAndUpdate(
          { identifier },
          { isLocked: false, failedAttempts: 0, lockedUntil: null }
        );
      } catch (e) {
        // ignore
      }
    }
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - memRecord.failedAttempts);
  return {
    isLocked: false,
    failedAttempts: memRecord.failedAttempts,
    remainingAttempts: remaining,
    lockoutRemainingSeconds: 0,
    lockedUntil: null,
  };
};

// Helper to record a failed attempt
const recordFailedAttempt = async (identifier, req) => {
  const now = Date.now();
  let status = await getLockoutStatus(identifier);
  let newFailed = status.failedAttempts + 1;
  let isLocked = false;
  let lockedUntil = null;

  if (newFailed >= MAX_ATTEMPTS) {
    isLocked = true;
    lockedUntil = now + LOCKOUT_MS;
  }

  const memUpdate = {
    failedAttempts: newFailed,
    isLocked,
    lockedUntil,
  };
  memoryLockoutStore.set(identifier, memUpdate);

  try {
    await AdminLockout.findOneAndUpdate(
      { identifier },
      {
        $set: {
          failedAttempts: newFailed,
          isLocked,
          lockedUntil: lockedUntil ? new Date(lockedUntil) : null,
          lastAttemptAt: new Date(now),
        },
        $push: {
          history: {
            $each: [
              {
                timestamp: new Date(now),
                ip: req.ip || 'unknown',
                success: false,
                userAgent: req.headers['user-agent'] || '',
              },
            ],
            $slice: -20, // Keep last 20 log attempts
          },
        },
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    console.warn('[AUTH] Could not persist lockout to DB:', err.message);
  }

  const remainingSeconds = lockedUntil ? Math.ceil((lockedUntil - now) / 1000) : 0;
  return {
    isLocked,
    failedAttempts: newFailed,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - newFailed),
    lockoutRemainingSeconds: remainingSeconds,
    lockedUntil: lockedUntil ? new Date(lockedUntil).toISOString() : null,
  };
};

// Helper to reset lockout on successful login
const resetLockout = async (identifier, req) => {
  memoryLockoutStore.delete(identifier);
  try {
    await AdminLockout.findOneAndUpdate(
      { identifier },
      {
        $set: {
          failedAttempts: 0,
          isLocked: false,
          lockedUntil: null,
          lastAttemptAt: new Date(),
        },
        $push: {
          history: {
            $each: [
              {
                timestamp: new Date(),
                ip: req.ip || 'unknown',
                success: true,
                userAgent: req.headers['user-agent'] || '',
              },
            ],
            $slice: -20,
          },
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[AUTH] Could not reset DB lockout:', err.message);
  }
};

// 1. GET /api/auth/status
// Check current lockout status and token validity for client
router.get('/status', async (req, res) => {
  const identifier = getClientIdentifier(req);
  const lockout = await getLockoutStatus(identifier);

  // Check if token exists in header and is valid
  let isAuthenticated = false;
  let adminData = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7).trim(), JWT_SECRET);
      isAuthenticated = true;
      adminData = { username: decoded.username, role: decoded.role };
    } catch {
      isAuthenticated = false;
    }
  }

  res.status(200).json({
    ...lockout,
    maxAttempts: MAX_ATTEMPTS,
    lockoutWindowMinutes: LOCKOUT_MINUTES,
    authenticated: isAuthenticated,
    admin: adminData,
  });
});

// 2. POST /api/auth/login
// Handle admin login with lockout enforcement
router.post('/login', async (req, res) => {
  const identifier = getClientIdentifier(req);
  const { username, password, secretKey } = req.body;

  // 1. Check if user is locked out
  const currentLockout = await getLockoutStatus(identifier);
  if (currentLockout.isLocked) {
    const minutesLeft = Math.ceil(currentLockout.lockoutRemainingSeconds / 60);
    return res.status(429).json({
      error: `Security Alert: Admin access locked due to consecutive failed attempts. Please try again in ${minutesLeft} minute(s) (${currentLockout.lockoutRemainingSeconds}s).`,
      isLocked: true,
      lockoutRemainingSeconds: currentLockout.lockoutRemainingSeconds,
      lockedUntil: currentLockout.lockedUntil,
      remainingAttempts: 0,
    });
  }

  // 2. Validate input
  const expectedAdminUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const expectedAdminPass = (process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'myadminsecret123').trim();
  const expectedAdminSecret = (process.env.ADMIN_SECRET || 'myadminsecret123').trim();

  let isMatch = false;

  // Scenario A: Login via username & password
  if (username && password) {
    if (
      username.trim().toLowerCase() === expectedAdminUser.toLowerCase() &&
      password.trim() === expectedAdminPass
    ) {
      isMatch = true;
    }
  }

  // Scenario B: Direct admin secret key login
  if (!isMatch && (secretKey || password)) {
    const candidateSecret = (secretKey || password).trim();
    if (candidateSecret === expectedAdminSecret) {
      isMatch = true;
    }
  }

  // 3. Handle Failed Login
  if (!isMatch) {
    const updatedLockout = await recordFailedAttempt(identifier, req);
    if (updatedLockout.isLocked) {
      return res.status(429).json({
        error: `Security Lockout Triggered! ${MAX_ATTEMPTS} failed attempts reached. System locked for ${LOCKOUT_MINUTES} minutes.`,
        isLocked: true,
        lockoutRemainingSeconds: updatedLockout.lockoutRemainingSeconds,
        lockedUntil: updatedLockout.lockedUntil,
        remainingAttempts: 0,
      });
    }

    return res.status(401).json({
      error: `Invalid credentials. ${updatedLockout.remainingAttempts} attempt(s) remaining before security lockout.`,
      isLocked: false,
      remainingAttempts: updatedLockout.remainingAttempts,
      failedAttempts: updatedLockout.failedAttempts,
    });
  }

  // 4. Handle Successful Login
  await resetLockout(identifier, req);

  // Generate signed JWT
  const tokenPayload = {
    username: username || expectedAdminUser,
    role: 'admin',
    loginAt: new Date().toISOString(),
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: '24h',
  });

  return res.status(200).json({
    success: true,
    message: 'Admin authorization granted successfully.',
    token,
    admin: {
      username: tokenPayload.username,
      role: 'admin',
    },
    expiresIn: '24h',
  });
});

// 3. POST /api/auth/verify
// Verify active token
router.post('/verify', verifyAdmin, (req, res) => {
  res.status(200).json({
    valid: true,
    message: 'Admin session is active.',
    admin: req.admin,
  });
});

// 4. POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// 5. POST /api/auth/unlock
// Emergency / admin unlock route
router.post('/unlock', async (req, res) => {
  const { masterKey } = req.body;
  const identifier = getClientIdentifier(req);

  if (masterKey === (process.env.ADMIN_SECRET || 'myadminsecret123')) {
    await resetLockout(identifier, req);
    return res.status(200).json({
      success: true,
      message: 'Lockout successfully cleared.',
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS,
    });
  }

  return res.status(401).json({ error: 'Invalid master key for emergency unlock.' });
});

module.exports = router;
