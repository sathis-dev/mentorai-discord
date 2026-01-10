# 🧪 MentorAI Testing Checklist

## Pre-Testing Setup
- [ ] All dependencies installed
- [ ] `.env` file configured correctly
- [ ] Commands deployed to Discord
- [ ] Bot online and showing in server
- [ ] Database connection successful

## Bot Functionality Tests

### Basic Bot Operations
- [ ] Bot comes online successfully
- [ ] Bot shows correct status message
- [ ] Bot responds in test channel
- [ ] All slash commands are visible
- [ ] Bot handles unknown commands gracefully

### /learn Command Tests
- [ ] Shows subject picker when no topic provided
- [ ] Subject picker menu works
- [ ] Generates lesson for specific topic
- [ ] Lesson embed displays correctly
- [ ] Navigation buttons appear
- [ ] XP is awarded after lesson
- [ ] Progress is saved to database
- [ ] Works with different difficulty levels (beginner/intermediate/advanced)
- [ ] Handles special characters in topic names
- [ ] Error message for AI failures

### /quiz Command Tests
- [ ] Generates correct number of questions
- [ ] Quiz embed displays properly
- [ ] Answer buttons work
- [ ] Correct answers award XP
- [ ] Wrong answers show explanation
- [ ] Quiz tracks score correctly
- [ ] Final results display
- [ ] Quiz completion is recorded in database
- [ ] Multiple users can take quizzes simultaneously
- [ ] Handles invalid quiz IDs

### /progress Command Tests
- [ ] Shows correct level and XP
- [ ] Progress bar displays correctly
- [ ] Streak is calculated accurately
- [ ] Stats match database values
- [ ] Achievements display properly
- [ ] Works for new users (creates profile)
- [ ] Avatar loads correctly
- [ ] Percentage calculations are accurate

### /studyparty Command Tests
- [ ] Creates party successfully
- [ ] Party embed displays correctly
- [ ] Join button works
- [ ] Multiple users can join
- [ ] Start button works (host only)
- [ ] Cancel button works (host only)
- [ ] Non-hosts can't start/cancel
- [ ] Party times out after 10 minutes if not started
- [ ] Bonus XP is applied to participants
- [ ] Party ends automatically after duration

### /leaderboard Command Tests
- [ ] Shows top 10 users by default
- [ ] Custom limit works (1-25)
- [ ] Users are sorted by XP correctly
- [ ] Medals show for top 3
- [ ] Handles servers with no data
- [ ] Username fetching works
- [ ] Handles deleted users gracefully

### /help Command Tests
- [ ] Displays all available commands
- [ ] Formatting is clean and readable
- [ ] Examples are helpful
- [ ] Tips section is visible

## Database Tests

### User Model
- [ ] New users created on first interaction
- [ ] XP is saved correctly
- [ ] Level ups work properly
- [ ] Streak calculation is accurate
- [ ] Achievements are stored
- [ ] User stats update correctly
- [ ] Multiple users don't conflict

### Progress Model
- [ ] Lessons viewed are tracked
- [ ] Lessons completed are saved
- [ ] Quiz results are recorded
- [ ] Time spent is tracked
- [ ] Progress persists across sessions

### Achievement Model
- [ ] Default achievements are seeded
- [ ] Achievements unlock properly
- [ ] XP rewards are given
- [ ] No duplicate achievements
- [ ] Achievement requirements check correctly

## AI Generation Tests

### Lesson Generation
- [ ] Lessons are relevant to topic
- [ ] Content is appropriate for level
- [ ] Response time is acceptable (< 10s)
- [ ] Fallback to Claude works if OpenAI fails
- [ ] Handles rate limiting
- [ ] Special characters don't break generation

### Quiz Generation
- [ ] Questions are relevant
- [ ] Correct number of questions generated
- [ ] Options make sense
- [ ] Correct answer is marked properly
- [ ] Explanations are helpful
- [ ] JSON parsing works reliably

### Image Generation (if implemented)
- [ ] Images are relevant
- [ ] Quality is acceptable
- [ ] URLs are valid
- [ ] Handles DALL-E errors

## Error Handling Tests

### API Errors
- [ ] OpenAI API errors handled gracefully
- [ ] Database connection errors caught
- [ ] User-friendly error messages displayed
- [ ] Errors logged properly
- [ ] Bot doesn't crash on errors

### Input Validation
- [ ] Handles very long topic names
- [ ] Handles empty inputs
- [ ] Handles special characters
- [ ] Handles SQL/NoSQL injection attempts
- [ ] Handles rate limiting

### Edge Cases
- [ ] Works with new servers (no data)
- [ ] Works with deleted Discord users
- [ ] Handles rapid command spam
- [ ] Works during database downtime (gracefully)
- [ ] Handles timezone differences

## Performance Tests

### Response Time
- [ ] Commands respond within 5 seconds
- [ ] AI generation completes within 10 seconds
- [ ] Database queries are fast (< 1s)
- [ ] No noticeable lag with multiple users

### Memory Usage
- [ ] No memory leaks after extended use
- [ ] Memory usage stays reasonable
- [ ] Old quiz data is cleaned up
- [ ] Cached data doesn't accumulate

### Scalability
- [ ] Handles 10 simultaneous users
- [ ] Multiple servers work independently
- [ ] Database doesn't slow down with data
- [ ] Rate limiting prevents abuse

## Security Tests

### Data Protection
- [ ] API keys not exposed in logs
- [ ] User data is private
- [ ] No SQL/NoSQL injection possible
- [ ] Bot token is secured

### Permissions
- [ ] Bot has only required permissions
- [ ] Users can't access admin functions
- [ ] Study party hosts have exclusive controls

## Integration Tests

### Discord Integration
- [ ] Embeds display correctly on mobile
- [ ] Buttons work on all platforms
- [ ] Select menus function properly
- [ ] Emojis display correctly

### Third-Party Services
- [ ] OpenAI API calls work
- [ ] Anthropic fallback works
- [ ] MongoDB connection stable
- [ ] Railway/deployment platform works

## User Experience Tests

### Usability
- [ ] Commands are intuitive
- [ ] Help text is clear
- [ ] Error messages are helpful
- [ ] Progression feels rewarding
- [ ] Embeds are visually appealing

### Gamification
- [ ] XP rewards feel balanced
- [ ] Level progression is smooth
- [ ] Achievements are attainable
- [ ] Leaderboard is motivating
- [ ] Streaks encourage daily use

## Final Checks

### Documentation
- [ ] README is complete
- [ ] Setup guide is accurate
- [ ] Code comments are helpful
- [ ] Environment variables documented

### Deployment Ready
- [ ] All tests passing
- [ ] No console errors
- [ ] Logs are clean
- [ ] Performance is acceptable
- [ ] Ready for production

---

## Test Results

**Date Tested:** _____________

**Tested By:** _____________

**Pass Rate:** ____/____

**Critical Issues:** _____________

**Notes:** _____________

---

## Sign-off

- [ ] All critical tests passed
- [ ] Known issues documented
- [ ] Ready for deployment

**Approved By:** _____________

**Date:** _____________
