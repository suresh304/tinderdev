const socketIO = require('socket.io');

const initialiseSocketConnection = (server, pool, pgListener) => {
  const io = socketIO(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  // ✅ Listen to DB events
  pgListener.connect()
    .then(() => {
      console.log('📡 pgListener connected');
      return pgListener.query('LISTEN new_post');
    })
    .then(() => {
      console.log('📡 Listening to NOTIFY channel: new_post');
    })
    .catch(err => console.error('pgListener error:', err));

  pgListener.on('notification', async (msg) => {
    try {
      const payload = JSON.parse(msg.payload);
     const post = await pool.query(`
  SELECT 
    u.first_name AS author,
    u.id as user_id, 
    p.content AS content, 
    p.id AS post_id, 
    p.media_url as photo_url,
    p.created_at AS published_on
  FROM users u
  JOIN posts p ON u.id = p.user_id
  WHERE p.id = $1 AND u.id = $2
`, [payload.id, payload.user_id]);
      io.emit('newPostCreated', post.rows[0]);
      console.log('📢 Emitted newPostCreated:', payload);
    } catch (err) {
      console.error('❌ Failed to handle NOTIFY:', err);
    }
  });

  
  io.on("connection", (socket) => {

    // handle events

    socket.on("joinchat", ({ userId, targetUser, first_name }) => {
      const room = [userId, targetUser].sort().join('$')
      socket.join(room)
      console.log(first_name + "join chat")

    })

    const { pool,pgListener } = require('../index') // your PostgreSQL pool

    socket.on("sendmessage", async ({ first_name, userId, targetUser, message }) => {
      console.log('hello>>>send message',)
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
      console.log("this is typing--------->", data, userId, targetUser)
      io.to(room).emit('typingStatusRecieved', { data, senderId: userId, recieverId: targetUser })
    })





    socket.on("deletingMessage", async ({ msgId, userId, targetUser }) => {
      try {
        console.log("this is deleting msg", msgId);
        const room = [userId, targetUser].sort().join('$');

        // Step 1: Get chat room ID
        const chatRoomQuery = await pool.query(
          `SELECT id, user1_id, user2_id FROM chat_rooms 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
          [userId, targetUser]
        );

        if (chatRoomQuery.rows.length === 0) return;
        const chatRoom = chatRoomQuery.rows[0];

        // Step 2: Get message
        const messageQuery = await pool.query(
          `SELECT * FROM chat_messages WHERE id = $1 AND chat_room_id = $2`,
          [msgId, chatRoom.id]
        );

        if (messageQuery.rows.length === 0) return;

        const message = messageQuery.rows[0];

        // Step 3: Update deleted_by if userId is not already there
        if (!message.deleted_by.includes(userId)) {
          await pool.query(
            `UPDATE chat_messages 
         SET deleted_by = array_append(deleted_by, $1)
         WHERE id = $2`,
            [userId, msgId]
          );
        }

        // Step 4: Check if both users have deleted
        const allDeleted = [chatRoom.user1_id, chatRoom.user2_id].every(id =>
          message.deleted_by.includes(id)
        );

        // Step 5: If both users deleted, remove the message
        if (allDeleted) {
          await pool.query(`DELETE FROM chat_messages WHERE id = $1`, [msgId]);
        }

        // Step 6: Get all non-deleted messages for this user
        const updatedMessagesQuery = await pool.query(
          `SELECT m.*, 
              s.first_name AS sender_first_name, s.last_name AS sender_last_name, s.photo_url AS sender_photo_url,
              r.first_name AS receiver_first_name, r.last_name AS receiver_last_name, r.photo_url AS receiver_photo_url
       FROM chat_messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.chat_room_id = $1 AND NOT ($2 = ANY (m.deleted_by))
       ORDER BY m.created_at ASC`,
          [chatRoom.id, userId]
        );











        const filteredMessages = updatedMessagesQuery.rows.map(msg => ({
          id: msg.id,
          text: msg.text,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          sender_first_name: msg.sender_first_name,
          sender_last_name: msg.sender_last_name,
          receiver_first_name: msg.receiver_first_name,
          receiver_last_name: msg.receiver_last_name,
          receiver_photo_url: msg.receiver_photo_url,
          sender_photo_url: msg.sender_photo_url,

          // sender: {
          //   id: msg.sender_id,
          //   first_name: msg.sender_first_name,
          //   last_name: msg.sender_last_name,
          //   photo_url: msg.sender_photo,
          // },
          // receiver: {
          //   id: msg.receiver_id,
          //   first_name: msg.receiver_first_name,
          //   last_name: msg.receiver_last_name,
          //   photo_url: msg.receiver_photo,
          // }
        }));

        console.log('this is ', filteredMessages)

        io.to(room).emit("messageUpdated", filteredMessages);
      } catch (err) {
        console.error("deleteMessage error:", err);
      }
    });

   



  })
}

module.exports = { initialiseSocketConnection }