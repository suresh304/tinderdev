require('dotenv').config()
const express = require('express')
const connectDB = require('./configs/config')
const User = require('./models/user')
const app = express()
const {userAuth} = require('./middlewares/auth')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const { authRouter } = require('./Routers/Auth')
const { profileRouter } = require('./Routers/Profile')
const { requestRouter } = require('./Routers/Requests')
const { userRouter } = require('./Routers/User')
const {chatRouter} = require('./Routers/chat')
const path = require('path');

const cors = require('cors')
const { initialiseSocketConnection } = require('./utils/socket')
const PORT = 3001
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/build')));

// For any unknown routes, serve React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});


app.get('/test', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Deployment Test</title>
        <style>
          body {
            background: #f2f2f2;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
  
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            padding: 32px;
            text-align: center;
            max-width: 400px;
            transition: 0.3s ease-in-out;
          }
  
          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 20px rgba(0,0,0,0.2);
          }
  
          .title {
            font-size: 24px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
          }
  
          .subtitle {
            font-size: 16px;
            color: #777;
            margin-bottom: 20px;
          }
  
          .status {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">🚀 Deployment Successful!</div>
          <div class="subtitle">Your backend is up and running.</div>
          <div class="status">Status: OK</div>
        </div>
      </body>
      </html>
    `);
  });
app.use('/',authRouter)
app.use('/',profileRouter)
app.use('/',requestRouter)
app.use('/',userRouter)
app.use('/',chatRouter)

  






const http = require('http')
const server = http.createServer(app)
const socket = require('socket.io')
initialiseSocketConnection(server)




connectDB()
    .then(() => {
        console.log("DB connected successfully");
        server.listen(PORT,'0.0.0.0', () => {
            console.log("server is listening at ", PORT);
        });
    })
    .catch((e) => console.log(e));