const socket = require('socket.io')
const user = require('../models/user')
const { Chat } = require('../models/chat')

const initialiseSocketConnection = (server) => {

  const io = socket(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true

    }
  })

  io.on("connection", (socket) => {

    // handle events

    socket.on("joinchat", ({ userId, targetUser, first_name }) => {
      const room = [userId, targetUser].sort().join('$')
      socket.join(room)
      console.log(first_name + "join chat")

    })

   const {pool} = require('../index') // your PostgreSQL pool

socket.on("sendmessage", async ({ first_name, userId, targetUser, message }) => {
  try {
    const room = [userId, targetUser].sort().join('$');
    console.log(`${first_name} sent message: ${message}`);

    // Step 1: Find existing chat room or create one
    let chatRoomResult = await pool.query(
      `SELECT id FROM chat_rooms 
       WHERE (user1_id = $1 AND user2_id = $2) 
          OR (user1_id = $2 AND user2_id = $1)`,
      [userId, targetUser]
    );

    let chatRoomId;

    if (chatRoomResult.rows.length === 0) {
      // No room, create new
      const insertRoom = await pool.query(
        `INSERT INTO chat_rooms (user1_id, user2_id) 
         VALUES ($1, $2) RETURNING id`,
        [userId, targetUser]
      );
      chatRoomId = insertRoom.rows[0].id;
    } else {
      chatRoomId = chatRoomResult.rows[0].id;
    }

    // Step 2: Insert the new message
    const insertMessage = await pool.query(
      `INSERT INTO chat_messages (chat_room_id, sender_id, receiver_id, text, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [chatRoomId, userId, targetUser, message]
    );

    const lastMessage = insertMessage.rows[0];

    // Step 3: Populate sender and receiver info
    const userDetails = await pool.query(
      `SELECT id, first_name, last_name, photo_url FROM users WHERE id IN ($1, $2)`,
      [userId, targetUser]
    );

    const usersMap = {};
    userDetails.rows.forEach(user => {
      usersMap[user.id] = user;
    });

    // Step 4: Attach user info to message
    const enrichedMessage = {
      ...lastMessage,
      sender: usersMap[lastMessage.sender_id],
      receiver: usersMap[lastMessage.receiver_id]
    };

    // Step 5: Emit the enriched message to the room
    io.to(room).emit('messagerecieved', enrichedMessage);
  } catch (error) {
    console.error("Error in sendmessage:", error);
  }
});



    socket.on("disconnect", () => {

    })

    socket.on("typing", ({ data, userId, targetUser }) => {
      const room = [userId, targetUser].sort().join('$')
      console.log("this is typing--------->", data)
      io.to(room).emit('typingStatusRecieved', { data, senderId: userId, recieverId: targetUser })
    })


    socket.on("deletingMessage", async ({ msgId, userId, targetUser }) => {
      try {

        console.log("this is deleting msg",msgId)
        const room = [userId, targetUser].sort().join('$');

        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUser] }
        });

        if (!chat) return;

        // Find the message
        const msgIndex = chat.messages.findIndex(
          (msg) => msg._id.toString() === msgId
        );

        if (msgIndex === -1) return;

        const message = chat.messages[msgIndex];

        // Avoid double delete
        if (!message.deletedBy.includes(userId)) {
          message.deletedBy.push(userId);
        }

        // If both users deleted, remove the message
        const allDeleted = chat.participants.every(participantId =>
          message.deletedBy.map(id => id.toString()).includes(participantId.toString())
        );

        if (allDeleted) {
          chat.messages.splice(msgIndex, 1);
        }

        await chat.save();

        // Refetch chat to populate and emit updated messages
        const updatedChat = await Chat.findOne({
          participants: { $all: [userId, targetUser] }
        })
          .populate("messages.senderId", "first_name lastName photoUrl")
          .populate("messages.recieverId", "first_name lastName photoUrl");

        // Filter out messages deleted for this user
        const filteredMessages = updatedChat.messages.filter(
          (msg) => !msg.deletedBy.includes(userId)
        );

        io.to(room).emit("messageUpdated", filteredMessages);
      } catch (err) {
        console.error("deleteMessage error:", err);
      }
    });










  })
}

module.exports = { initialiseSocketConnection }