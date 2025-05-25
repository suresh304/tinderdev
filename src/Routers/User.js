const express = require('express')
const { userAuth } = require('../middlewares/auth')
const connectionRequest = require('../models/connectionRequest')
const userRouter = express.Router()
const user = require('../models/user')
const { default: axios } = require('axios')

const USER_SAFE_DATA = "firstName lastName age photoUrl gender"


userRouter.get('/user/request/received', userAuth, async (req, res) => {
    try {
        const logedinuser = req.user
        const recievedRequests = await connectionRequest
            .find({ toUserId: logedinuser._id, status: 'interested' })
            .populate('fromUserId', ["firstName", "lastName"])

        res.json({ data: recievedRequests })

    } catch (error) {
        res.status(400).json({ error: error })
    }


})


userRouter.get('/user/connections', userAuth, async (req, res) => {


    try {
        const loggedinUser = req.user
        const connections = await connectionRequest.find({
            $or: [
                { toUserId: loggedinUser._id, status: 'accepted' },
                { fromUserId: loggedinUser._id, status: 'accepted' }

            ]

        }).populate('toUserId', ['firstName', 'lastName','photoUrl']).populate('fromUserId', ['firstName', 'lastName','photoUrl'])


        const data = connections?.map((connection) => {
            if (loggedinUser._id.toString() === connection.fromUserId._id.toString()) {
                return connection.toUserId
            } else {

                return connection.fromUserId
            }
        })

        res.json({ data: data })

    } catch (error) {
        res.send(error)
    }




})

userRouter.get('/feed',userAuth, async (req,res)=>{
    try {

        const page = req.query.page||1
        let limit = req.query.limit||10
        let skip = (page-1)*limit
        const loggedinUser = req.user
        const data = await connectionRequest.find({
            $or:[{fromUserId:loggedinUser._id},{toUserId:loggedinUser._id}]
        }).select('toUserId fromUserId')

        const hiddenProfileFromFeed = new Set()
        data.map((req)=>{
             hiddenProfileFromFeed.add(req.fromUserId.toString())
             hiddenProfileFromFeed.add(req.toUserId.toString())
        })

        const feedSuggestonUers = await user.find({
           $and: [
            {_id: {$nin : Array.from(hiddenProfileFromFeed)}},
            {_id: {$ne:loggedinUser._id} }
        ]
        }).select(USER_SAFE_DATA).skip(skip).limit(limit)

        res.json({data:feedSuggestonUers})



        
    } catch (error) {
        res.send(error)
    }
})


userRouter.get('/news',userAuth, async (req,res)=>{
    const { q } = req.query;
    try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q,
        from: '2025-05-23',
        to: '2025-05-23',
        sortBy: 'popularity',
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
})

module.exports = { userRouter }
