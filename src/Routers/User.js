const express = require('express')
const { userAuth } = require('../middlewares/auth')
const userRouter = express.Router()
const { default: axios } = require('axios')

const USER_SAFE_DATA = "first_name last_name age photo_url gender"


userRouter.get('/user/request/received', userAuth, async (req, res) => {
const db = req.app.locals.db

    try {
        const loggedInUser = req.user;

        const result = await db.query(
            `SELECT cr.*, u.first_name, u.last_name
             FROM public.connection_requests cr
             JOIN public.users u ON cr.from_user_id = u.id
             WHERE cr.to_user_id = $1 AND cr.status = $2`,
            [loggedInUser.id, 'interested']
        );
console.log(result.rows)
        res.json({ data: result.rows });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});



userRouter.get('/user/connections', userAuth, async (req, res) => {
    try {
      const db = req.app.locals.db
        const loggedInUserId = req.user.id;

        const result = await db.query(`
            SELECT 
                cr.id as connection_id,
                cr.from_user_id,
                cr.to_user_id,
                u_from.id as from_id,
                u_from.first_name as from_first_name,
                u_from.last_name as from_last_name,
                u_from.photo_url as from_photo_url,
                u_to.id as to_id,
                u_to.first_name as to_first_name,
                u_to.last_name as to_last_name,
                u_to.photo_url as to_photo_url
            FROM public.connection_requests cr
            JOIN public.users u_from ON cr.from_user_id = u_from.id
            JOIN public.users u_to ON cr.to_user_id = u_to.id
            WHERE cr.status = 'accepted' 
              AND (cr.from_user_id = $1 OR cr.to_user_id = $1)
        `, [loggedInUserId]);

        const connections = result.rows.map(row => {
            if (row.from_user_id === loggedInUserId) {
                return {
                    id: row.to_id,
                    first_name: row.to_first_name,
                    last_name: row.to_last_name,
                    photo_url: row.to_photo_url
                };
            } else {
                return {
                    id: row.from_id,
                    first_name: row.from_first_name,
                    last_name: row.from_last_name,
                    photo_url: row.from_photo_url
                };
            }
        });

        res.json({ data: connections });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


userRouter.get('/feed',userAuth, async (req,res)=>{
    try {

        const page = req.query.page||1
        let limit = req.query.limit||10
        let skip = (page-1)*limit
        const loggedinUser = req.user
        const data = await connectionRequest.find({
            $or:[{fromUserId:loggedinUser.id},{toUserId:loggedinUser.id}]
        }).select('toUserId fromUserId')

        const hiddenProfileFromFeed = new Set()
        data.map((req)=>{
             hiddenProfileFromFeed.add(req.fromUserId.toString())
             hiddenProfileFromFeed.add(req.toUserId.toString())
        })

        const feedSuggestonUers = await user.find({
           $and: [
            {_id: {$nin : Array.from(hiddenProfileFromFeed)}},
            {_id: {$ne:loggedinUser.id} }
        ]
        }).select(USER_SAFE_DATA).skip(skip).limit(limit)

        res.json({data:feedSuggestonUers})



        
    } catch (error) {
        res.send(error)
    }
})

const USER_SAFE_DATA1 = ['id', 'first_name', 'last_name', 'email_id', 'photo_url', 'about'];

userRouter.get('/feed1', userAuth, async (req, res) => {

  console.log('feed1 route called')
  const db = req.app.locals.db
  
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Get IDs connected to the logged-in user
    const requestResult = await db.query(
      `
      SELECT from_user_id, to_user_id
      FROM public.connection_requests
      WHERE from_user_id = $1 OR to_user_id = $1
      `,
      [userId]
    );

    const hiddenIds = new Set();
    requestResult.rows.forEach((row) => {
      hiddenIds.add(row.from_user_id);
      hiddenIds.add(row.to_user_id);
    });
    hiddenIds.add(userId); // also hide the logged-in user's own ID

    const hiddenIdArray = Array.from(hiddenIds);

    // Build placeholder list like $1, $2, ...
    const placeholders = hiddenIdArray.map((_, idx) => `$${idx + 1}`).join(', ');

    const queryText = `
      SELECT id, first_name, last_name, email_id, photo_url,about
      FROM users
      WHERE id NOT IN (${placeholders})
      ORDER BY created_at DESC
      LIMIT $${hiddenIdArray.length + 1}
      OFFSET $${hiddenIdArray.length + 2}
    `;

    const values = [...hiddenIdArray, limit, offset];

    const result = await db.query(queryText, values);

    res.json({ data: result.rows });
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).send('Error fetching feed');
  }
});


userRouter.get('/news', async (req,res)=>{
    const { q } = req.query;
    try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q,
        from: '2025-05-23',
        to: '2025-05-23',
        sortBy: 'popularity',
        apiKey: process.env.NEWS_API_KEY
      },
    });

    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
})

module.exports = { userRouter }
