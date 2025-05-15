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

    socket.on("joinchat", ({ userId, targetUser, firstName }) => {
      const room = [userId, targetUser].sort().join('$')
      socket.join(room)
      console.log(firstName + "join chat")

    })

    socket.on("sendmessage", async ({ firstName, userId, targetUser, message }) => {

      try {
        const room = [userId, targetUser].sort().join('$')

        console.log(firstName + "send message :" + message)
        console.log(firstName, userId, targetUser, message)

        let chat = await Chat.findOne({
          participants: {
            $all: [userId, targetUser]
          }
        })

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUser],
            messages: []
          })
        }

        chat.messages.push({
          senderId: userId,
          recieverId: targetUser,
          text: message

        })

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUser],
            messages: []
          })
        }



        const data = await chat.save()





        let chat2 = await Chat.findOne({
          participants: {
            $all: [userId, targetUser]
          }
        }).populate("messages.senderId", "firstName lastName photoUrl _id").populate("messages.recieverId", "firstName lastName photoUrl _id")


console.log(chat2.messages.slice(-1)[0])


        io.to(room).emit('messagerecieved', chat2.messages.slice(-1)[0])
      } catch (error) {

      }




    })
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
          .populate("messages.senderId", "firstName lastName photoUrl")
          .populate("messages.recieverId", "firstName lastName photoUrl");

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