const express = require("express")
const fs = require("fs")

const app = express()

app.use(express.static("./static/"))
app.get("/", (req, res) => {
    res.send(fs.readFileSync("./static/index.html"))
})

function init() {
    console.log(`Running on http://localhost:${server.address().port}`)
}

const server = app.listen(8080, init)