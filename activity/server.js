import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Discord OAuth2 token exchange
app.post('/api/token', async (req, res) => {
  try {
    const { code } = req.body;

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Get user progress
app.get('/api/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Connect to main bot's database
    const response = await fetch(`http://localhost:3000/api/progress/${userId}`);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Generate quiz
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { topic, numQuestions, userId } = req.body;
    
    // Connect to main bot's quiz service
    const response = await fetch('http://localhost:3000/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, numQuestions, userId })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Discord Activity API server running on port ${PORT}`);
});
