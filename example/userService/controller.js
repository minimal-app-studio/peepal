const axios = require("axios");
const peepal = require("peepal");
const logger = peepal.child({
    file: "controller.js"
})

const notificationService = "http://localhost:3002";

module.exports.createUser = async (req, res) => {
    logger.info({ payload: req.body }, "creating user");
    // creating user
    // await prisma.user.create({ data: user })
    try{
    await axios.post(`${notificationService}/notification/onboarded`, { user: req.body });
    } catch(err){}
    res.json({
        status: "success",
        body: req.body
    })
}