const { peepal, contextMiddleware } = require("peepal");
const logger = peepal();

const express = require("express");
const { createUser } = require("./controller");
const app = express();

app.use(express.json());

app.listen(3001, () => {
    console.log("servier is running on port 3001");
})

app.use(contextMiddleware);

app.use((req, res, next) => {
    const { "x-access-token": token } = req.auth || {};
    logger.info("validating tokens");
    next();
})

app.get("/", createUser);