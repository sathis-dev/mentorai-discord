import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDatabase } from '../database/connection.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);

// Socket.IO for real-time updates
const io = new SocketIO(server, {
  cors: { origin: '*', credentials: true }
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// DISABLE CACHING for development
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Make io accessible
app.set('io', io);

// Static files with no cache - but NOT index.html (to avoid conflict with website root)
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  index: false, // Don't serve index.html automatically
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

// Health check endpoint (no auth required) - for Railway/Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no auth required)
app.use('/api/auth', authRoutes);

// PUBLIC API routes (no auth required) - for website
app.use('/api/public', apiRoutes);
app.use('/api/user', apiRoutes);
app.use('/api/health', apiRoutes);

// Protected API routes (require auth)
app.use('/api', authMiddleware, apiRoutes);

// ====== WEBSITE ROUTES (Main public website) ======

// Website home page - serve main website at root (MUST be before static middleware)
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', '..', 'website', 'index.html'));
});

// Dashboard page from website folder
app.get('/dashboard', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', '..', 'website', 'dashboard.html'));
});

// Serve the main website assets (from /website folder)
app.use('/css', express.static(path.join(__dirname, '..', '..', 'website', 'css'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

app.use('/js', express.static(path.join(__dirname, '..', '..', 'website', 'js'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

app.use('/assets', express.static(path.join(__dirname, '..', '..', 'website', 'assets'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

// Also serve from /site for backwards compatibility
app.use('/site', express.static(path.join(__dirname, '..', '..', 'website'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

// ====== ADMIN PANEL ROUTES ======
app.get('/admin', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('📡 Admin connected via Socket.IO');
  
  // Send initial stats on connect
  (async () => {
    try {
      const { getAdminStats } = await import('./routes/api.js');
      const stats = await getAdminStats();
      socket.emit('statsUpdate', stats);
    } catch (e) {}
  })();
  
  socket.on('disconnect', () => console.log('📡 Admin disconnected'));
});

// Subscribe to gamification events for real-time sync
(async () => {
  try {
    const { syncEvents } = await import('../services/gamificationService.js');
    syncEvents.on('userUpdate', (data) => {
      console.log(`🔄 Broadcasting user update: ${data.action} for ${data.user?.username}`);
      io.emit('userUpdate', data);
      
      // Also emit newUser event for new user registrations
      if (data.action === 'create') {
        console.log(`🆕 New user registered: ${data.user?.username}`);
        io.emit('newUser', data.user);
      }
    });
  } catch (e) {
    console.error('Failed to setup sync events:', e);
  }
})();

// Subscribe to broadcast events for real-time progress
(async () => {
  try {
    const { broadcastEvents } = await import('../services/broadcastService.js');
    
    broadcastEvents.on('progress', (data) => {
      console.log(`📡 Broadcast progress: ${data.sent}/${data.total}`);
      io.emit('broadcastProgress', data);
    });
    
    broadcastEvents.on('complete', (data) => {
      console.log(`✅ Broadcast complete: ${data.stats.sent}/${data.stats.total}`);
      io.emit('broadcastComplete', data);
    });
    
    broadcastEvents.on('error', (data) => {
      console.log(`❌ Broadcast error: ${data.error}`);
      io.emit('broadcastError', data);
    });
    
    broadcastEvents.on('scheduled', (data) => {
      console.log(`📅 Broadcast scheduled: ${data.id}`);
      io.emit('broadcastScheduled', data);
    });
    
    broadcastEvents.on('cancelled', (data) => {
      console.log(`🚫 Broadcast cancelled: ${data.id}`);
      io.emit('broadcastCancelled', data);
    });
    
    console.log('📡 Broadcast service events connected');
  } catch (e) {
    console.error('Failed to setup broadcast events:', e);
  }
})();

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Broadcast stats every 5 seconds for real-time feel
setInterval(async () => {
  try {
    const { getAdminStats } = await import('./routes/api.js');
    const stats = await getAdminStats();
    io.emit('statsUpdate', stats);
  } catch (e) {}
}, 5000);

// Start
const PORT = process.env.PORT || process.env.ADMIN_PORT || 3000;

// Export function to start admin panel (called from index.js to share Discord client)
export async function startAdminPanel() {
  return new Promise((resolve, reject) => {
    try {
      server.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('🎛️  MentorAI Admin Panel v2.0');
        console.log('═══════════════════════════════════════════');
        console.log(`🌐 Port: ${PORT}`);
        console.log('👤 Username: admin');
        console.log('🔑 Password: (from ADMIN_PASSWORD env)');
        console.log('═══════════════════════════════════════════');
        console.log('');
        resolve();
      });
    } catch (error) {
      console.error('Failed to start admin panel:', error);
      reject(error);
    }
  });
}

// For standalone mode (npm run admin), auto-start if this is the main module
const isMainModule = process.argv[1]?.includes('server.js');
if (isMainModule) {
  (async () => {
    await connectDatabase();
    await startAdminPanel();
    console.log('📁 Dashboard file:', path.join(__dirname, 'public', 'dashboard.html'));
    console.log('');
  })();
}

export { io };
