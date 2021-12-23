const express = require("express")
const fs = require("fs")
const sqlite3 = require("sqlite3") //.verbose()

// TODO: Disable verbose mode in production!
// @see https://github.com/mapbox/node-sqlite3/wiki/Debugging
// sqlite3 = sqlite3.verbose()

/** @type {sqlite3.Database} */
let db // Initialized in `init()`

const app = express()

app.use(express.static("./static/"))
app.get("/", (req, res) => {
    res.send(fs.readFileSync("./static/index.html"))
})

app.post("/signup", (req, res) => {
    res.sendStatus(501) // not implemented!
})

app.post("/login", (req, res) => {
    res.sendStatus(501) // not implemented!
})

function init() {
    console.log(`Running on http://localhost:${server.address().port}`)
    
    db = new sqlite3.Database("db/app.db")
    // Run the following queries in order using `serialize`.
    db.serialize(function () {
        // Create the users table
        db.exec(`
        
        `)
    })

}

const server = app.listen(8080, init)