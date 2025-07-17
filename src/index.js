require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const { initialiseSocketConnection } = require('./utils/socket');

// PostgreSQL config
const { Pool } = require('pg');

// Routers & Middleware
const { userAuth } = require('./middlewares/auth');
const { authRouter } = require('./Routers/Auth');
const { profileRouter } = require('./Routers/Profile');
const { requestRouter } = require('./Routers/Requests');
const { userRouter } = require('./Routers/User');
const { chatRouter } = require('./Routers/chat');
const uploadRouter = require('./Routers/upload');

const app = express();
const PORT = 3001;

// ✅ PostgreSQL Pool Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // or { rejectUnauthorized: false } if using SSL (like on Railway or Heroku)
});

// Make the pool accessible via `req.app.locals`
app.locals.db = pool;

const allowedOrigins = [
  'http://172.31.45.138',
  'http://localhost:5173',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || true) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.options('*', cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', userRouter);
app.use('/', chatRouter);
app.use('/', uploadRouter);

// Start server
const server = http.createServer(app);
initialiseSocketConnection(server);

// Test the DB connection before starting the server
pool.connect()
  .then(client => {
    client.release();
    console.log('✅ PostgreSQL connected successfully');
    server.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Server is listening on port', PORT);
    });
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
  });
