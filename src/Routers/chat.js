const express = require('express')
const { userAuth } = require('../middlewares/auth')
const { Chat } = require('../models/chat')

const chatRouter = express.Router()

chatRouter.get('/chat/:targetUserId',userAuth, async (req,res)=>{

    const userId = req.user._id
    const {targetUserId} = req.params
    let chat = await Chat.findOne({
        participants: {
            $all: [userId, targetUserId],
           
        },
        deletedBy:{ $ne: userId }
    }).populate("messages.senderId","firstName lastName photoUrl createdAt").populate("messages.recieverId","firstName lastName photoUrl createdAt")

    if(!chat){
        chat =  new Chat({
            participants:[userId,targetUserId],
            messages:[]
        })
        await chat.save()
    }
    res.send(chat)
    

})

chatRouter.delete('/chat/:targetUserId', userAuth, async (req, res) => {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    try {
        // Find the chat
        const chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found",
            });
        }

        // If already deleted by this user, return a message
        if (chat.deletedBy.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "Chat is already deleted for this user",
            });
        }

        // Mark chat as deleted for this user
        chat.deletedBy.push(userId);
        await chat.save();

        return res.status(200).json({
            success: true,
            message: "Chat deleted for this user only",
        });

    } catch (error) {
        console.error("Error deleting chat:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});


module.exports = {chatRouter}