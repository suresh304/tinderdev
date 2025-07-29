const express = require('express');
const { userAuth } = require('../middlewares/auth');
const { logger } = require('@azure/storage-blob');
const CommentRouter = express.Router();

CommentRouter.post('/comments', userAuth,async (req, res) => {
  const db = req.app.locals.db;
  const { post_id, content, parent_comment_id } = req.body;
  console.log("CommentRouter.post('/comments', userAuth,>>>>>>",post_id,content,parent_comment_id)
  const user = req.user
  const user_id = user.id

  if (!post_id || !user_id || !content) {
    return res.status(400).json({ error: 'post_id, user_id, and content are required.' });
  }

  try {
    const query = `
      INSERT INTO public.comments (post_id, user_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const values = [post_id, user_id, content, parent_comment_id || null];

    const result = await db.query(query, values);

    res.status(201).json({ message: 'Comment added successfully', comment: result.rows[0] });
  } catch (error) {
    console.error('Error inserting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


CommentRouter.get('/comments/:postId', async (req, res) => {
  const db = req.app.locals.db;
  const postId = req.params.postId;

  try {
    const query = `
      WITH RECURSIVE nested_comments AS (
        SELECT 
          c.id,
          c.post_id,
          c.user_id,
          u.first_name AS author,
          u.photo_url,
          c.content,
          c.parent_comment_id,
          c.created_at,
          0 AS depth
        FROM public.comments c
        JOIN public.users u ON u.id = c.user_id
        WHERE c.post_id = $1 AND c.parent_comment_id IS NULL

        UNION ALL

        SELECT 
          c.id,
          c.post_id,
          c.user_id,
          u.first_name AS author,
          u.photo_url,
          c.content,
          c.parent_comment_id,
          c.created_at,
          nc.depth + 1
        FROM public.comments c
        JOIN public.users u ON u.id = c.user_id
        JOIN nested_comments nc ON nc.id = c.parent_comment_id
        WHERE c.post_id = $1
      )
      SELECT * FROM nested_comments
      ORDER BY depth, created_at ASC;
    `;

    const result = await db.query(query, [postId]);
    res.status(200).json({ comments: result.rows });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});



// PATCH /comments/:id
CommentRouter.patch('/comments/:id', userAuth, async (req, res) => {
    const commentId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id; // assuming user ID is extracted by userAuth middleware
   console.log(userId,"kkkkkkkk")
    try {
        const db = req.app.locals.db;

        // Optional: Check if the comment belongs to the user
        const check = await db.query(
            'SELECT * FROM public.comments WHERE id = $1 AND user_id = $2',
            [commentId, userId]
        );

        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Unauthorized to edit this comment' });
        }

        // Update the comment content
        const result = await db.query(
            `UPDATE public.comments 
             SET content = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [content, commentId]
        );

        res.status(200).json({ message: 'Comment updated', comment: result.rows[0] });

    } catch (err) {
        console.error('Error updating comment:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});




module.exports = CommentRouter;
