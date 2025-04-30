const mongoose = require('mongoose')

const message = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    recieverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",

        required: true

    },
    text: {
        type: String
    }
},{timestamps:true})

const chatSchema = new mongoose.Schema({
    participants: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: {
        type: [message]
    }
})


const Chat = mongoose.model('chat', chatSchema)
module.exports = { Chat }