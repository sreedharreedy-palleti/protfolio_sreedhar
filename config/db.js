const mongoose = require('mongoose');
const dns = require('dns');

// On Windows and certain networks, Node's default DNS resolver fails to resolve
// MongoDB Atlas SRV records (querySrv ECONNREFUSED). Configuring Google/Cloudflare
// DNS ensures reliable resolution.
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.warn('DNS server configuration warning:', err.message);
}

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    // Do not crash the entire process so the Express server stays accessible
  }
};

module.exports = connectDB;