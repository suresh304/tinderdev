const express = require('express')
const { userAuth } = require('../middlewares/auth')

const PostRouter = express.Router()


PostRouter.get('/posts', userAuth, async (req, res) => {
  console.log('this get post called');
  try {
    const db = req.app.locals.db;
    const result = await db.query(`
      SELECT 
        posts.id AS post_id,
        users.id AS user_id,
        users.photo_url, 
        users.first_name AS author, 
        posts.content, 
        posts.created_at AS published_on
      FROM public.users 
      INNER JOIN public.posts ON users.id = posts.user_id 
      ORDER BY posts.created_at DESC;
    `);

    res.status(200).json({
      posts: result.rows
    });
  } catch (error) {
    console.error("error in get post api", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


PostRouter.post('/posts', userAuth, async (req, res) => {
  const { content, privacy } = req.body;
  const user = req.user


  try {
    const db = req.app.locals.db;

    const result = await db.query(
      `INSERT INTO public.posts (user_id, content, privacy)
       VALUES ($1, $2, $3)
       RETURNING *`, // returns the inserted row(s)
      [user.id, content, privacy]
    );

    res.status(200).json({
      success: true,
      post: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


PostRouter.delete('/posts', userAuth, async (req, res) => {

  console.log("delete enter")
  const { id } = req.body;
  const user = req.user


  try {
    const db = req.app.locals.db;

    const result = await db.query(
      `DELETE from  public.posts where id = $1 and user_id = $2`, // returns the inserted row(s)
      [id,user.id]
    );

    res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});





module.exports = { PostRouter }