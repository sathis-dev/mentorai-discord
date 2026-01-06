// Simple server to preview the landing page
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3333;

// Mock API stats endpoint (must be before static files)
app.get('/api/stats', (req, res) => {
  res.json({
    users: { total: 1247 },
    metrics: { totalQuizzes: 8934 }
  });
});

// Serve landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/web/public/landing.html'));
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'src/web/public')));

app.listen(PORT, () => {
  console.log(`\n🎓 MentorAI Landing Page Preview`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
