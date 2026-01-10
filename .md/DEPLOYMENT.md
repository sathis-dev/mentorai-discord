# 🚀 MentorAI Deployment Guide

## Quick Deploy to Railway (Recommended)

Railway is the easiest way to deploy MentorAI. Follow these steps:

### Prerequisites
- GitHub account with this repo pushed
- Railway account (free at [railway.app](https://railway.app))
- MongoDB Atlas database (free tier) or use Railway's MongoDB plugin
- Discord Bot Token, Client ID
- OpenAI API Key

---

## 🚂 Railway Deployment (Step-by-Step)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for auto-deploy)

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub
4. Select your MentorAI repository

### Step 3: Add MongoDB Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"MongoDB"**
3. Railway will create a MongoDB instance
4. Click on the MongoDB service → **"Variables"** tab
5. Copy the `MONGO_URL` value

**OR use MongoDB Atlas (recommended for free tier):**
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Get your connection string
4. Use that as `DATABASE_URL`

### Step 4: Configure Environment Variables
Click on your deployment service → **"Variables"** tab → Add these:

| Variable | Value | Required |
|----------|-------|----------|
| `DISCORD_TOKEN` | Your Discord bot token | ✅ |
| `DISCORD_CLIENT_ID` | Your Discord app client ID | ✅ |
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ |
| `DATABASE_URL` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Random 32+ char string | ✅ |
| `ADMIN_USERNAME` | Admin panel username | ✅ |
| `ADMIN_PASSWORD` | Admin panel password | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `ANTHROPIC_API_KEY` | Claude API key (fallback) | Optional |

### Step 5: Deploy
1. Railway will auto-deploy when you push to GitHub
2. Or click **"Deploy"** button manually
3. Wait for build to complete (2-3 minutes)

### Step 6: Verify Deployment
1. Check **"Deployments"** tab for build logs
2. Your bot should show as online in Discord
3. Access admin panel at: `https://your-app.railway.app`

### Step 7: Deploy Discord Commands
After first deploy, run this locally once:
```bash
npm run deploy-commands
```

---

## 🔧 Railway Configuration Files

Your project includes these Railway-optimized files:

**railway.json** - Railway-specific settings:
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "healthcheckPath": "/"
  }
}
```

**Procfile** - Process type:
```
web: npm start
```

---

## 🎛️ Admin Panel Access

After deployment:
1. Go to `https://your-app.railway.app`
2. Login with `ADMIN_USERNAME` and `ADMIN_PASSWORD` you set
3. Manage users, view analytics, send broadcasts

---

## 📊 Monitoring

- **Railway Dashboard**: View logs, metrics, and deployments
- **Discord**: Bot should appear online
- **Admin Panel**: Real-time user stats

---

## 🔄 Updating

Railway auto-deploys when you push to GitHub:
```bash
git add .
git commit -m "Update"
git push origin main
```

---

## 💰 Railway Pricing

- **Free Tier**: $5 free credit/month (enough for small bots)
- **Developer**: $5/month for more resources
- **Pro**: For larger applications

---

## 🆘 Troubleshooting

### Bot Not Coming Online
1. Check Railway logs for errors
2. Verify `DISCORD_TOKEN` is correct
3. Ensure MongoDB is connected

### Database Connection Failed
1. Check `DATABASE_URL` format
2. Whitelist Railway IPs in MongoDB Atlas (or use 0.0.0.0/0)

### Admin Panel Not Loading
1. Ensure `PORT` is not manually set (Railway sets it)
2. Check `JWT_SECRET` is configured

### Commands Not Working
Run locally: `npm run deploy-commands`

---

## Deployment Options

1. **Railway** - Easiest, recommended for beginners
2. **DigitalOcean** - More control, cost-effective
3. **Heroku** - Simple, free tier available
4. **AWS/GCP** - Enterprise-grade, more complex

---

## Option 2: DigitalOcean

### Using Docker

1. **Build Docker Image**
```bash
docker build -t mentorai .
```

2. **Run Container**
```bash
docker run -d \
  --name mentorai \
  --env-file .env \
  --restart unless-stopped \
  mentorai
```

3. **Or use Docker Compose**
```bash
docker-compose up -d
```

### Using Droplet

1. **Create Droplet** (Ubuntu 22.04)

2. **SSH into Droplet**
```bash
ssh root@your_droplet_ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Clone Repository**
```bash
git clone <your-repo-url>
cd mentorai-discord
```

5. **Install Dependencies**
```bash
npm install --production
```

6. **Create .env File**
```bash
nano .env
# Paste your environment variables
```

7. **Install PM2 (Process Manager)**
```bash
npm install -g pm2
```

8. **Start Bot**
```bash
pm2 start src/index.js --name mentorai
pm2 save
pm2 startup
```

9. **Monitor**
```bash
pm2 status
pm2 logs mentorai
```

---

## Option 3: Heroku

### Steps

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login**
```bash
heroku login
```

3. **Create App**
```bash
heroku create mentorai-bot
```

4. **Add MongoDB**
```bash
heroku addons:create mongolab:sandbox
```

5. **Set Environment Variables**
```bash
heroku config:set DISCORD_TOKEN=your_token
heroku config:set DISCORD_CLIENT_ID=your_client_id
heroku config:set OPENAI_API_KEY=your_openai_key
heroku config:set NODE_ENV=production
```

6. **Deploy**
```bash
git push heroku main
```

7. **Scale Worker**
```bash
heroku ps:scale worker=1
```

8. **View Logs**
```bash
heroku logs --tail
```

---

## Post-Deployment Checklist

### Verify Deployment
- [ ] Bot shows as online in Discord
- [ ] Commands are registered and working
- [ ] Database connection is successful
- [ ] Logs show no critical errors

### Monitor Performance
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure error alerting
- [ ] Monitor memory usage
- [ ] Track API usage (OpenAI)

### Security
- [ ] All API keys are secure
- [ ] .env is not in repository
- [ ] Bot token is regenerated if exposed
- [ ] Database has authentication

### Scaling
- [ ] Monitor response times
- [ ] Check database performance
- [ ] Review API rate limits
- [ ] Plan for traffic growth

---

## Monitoring & Maintenance

### Essential Monitoring Tools

1. **UptimeRobot** (https://uptimerobot.com)
   - Monitor bot status
   - Get alerts when bot goes down

2. **Logs**
   - Check `logs/error.log` regularly
   - Set up log aggregation (optional)

3. **Discord Developer Portal**
   - Monitor command usage
   - Check for errors

### Regular Maintenance

**Daily:**
- [ ] Check bot is online
- [ ] Review error logs
- [ ] Monitor OpenAI usage/costs

**Weekly:**
- [ ] Review user feedback
- [ ] Check database size
- [ ] Update dependencies (if needed)

**Monthly:**
- [ ] Backup database
- [ ] Review and optimize code
- [ ] Check for security updates
- [ ] Analyze usage patterns

---

## Backup & Recovery

### Database Backups

**MongoDB Atlas (Automatic)**
- Enable automated backups in Atlas dashboard
- Daily snapshots recommended

**Manual Backup**
```bash
mongodump --uri="your_connection_string" --out=./backup
```

**Restore**
```bash
mongorestore --uri="your_connection_string" ./backup
```

### Code Backups
- Use GitHub for version control
- Tag releases for rollback capability
- Keep .env.example updated

---

## Scaling Guide

### When to Scale

**Indicators:**
- Response time > 5 seconds consistently
- Memory usage > 80%
- CPU usage consistently high
- Database queries slow

### How to Scale

**Vertical Scaling (More Resources)**
- Upgrade Railway plan
- Increase Droplet size
- Add more memory/CPU

**Horizontal Scaling (Multiple Instances)**
- Use Redis for shared state
- Load balance across instances
- Shard database if needed

**Optimization First**
- Cache frequent queries
- Optimize database indexes
- Reduce API calls
- Clean up old data

---

## Troubleshooting Deployment

### Bot Won't Start
```bash
# Check logs
railway logs
# or
pm2 logs

# Common fixes:
# 1. Verify all env variables set
# 2. Check database connection
# 3. Ensure commands deployed
```

### Commands Not Working
```bash
# Redeploy commands
npm run deploy-commands

# Check bot permissions
# Verify intents enabled
```

### Database Connection Issues
```bash
# Test connection string
# Check IP whitelist (Atlas)
# Verify username/password
# Check network settings
```

### High Costs
```bash
# Monitor OpenAI usage
# Implement caching
# Set usage limits
# Optimize prompt lengths
```

---

## Cost Estimation

### Monthly Costs (Approximate)

**Railway:**
- Free tier: $5 credit/month
- Hobby: $5-20/month
- Pro: $20-50/month

**DigitalOcean:**
- Basic Droplet: $6/month
- MongoDB managed: $15/month

**OpenAI API:**
- Light usage: $5-20/month
- Moderate: $50-100/month
- Heavy: $200+/month

**Total Estimated:** $20-100/month depending on usage

---

## Support & Resources

- Railway Docs: https://docs.railway.app/
- DigitalOcean Tutorials: https://www.digitalocean.com/community/tutorials
- Discord.js Guide: https://discordjs.guide/
- OpenAI API Docs: https://platform.openai.com/docs

---

**Remember:** Always test in development before deploying to production!
