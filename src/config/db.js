const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('MongoDB connected...');
    return client;
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

