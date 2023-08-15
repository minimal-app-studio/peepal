const { peepal, contextMiddleware } = require("peepal");
const logger = peepal();

const express = require("express");
const app = express();

app.use(express.json());

app.listen(3002, () => {
    console.log("server is running on port 3002");
})

app.use(contextMiddleware);

app.use((req, res, next) => {
    const { "x-access-token": token } = req.auth || {};
    logger.info("validating tokens");
    next();
})

app.get("/notification/onboarded", (req,res) => {
    // send email notification
    // courier.send(payload)
    res.json({ statue: "success"});
});