require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const connectDB = require('./configs/config');
const { initialiseSocketConnection } = require('./utils/socket');

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

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://57.159.24.4',
    // origin:"http://localhost:5173",
    credentials: true
}));

// ✅ Serve static files from 'uploads' folder
app.get('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', userRouter);
app.use('/', chatRouter);
app.use('/upload', uploadRouter);

// Sample Test Route
app.get('/test', (req, res) => {
    res.send('<h1>Hello, this is a small HTML response from Express!</h1>');
});

// Start server
const server = http.createServer(app);
initialiseSocketConnection(server);

connectDB()
    .then(() => {
        console.log("DB connected successfully",process.env.NEWS_API_KEY);
        server.listen(PORT, '0.0.0.0', () => {
            console.log("Server is listening on port", PORT);
        });
    })
    .catch((err) => console.error("DB connection failed:", err));
