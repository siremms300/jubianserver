import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/connectDB.js';
import userRouter from './route/userRoute.js';
import authRouter from './route/authRoute.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.FRONTEND_URL) {
  throw new Error("Please provide FRONTEND_URL in the .env file");
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined'));
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Routes
app.use('/api/users', userRouter) 
app.use('/api/auth', authRouter) 

app.get("/", (req, res) => {
  res.json({
    message: `Server is running on port ${process.env.PORT || 8080}`
  });
});

// Server startup
const PORT = process.env.PORT || 8080;

async function startServer() {
  try { 
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
    await connectDB();
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
