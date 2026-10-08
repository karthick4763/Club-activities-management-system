const http = require('http');
const path = require('path');
const fs = require('fs');
const querystring = require('querystring');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// Ensure a secure JWT secret is always present
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super_secret_club_jwt_key_2026_xyz') {
  process.env.JWT_SECRET = process.env.JWT_SECRET_FALLBACK || crypto.randomBytes(32).toString('hex');
}

// Process-level crash handlers to prevent outages from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL UNHANDLED REJECTION]', reason);
});

const { getDb } = require('./config/db');
const initDb = require('./scripts/initDb');
const { createRouter } = require('./core/router');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const memberRoutes = require('./routes/memberRoutes');
const actionPlanRoutes = require('./routes/actionPlanRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const PORT = process.env.PORT || 5000;
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Master Router
const appRouter = createRouter();

// Health Check
appRouter.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date(), engine: 'Native Node.js HTTP Engine' });
});

// Mount Sub-routers
appRouter.use('/api/auth', authRoutes);
appRouter.use('/api/clubs', clubRoutes);
appRouter.use('/api/members', memberRoutes);
appRouter.use('/api/action-plans', actionPlanRoutes);
appRouter.use('/api/events', eventRoutes);
appRouter.use('/api/reports', reportRoutes);
appRouter.use('/api/dashboard', dashboardRoutes);

// MIME type dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Enhance HTTP Response with helper methods
function enhanceResponse(res) {
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };

  res.json = function (data) {
    if (this.writableEnded) return;
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.end(JSON.stringify(data));
  };

  res.download = function (filePath, fileName, cb) {
    try {
      if (!fs.existsSync(filePath)) {
        this.status(404).json({ success: false, message: 'File not found on server.' });
        if (cb) cb(new Error('File not found'));
        return;
      }

      const stat = fs.statSync(filePath);
      const downloadName = fileName || path.basename(filePath);
      this.statusCode = 200;
      this.setHeader('Content-Type', 'application/octet-stream');
      this.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      this.setHeader('Content-Length', stat.size);

      const stream = fs.createReadStream(filePath);
      stream.pipe(this);
      stream.on('error', (err) => {
        if (!this.headersSent) {
          this.status(500).json({ success: false, message: err.message });
        }
        if (cb) cb(err);
      });
      stream.on('end', () => {
        if (cb) cb();
      });
    } catch (err) {
      if (!this.headersSent) {
        this.status(500).json({ success: false, message: err.message });
      }
      if (cb) cb(err);
    }
  };

  res.sendFile = function (filePath) {
    if (!fs.existsSync(filePath)) {
      this.statusCode = 404;
      this.end('File Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);

    this.statusCode = 200;
    this.setHeader('Content-Type', contentType);
    this.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(filePath);
    stream.pipe(this);
    stream.on('error', () => {
      if (!this.headersSent) {
        this.statusCode = 500;
        this.end('Internal Server Error');
      }
    });
  };
}

// Request Handler (Pure Native Node.js)
async function handleRequest(req, res) {
  enhanceResponse(res);

  // 1. Security & CORS Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 2. Parse URL & Query Params safely (prevent crashes from malformed host or paths)
  let parsedUrl;
  try {
    const rawHost = (req.headers.host || 'localhost:5000').trim().replace(/\s+/g, '');
    parsedUrl = new URL(req.url, `http://${rawHost}`);
  } catch (urlErr) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ success: false, message: 'Bad Request: Malformed URL.' }));
    return;
  }

  req.pathname = parsedUrl.pathname;
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  req.body = {};
  req.file = null;

  // 3. Static Uploads File Serving (Protected against Path Traversal & Unauthorized Access)
  if (req.pathname.startsWith('/uploads/')) {
    // Authenticate request: Bearer token or ?token= query parameter
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Access denied. Authentication token required to access files.' });
      return;
    }

    try {
      const jwt = require('jsonwebtoken');
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenErr) {
      res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
      return;
    }

    const relativeFilePath = req.pathname.replace('/uploads/', '');
    const resolvedUploadsDir = path.resolve(uploadsDir);
    const fullUploadPath = path.resolve(uploadsDir, relativeFilePath);

    // Prevent path traversal outside uploads directory
    if (!fullUploadPath.startsWith(resolvedUploadsDir) || !fs.existsSync(fullUploadPath) || !fs.statSync(fullUploadPath).isFile()) {
      res.status(404).json({ success: false, message: 'Upload file not found.' });
      return;
    }

    // Never execute script files; force safe download with nosniff
    const ext = path.extname(fullUploadPath).toLowerCase();
    if (['.html', '.htm', '.svg', '.js'].includes(ext)) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    res.setHeader('Content-Disposition', 'attachment');
    res.sendFile(fullUploadPath);
    return;
  }

  // 4. Parse Request Body (JSON, Form-Urlencoded, Multipart)
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  const chunks = [];
  let totalBytes = 0;
  const MAX_BODY_SIZE = 15 * 1024 * 1024; // 15MB limit to prevent DoS memory exhaustion

  req.on('data', (chunk) => {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_SIZE) {
      res.status(413).json({ success: false, message: 'Payload too large. Maximum body size is 15MB.' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', async () => {
    const rawBuffer = Buffer.concat(chunks);
    req.rawBodyBuffer = rawBuffer;

    if (rawBuffer.length > 0) {
      if (contentType.includes('application/json')) {
        try {
          req.body = JSON.parse(rawBuffer.toString('utf8'));
        } catch (e) {
          res.status(400).json({ success: false, message: 'Malformed JSON body.' });
          return;
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        req.body = querystring.parse(rawBuffer.toString('utf8'));
      } else if (contentType.includes('multipart/form-data')) {
        // Defer actual file extraction to uploadMiddleware on authorized routes
        // to prevent unauthenticated disk writes and duplicate parsing
        req.isMultipart = true;
      }
    }

    // 5. Match API Routes
    const matched = appRouter.match(req.method, req.pathname);
    if (matched) {
      req.params = matched.params;
      const pipeline = [...matched.route.middlewares, matched.route.handler];
      let idx = 0;

      const next = (err) => {
        if (err) {
          console.error('[Route Handler Error]', err);
          if (!res.headersSent) {
            res.status(err.status || 500).json({
              success: false,
              message: err.message || 'Internal server error.'
            });
          }
          return;
        }

        const fn = pipeline[idx++];
        if (fn) {
          try {
            const result = fn(req, res, next);
            if (result && typeof result.catch === 'function') {
              result.catch(next);
            }
          } catch (handlerErr) {
            next(handlerErr);
          }
        }
      };

      next();
      return;
    }

    // 6. Serve Frontend Static Build & SPA Routing Fallback
    if (fs.existsSync(clientDistPath)) {
      const requestedFile = path.join(clientDistPath, req.pathname === '/' ? 'index.html' : req.pathname);
      if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
        res.sendFile(requestedFile);
        return;
      }

      // If client-side route (not /api/...), serve index.html for React Router
      if (!req.pathname.startsWith('/api/')) {
        const indexPath = path.join(clientDistPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
          return;
        }
      }
    }

    // 7. Route Not Found
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.pathname} not found.` });
  });

  req.on('error', (err) => {
    console.error('[Request Error]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Request stream error.' });
    }
  });
}

// Create native Node.js HTTP server
const server = http.createServer(handleRequest);

// Start Server
async function startServer() {
  try {
    await initDb();

    // Auto-seed if database is empty
    const { query } = require('./config/db');
    const [users] = await query('SELECT COUNT(*) AS count FROM users');
    if (users[0]?.count === 0) {
      console.log('Database empty. Running initial seeder...');
      const seedDb = require('./scripts/seedDb');
      await seedDb();
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log('========================================================');
      console.log(`🚀 Pure Native Node.js Server running on http://localhost:${PORT}`);
      console.log(`📡 API Endpoints available at http://localhost:${PORT}/api`);
      console.log('⚡ Engine: 100% Native Node.js (Zero Express Dependency)');
      console.log('========================================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = server;
