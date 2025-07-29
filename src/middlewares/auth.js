const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {

  try {
    const db = req.app.locals.db;
    const { token } = req.cookies;
  console.log("now enterd",token)


    if (!token) {
      throw new Error("Token expired...");
    }

    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decodedObj);

    // Assume your JWT stores the user's id as `id` or `_id`
    const userId = decodedObj.id

    const result = await db.query("SELECT * FROM public.users WHERE id = $1", [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).send("Invalid token / please login");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ message: "Something went wrong", error: error.message });
  }
};

module.exports = { userAuth };
