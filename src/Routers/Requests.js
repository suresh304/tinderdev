const express = require('express')
const requestRouter = express.Router()
const { userAuth } = require('../middlewares/auth')
const ConnectionRequest = require('../models/connectionRequest')
const { sendMail } = require('../utils/sendmail')
const user = require('../models/user')



requestRouter.post('/request/send/:status/:toUserId', userAuth, async (req, res) => {

    const allowedStatus = ["interested", "ignored"]
    try {
        const toUserId = req.params.toUserId
        const status = req.params.status
        const fromUserId = req.user._id
        const logged_in_user = req.user.emailId

        const data = await user.findById(toUserId)
        const sendTo = data.emailId

        if (!allowedStatus.includes(status)) {
            return res.json({ "message": "invalid status type" })
        }

        const connection = new ConnectionRequest({
            toUserId, fromUserId, status
        })

        const existingConnection = await ConnectionRequest.findOne(
            { $or: [{ toUserId, fromUserId }, { toUserId: fromUserId, fromUserId: toUserId }] }
        )
        if (existingConnection) {
            // throw new Error("Connection already exist");
            // return
            
            return res.status(400).json({ "message": "connection already exxist" })
        }


        await connection.save()

        await sendMail({from:logged_in_user,to:sendTo,subject:"Friend Request",text:`${req.user.firstName} wants to be friend with you 👋`,html:"<h1>Open app and respond</h1>"

        })
        res.json({ message: "connection request sent" })

    } catch (error) {
        res.status(400).json({error:error})
    }


})




requestRouter.post('/request/review/:status/:conReqId', userAuth, async (req, res) => {
    const allowedStatus = ["accepted", "rejected"]
    const {status,conReqId} = req.params
    const logedinuser = req.user
    if (!allowedStatus.includes(status)) {
        return res.json({ message: "invalid status" + status })
    }

    try {
        const connectionRequest = await ConnectionRequest.findOne({
            _id: conReqId,
            toUserId: logedinuser._id,
            status: 'interested'

        })

        

        if (!connectionRequest) {
            return res.json({ message: "no connection request found.." })
        }
        connectionRequest.status = status
        const data = await connectionRequest.save()

        res.json({
            message: "connection request " + status,
            data: data
        })

    } catch (error) {
res.json({error:error})
    }

    //loggeddin user == toUser
    //status == interested
    //

})


module.exports = { requestRouter }