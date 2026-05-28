const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to ensure MongoDB Atlas SRV records resolve correctly
// regardless of the system DNS configuration.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, // Force IPv4 to avoid SRV resolution issues
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
