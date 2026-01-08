import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  discordId: { type: String, required: true, index: true },
  guildId: { type: String, index: true },
  topic: { type: String, default: 'general' },
  messages: [messageSchema],
  summary: { type: String },
  learningGoals: [String],
  identifiedWeaknesses: [String],
  lastActive: { type: Date, default: Date.now },
  messageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Add message and manage conversation length
conversationSchema.methods.addMessage = async function(role, content) {
  this.messages.push({ role, content });
  this.messageCount++;
  this.lastActive = new Date();
  
  // Keep only last 50 messages
  if (this.messages.length > 50) {
    this.messages = this.messages.slice(-30);
    this.needsSummaryUpdate = true;
  }
  
  await this.save();
  return this;
};

// Get recent messages for context
conversationSchema.methods.getContext = function(limit = 20) {
  const messages = [];
  
  if (this.summary) {
    messages.push({
      role: 'system',
      content: `Previous conversation summary: ${this.summary}`
    });
  }
  
  const recent = this.messages.slice(-limit);
  for (const msg of recent) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }
  
  return messages;
};

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
