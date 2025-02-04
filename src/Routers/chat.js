const express = require('express')
const { userAuth } = require('../middlewares/auth')
const { Chat } = require('../models/chat')

const chatRouter = express.Router()

chatRouter.get('/chat/:targetUserId',userAuth, async (req,res)=>{

    const userId = req.user._id
    const {targetUserId} = req.params
    let chat = await Chat.findOne({
        participants: {
            $all: [userId, targetUserId]
        }
    }).populate("messages.senderId","firstName lastName photoUrl").populate("messages.recieverId","firstName lastName photoUrl")

    if(!chat){
        chat =  new Chat({
            participants:[userId,targetUserId],
            messages:[]
        })
        await chat.save()
    }
res.send(chat)
    

})


module.exports = {chatRouter}