import mongoose from 'mongoose';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose.connection;
  }
  
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/mentorai';
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
  });

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
    isConnected = true;
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.log('⚠️ Bot will run without database functionality');
    return null;
  }
}

export function isDatabaseConnected() {
  return isConnected;
}
