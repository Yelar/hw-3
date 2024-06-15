import express from 'express';
import { schedule } from 'node-cron';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware to parse HTTP body in order to read HTTP data
app.use(express.json());

// Define a simple route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Codeforces Blog Tracker Bot is running!');
});

// Start the cron job to fetch data periodically
// Include your fetchData function setup here, as previously defined

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
