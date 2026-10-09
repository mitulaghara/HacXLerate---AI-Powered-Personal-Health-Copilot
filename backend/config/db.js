const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let currentUri = process.env.MONGODB_URI || '';

const connectDB = async (customUri = null) => {
  const uriToUse = customUri || process.env.MONGODB_URI;
  
  if (!uriToUse) {
    console.log('ℹ️  No MongoDB URI provided. Running with dynamic memory/fallback storage mode.');
    return { success: true, mode: 'memory', message: 'Running in live in-memory mode' };
  }

  // If already connected, reuse existing connection immediately
  if (mongoose.connection.readyState === 1) {
    return { success: true, mode: 'atlas', message: 'Already connected to MongoDB Atlas' };
  }

  if (!cached.promise) {
    const uriAfterHost = (uriToUse.split('.net/')[1] || '').split('?')[0];
    const hasDbName = uriAfterHost.length > 0;
    const opts = {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false, // Prevents 10s hang if connection issues occur
      ...((!hasDbName) ? { dbName: process.env.DB_NAME || 'gramin_arogya_db' } : {})
    };
    
    console.log(`⏳ Connecting to MongoDB Atlas: ${uriToUse.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')} (DB: ${opts.dbName || 'uri-defined'})`);
    cached.promise = mongoose.connect(uriToUse, opts).then((m) => {
      console.log('✅ Connected to MongoDB Atlas successfully!');
      currentUri = uriToUse;
      return m;
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return { success: true, mode: 'atlas', message: 'Connected to MongoDB Atlas' };
  } catch (error) {
    cached.promise = null;
    console.error('❌ MongoDB Atlas connection error:', error.message);
    return { success: false, mode: 'memory', error: error.message };
  }
};

const getDBStatus = () => {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    mode: mongoose.connection.readyState === 1 ? 'atlas' : 'memory',
    uriMasked: currentUri ? currentUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not Configured (Memory Mode)',
    database: mongoose.connection.name || 'gramin_arogya_db'
  };
};

module.exports = { connectDB, getDBStatus };

