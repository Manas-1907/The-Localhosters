import mongoose from 'mongoose';
import { config } from './config.js';
import { app } from './app.js';
import { startScheduler } from './utils/scheduler.js';

mongoose.set('bufferCommands', false);

try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected successfully');
  startScheduler();
} catch (err) {
  console.warn('⚠️ MongoDB connection failed:', err.message);
  console.warn('⚠️ Server will run in standalone mode with API endpoints active.');
}

app.listen(config.port, () => console.log(`MAMA API listening on port ${config.port}`));

