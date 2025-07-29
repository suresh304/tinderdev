const express = require('express')
const { userAuth } = require('../middlewares/auth')

const chatRouter = express.Router()

chatRouter.get('/chat/:targetUserId', userAuth, async (req, res) => {
  const userId = req.user.id;
  const targetUserId = parseInt(req.params.targetUserId);
  const db = req.app.locals.db

  try {
    // 1. Find existing chat room between both users
    const chatRoomResult = await db.query(`
      SELECT cr.id
      FROM public.chat_rooms cr
      WHERE (
        (cr.user1_id = $1 AND cr.user2_id = $2)
        OR
        (cr.user1_id = $2 AND cr.user2_id = $1)
      )
      LIMIT 1
    `, [userId, targetUserId]);

    let chatRoomId;

    // 2. If no chat room found, create one
    if (chatRoomResult.rows.length === 0) {
      const insertResult = await db.query(`
        INSERT INTO public.chat_rooms (user1_id, user2_id)
        VALUES ($1, $2)
        RETURNING id
      `, [userId, targetUserId]);

      chatRoomId = insertResult.rows[0].id;
    } else {
      chatRoomId = chatRoomResult.rows[0].id;
    }

    // 3. Fetch chat messages between the two users in this room
    const messagesResult = await db.query(`
  SELECT
    m.id,
    m.text,
    m.created_at,
    m.sender_id,
    m.receiver_id,
    us.first_name AS sender_first_name,
    us.last_name AS sender_last_name,
    us.photo_url AS sender_photo_url,
    ur.first_name AS receiver_first_name,
    ur.last_name AS receiver_last_name,
    ur.photo_url AS receiver_photo_url
  FROM public.chat_messages m
  JOIN users us ON us.id = m.sender_id
  JOIN users ur ON ur.id = m.receiver_id
  WHERE m.chat_room_id = $1 
    AND NOT ($2 = ANY (m.deleted_by))
  ORDER BY m.created_at ASC
`, [chatRoomId, userId]);


    res.send({
      chat_room_id: chatRoomId,
      participants: [userId, targetUserId],
      messages: messagesResult.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});








// chatRouter.get('/chat/:targetUserId/messages', userAuth, async (req, res) => {
//   const userId = req.user.id;
//   const { targetUserId } = req.params;
//   const limit = parseInt(req.query.limit) || 20;
//   const skip = parseInt(req.query.skip) || 0;

//   // Find the chat
//   const chat = await Chat.findOne({
//     participants: { $all: [userId, targetUserId] },
//     deletedBy: { $ne: userId }
//   });

//   if (!chat) {
//     return res.status(404).json({ message: "Chat not found" });
//   }

//   // Filter out messages deleted by this user
//   const visibleMessages = chat.messages.filter(
//     (msg) => !msg.deletedBy?.map(id => id.toString()).includes(userId.toString())
//   );

//   // Apply pagination (latest messages first)
//   const paginatedMessages = visibleMessages
//     .slice()
//     .reverse()
//     .slice(skip, skip + limit)
//     .reverse();

//   // Manual population for sender and receiver
//   const userIds = new Set();
//   paginatedMessages.forEach(msg => {
//     userIds.add(msg.senderId.toString());
//     userIds.add(msg.recieverId.toString());
//   });

//   const users = await user.find({ _id: { $in: Array.from(userIds) } })
//     .select("first_name lastName photoUrl createdAt");

//   const userMap = {};
//   users.forEach(u => {
//     userMap[u.id] = u;
//   });

//   // Attach populated user data
//   const enrichedMessages = paginatedMessages.map(msg => ({
//     ...msg.toObject(),
//     senderId: userMap[msg.senderId],
//     recieverId: userMap[msg.recieverId]
//   }));

//   res.json({ messages: enrichedMessages });
// });















chatRouter.delete('/chat/:targetUserId', userAuth, async (req, res) => {
    const userId = req.user.id;
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
  const userId = req.user.id;
  const { targetUserId, msgId } = req.params;
  const delForBoth = req.body.del_for_both;

  try {
    // 1. Check if chat room exists between these users
    const chatRoomResult = await db.query(
      `SELECT id FROM public.chat_rooms 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1) 
       LIMIT 1`,
      [userId, targetUserId]
    );

    if (chatRoomResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const chatRoomId = chatRoomResult.rows[0].id;

    // 2. Check if message exists and belongs to that chat
    const messageResult = await db.query(
      `SELECT * FROM public.chat_messages 
       WHERE id = $1 AND chat_room_id = $2`,
      [msgId, chatRoomId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // 3. Check if already deleted for this user
    const checkDeletion = await db.query(
      `SELECT 1 FROM public.message_deletions 
       WHERE message_id = $1 AND user_id = $2`,
      [msgId, userId]
    );

    if (checkDeletion.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Message is already deleted for this user",
      });
    }

    // 4. Mark message as deleted for one or both users
    const deleteForUsers = delForBoth
      ? [userId, parseInt(targetUserId)]
      : [userId];

    for (const uid of deleteForUsers) {
      await db.query(
        `INSERT INTO public.message_deletions (message_id, user_id) 
         VALUES ($1, $2)
         ON CONFLICT (message_id, user_id) DO NOTHING`,
        [msgId, uid]
      );
    }

    return res.status(200).json({
      success: true,
      message: delForBoth
        ? "Message deleted for both users"
        : "Message deleted for this user only",
    });

  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});



module.exports = {chatRouter}