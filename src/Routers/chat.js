const express = require('express')
const { userAuth } = require('../middlewares/auth')
const { Chat } = require('../models/chat');
const user = require('../models/user');

const chatRouter = express.Router()

// chatRouter.get('/chat/:targetUserId', userAuth, async (req, res) => {
//   const userId = req.user._id;
//   const { targetUserId } = req.params;

//   let chat = await Chat.findOne({
//     participants: { $all: [userId, targetUserId] },
//     deletedBy: { $ne: userId }
//   })
//     .populate("messages.senderId", "firstName lastName photoUrl createdAt")
//     .populate("messages.recieverId", "firstName lastName photoUrl createdAt");

//   if (!chat) {
//     chat = new Chat({
//       participants: [userId, targetUserId],
//       messages: []
//     });
//     await chat.save();
//   } else {
//     chat.messages = chat.messages.filter(
//       (msg) => !msg.deletedBy?.map(id => id.toString()).includes(userId.toString())
//     );
//   }

//   res.send(chat);
// });







chatRouter.get('/chat/:targetUserId/messages', userAuth, async (req, res) => {
  const userId = req.user._id;
  const { targetUserId } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const skip = parseInt(req.query.skip) || 0;

  // Find the chat
  const chat = await Chat.findOne({
    participants: { $all: [userId, targetUserId] },
    deletedBy: { $ne: userId }
  });

  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  // Filter out messages deleted by this user
  const visibleMessages = chat.messages.filter(
    (msg) => !msg.deletedBy?.map(id => id.toString()).includes(userId.toString())
  );

  // Apply pagination (latest messages first)
  const paginatedMessages = visibleMessages
    .slice()
    .reverse()
    .slice(skip, skip + limit)
    .reverse();

  // Manual population for sender and receiver
  const userIds = new Set();
  paginatedMessages.forEach(msg => {
    userIds.add(msg.senderId.toString());
    userIds.add(msg.recieverId.toString());
  });

  const users = await user.find({ _id: { $in: Array.from(userIds) } })
    .select("firstName lastName photoUrl createdAt");

  const userMap = {};
  users.forEach(u => {
    userMap[u._id] = u;
  });

  // Attach populated user data
  const enrichedMessages = paginatedMessages.map(msg => ({
    ...msg.toObject(),
    senderId: userMap[msg.senderId],
    recieverId: userMap[msg.recieverId]
  }));

  res.json({ messages: enrichedMessages });
});















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



chatRouter.post('/chat/:targetUserId/:msgId', userAuth, async (req, res) => {
  const userId = req.user._id;
  const { targetUserId, msgId } = req.params;
  const del_for_both = req.body.del_for_both

  try {
    const chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Find the message by ID
    const message = chat.messages.find((msg) => msg._id.toString() === msgId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if already deleted
    if (message.deletedBy?.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "Message is already deleted for this user",
      });
    }

    // Mark message as deleted for this user
    if (!message.deletedBy) message.deletedBy = [];
    if(del_for_both){

        message.deletedBy.push(userId,targetUserId);
    }else{
    message.deletedBy.push(userId);

    }

    await chat.save();

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully for this user only",
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