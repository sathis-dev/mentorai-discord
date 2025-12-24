import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI);
    logger.info('📦 MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

export default mongoose;
