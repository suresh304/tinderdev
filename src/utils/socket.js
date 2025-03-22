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

                // chat.messages.push({
                //     senderId: userId,
                //     recieverId: targetUser,
                //     text: message

                // })
                //   const data=      await chat.save().populate("messages.senderId","firsrName lastName photoUrl").populate("messages.recieverId","firsrName lastName photoUrl")


                const data = await chat.save()





                let chat2 = await Chat.findOne({
                    participants: {
                        $all: [userId, targetUser]
                    }
                }).populate("messages.senderId", "firstName lastName photoUrl").populate("messages.recieverId", "firstName lastName photoUrl")




                io.to(room).emit('messagerecieved', chat2.messages.slice(-1)[0])
            } catch (error) {

            }




        })
        socket.on("disconnect", () => {

        })

        socket.on("typing", ({data,userId,targetUser}) => {
            const room = [userId, targetUser].sort().join('$')
          console.log("this is typing--------->",data)
          io.to(room).emit('typingStatusRecieved', {data,senderId:userId,recieverId:targetUser})
        })

    })
}

module.exports = { initialiseSocketConnection }