# 🚀 MentorAI Deployment Guide

## Deployment Options

1. **Railway** - Easiest, recommended for beginners
2. **DigitalOcean** - More control, cost-effective
3. **Heroku** - Simple, free tier available
4. **AWS/GCP** - Enterprise-grade, more complex

---

## Option 1: Railway (Recommended)

### Prerequisites
- GitHub account
- Railway account (free)
- Project pushed to GitHub

### Steps

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
railway init
```

4. **Link to GitHub Repo**
```bash
railway link
```

5. **Add Environment Variables**
```bash
railway variables set DISCORD_TOKEN=your_token
railway variables set DISCORD_CLIENT_ID=your_client_id
railway variables set OPENAI_API_KEY=your_openai_key
railway variables set NODE_ENV=production
```

6. **Add MongoDB Plugin**
```bash
railway add
# Select MongoDB
# Copy connection string
railway variables set DATABASE_URL=mongodb_connection_string
```

7. **Deploy**
```bash
railway up
```

8. **View Logs**
```bash
railway logs
```

### Railway Dashboard
- Monitor usage: https://railway.app/dashboard
- View logs in real-time
- Manage environment variables
- Scale resources as needed

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
