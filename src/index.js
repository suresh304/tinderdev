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

const cors = require('cors')
const { initialiseSocketConnection } = require('./utils/socket')
const PORT = 3001
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))

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
        server.listen(PORT, () => {
            console.log("server is listening at ", PORT);
        });
    })
    .catch((e) => console.log(e));