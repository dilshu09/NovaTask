import mongoose from 'mongoose';

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    cachedConnection = mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/novatask');
    const conn = await cachedConnection;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    cachedConnection = null;
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Server running in fallback mode with mock data store.');
    return null;
  }
};

export default connectDB;
