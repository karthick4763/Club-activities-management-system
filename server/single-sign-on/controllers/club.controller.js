const { decryptSSOToken } = require('vaave-sso-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../../config/db');

/**
 * Handle SSO login from NEC Alumni Portal (Vaave SSO SDK)
 */
async function handleClubSSO(req, res) {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  let email;
  try {
    const decoded = decodeURIComponent(token);

    // 1. Try JWE Decryption via Vaave SSO SDK if SEED is present
    if (process.env.SEED) {
      try {
        const resData = await decryptSSOToken(decoded, process.env.SEED);
        if (resData && resData.success && resData.details) {
          email = resData.details.email || resData.details.email_id || resData.details.username;
        }
      } catch (sdkErr) {
        // SDK threw, proceed to fallback
      }
    }

    // 2. Fallback for testing/direct tokens: check if token is raw or base64 email
    if (!email) {
      if (decoded.includes('@')) {
        email = decoded;
      } else {
        try {
          const b64Decoded = Buffer.from(decoded, 'base64').toString('utf8');
          if (b64Decoded.includes('@')) {
            email = b64Decoded;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Invalid Token: Email details not found in token.' });
    }
  } catch (err) {
    console.error('SSO token decryption error:', err);
    return res.status(400).json({ error: 'Invalid Token', details: err.message });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user already exists
    let [users] = await query(
      `SELECT u.id, u.name, u.email, u.role, u.club_id, c.club_name 
       FROM users u 
       LEFT JOIN clubs c ON u.club_id = c.id 
       WHERE u.email = ?`,
      [normalizedEmail]
    );

    let user = users && users.length > 0 ? users[0] : null;

    // 2. Auto-provision user if not existing
    if (!user) {
      const [members] = await query(
        `SELECT id, name, email, club_id, member_type, status FROM members WHERE email = ?`,
        [normalizedEmail]
      );

      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      let userName = normalizedEmail.split('@')[0];
      let clubId = null;

      if (members && members.length > 0) {
        userName = members[0].name || userName;
        clubId = members[0].club_id || null;
      } else {
        // Auto-register in members table as approved alumni member
        await query(
          `INSERT INTO members (club_id, member_type, name, email, status, role) 
           VALUES (?, 'ALUMNI', ?, ?, 'APPROVED', 'MEMBER')`,
          [null, userName, normalizedEmail]
        );
      }

      let role = 'MEMBER';
      if (normalizedEmail === 'admin@club.edu' || normalizedEmail === 'vsnithyasaminathan143@gmail.com') {
        role = 'ADMIN';
      }

      const [newRes] = await query(
        `INSERT INTO users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)`,
        [userName, normalizedEmail, randomPassword, role, clubId]
      );

      user = {
        id: newRes.insertId,
        name: userName,
        email: normalizedEmail,
        role: role,
        club_id: clubId,
        club_name: null
      };
    }

    // 3. Issue JWT Session Token
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        club_id: user.club_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 4. Base64 encode email as specified by Alumni portal requirements
    const encodedEmail = Buffer.from(normalizedEmail).toString('base64');
    const frontendUrl = (process.env.FRONTEND_URL || 'https://club-management-system-one.vercel.app').replace(/\/+$/, '');

    // 5. Redirect to frontend with encoded email and sso_token
    return res.redirect(
      302,
      `${frontendUrl}/login?email=${encodeURIComponent(encodedEmail)}&sso_token=${encodeURIComponent(jwtToken)}`
    );
  } catch (err) {
    console.error('Error in handleClubSSO:', err);
    return res.status(500).json({ error: 'Server error during SSO redirection', details: err.message });
  }
}

/**
 * Handle user-by-email lookup endpoint
 */
async function handleUserByEmail(req, res) {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email query param is required' });
  }

  let decryptedEmail;
  if (process.env.SEED) {
    try {
      const decodedEmail = decodeURIComponent(email);
      const resData = await decryptSSOToken(decodedEmail, process.env.SEED);
      if (resData && resData.success && resData.details) {
        decryptedEmail = resData.details.email || resData.details.email_id || resData.details.username;
      } else {
        decryptedEmail = email;
      }
    } catch (err) {
      decryptedEmail = email;
    }
  } else {
    decryptedEmail = email;
  }

  let lookupEmail = decryptedEmail;
  if (typeof lookupEmail !== 'string') {
    lookupEmail = lookupEmail?.email || email;
  }
  lookupEmail = lookupEmail.trim().toLowerCase();

  // If still base64 encoded, decode it
  if (!lookupEmail.includes('@')) {
    try {
      const b64 = Buffer.from(lookupEmail, 'base64').toString('utf8');
      if (b64.includes('@')) lookupEmail = b64.trim().toLowerCase();
    } catch (e) {
      // ignore
    }
  }

  try {
    const [users] = await query(
      `SELECT u.id, u.name, u.email, u.role, u.club_id, c.club_name 
       FROM users u 
       LEFT JOIN clubs c ON u.club_id = c.id 
       WHERE u.email = ?`,
      [lookupEmail]
    );

    if (!users || users.length === 0) {
      const [members] = await query('SELECT * FROM members WHERE email = ?', [lookupEmail]);
      if (!members || members.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(members[0]);
    }

    return res.json(users[0]);
  } catch (err) {
    console.error('Database Error in handleUserByEmail:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}

module.exports = {
  handleClubSSO,
  handleUserByEmail
};
