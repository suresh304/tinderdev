const express = require('express')
const requestRouter = express.Router()
const { userAuth } = require('../middlewares/auth')
const { sendMail } = require('../utils/sendmail')



requestRouter.post('/request/send/:status/:toUserId', userAuth, async (req, res) => {

    const db = req.app.locals.db
    console.log(">>>>>>>>>>>>>>>>", req.params);

    const allowedStatus = ["interested", "ignored"]
    try {
        const to_user_id = req.params.toUserId
        const status = req.params.status
        const from_user_id = req.user.id
        const logged_in_user = req.user.email_id

        // const data = await user.findById(toUserId)
        const data = await db.query(`select * from public.users where id = ${to_user_id}`)
        console.log("this is info of req reciever", data.rows[0]);

        const sendTo = data.email_id



        if (!allowedStatus.includes(status)) {
            return res.json({ "message": "invalid status type" })
        }






        const is_connection_exist = async () => {

            console.log("helloooo")
           let data = await db.query(
  `SELECT * FROM public.connection_requests 
   WHERE (from_user_id = $1 AND to_user_id = $2) 
      OR (from_user_id = $2 AND to_user_id = $1)`,
  [from_user_id, to_user_id]
);
 console.log("helloooo2")


            return data.rows.length

        }
const connection = await is_connection_exist()



        if (connection) {
            // throw new Error("Connection already exist");
            // return

            return res.status(400).json({ "message": "connection already exxist" })
        }

        const saveConnection = async () => {

            await db.query(
                `INSERT INTO public.connection_requests (from_user_id, to_user_id, status)
   VALUES ($1, $2, $3)`,
                [from_user_id, to_user_id, status ]
            );

        }

        saveConnection()

        await sendMail({
            from: logged_in_user, to: sendTo, subject: "Friend Request", text: `${req.user.first_name} wants to be friend with you 👋`, html: "<h1>Open app and respond</h1>"

        })
        res.json({ message: "connection request sent" })

    } catch (error) {
        res.status(400).json({ error: error })
    }


})





requestRouter.post('/request/review/:status/:conReqId', userAuth, async (req, res) => {
    const allowedStatus = ["accepted", "rejected"];
    const { status, conReqId } = req.params;
    const loggedInUser = req.user;
    const db = req.app.locals.db

    if (!allowedStatus.includes(status)) {
        return res.json({ message: "invalid status: " + status });
    }

    try {
        // Step 1: Find the connection request
        const result = await db.query(
            `SELECT * FROM public.connection_requests 
             WHERE id = $1 AND to_user_id = $2 AND status = $3`,
            [conReqId, loggedInUser.id, 'interested']
        );

        if (result.rows.length === 0) {
            return res.json({ message: "No connection request found." });
        }

        // Step 2: Update the status
        const updated = await db.query(
            `UPDATE public.connection_requests 
             SET status = $1 
             WHERE id = $2 
             RETURNING *`,
            [status, conReqId]
        );

        res.json({
            message: `Connection request ${status}`,
            data: updated.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = { requestRouter }