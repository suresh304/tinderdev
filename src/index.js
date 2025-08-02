// index.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');

// PostgreSQL config
const { Pool, Client } = require('pg');

const { initialiseSocketConnection } = require('./utils/socket');

// Routers & Middleware
const { authRouter } = require('./Routers/Auth');
const { profileRouter } = require('./Routers/Profile');
const { requestRouter } = require('./Routers/Requests');
const { userRouter } = require('./Routers/User');
const { chatRouter } = require('./Routers/chat');
const uploadRouter = require('./Routers/upload');
const { PostRouter } = require('./Routers/Posts');
const CommentRouter = require('./Routers/Comment');

const app = express();
const PORT = 3001;

// ✅ PostgreSQL Pool Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// ✅ Separate client for LISTEN/NOTIFY
const pgListener = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Attach db to app
app.locals.db = pool;

const allowedOrigins = ['http://172.31.45.138', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || true) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', userRouter);
app.use('/', chatRouter);
app.use('/', PostRouter);
app.use('/', uploadRouter);
app.use('/', CommentRouter);

// Create HTTP server
const server = http.createServer(app);

// Start DB + Socket
pool.connect()
  .then(client => {
    client.release();
    console.log('✅ PostgreSQL connected');

    server.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Server running on port', PORT);
    });

    // ✅ Start socket + DB notification listener
    initialiseSocketConnection(server, pool, pgListener);
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err.message);
  });
