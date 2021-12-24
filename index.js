const express = require("express")
const session = require("express-session")
const fs = require("fs")
const Database = require("sqlite-async")
const bcrypt = require("bcrypt")

/** @type {Database} */
let db // Initialized in `init()`

const app = express()

const sessionConfig = {
    // use an array of secrets in production, and put this inside an environment variable!
    secret: "change_this_in_production",
    saveUninitialized: false,
    resave: false,
    cookie: {
        secure: false
    }
}

// Secure cookies require SSL, i.e. running behind a reverse proxy
// So, only enable them in production environments. 
// TODO: Make this actually work?
// ($ npm run run-prod)
if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy (nginx)
    sessionConfig.cookie.secure = true // serve secure cookies!
}

app.use(session(sessionConfig))


app.use(express.static("./static/"))
app.get("/", (req, res) => {
    res.send(fs.readFileSync("./static/index.html"))
})

app.post("/signup", async function (req, res) {
    const email = req.query.email.trim().substring(0, 200)
    const existingUser = await db.get("select * from users where email = ?", email)

    // TODO: validate everything.
    // Reject empty fields!
    // Reject non-ascii characters in handles or emails?

    // The user already existing in our system is an error, we
    // shouldn't overwrite existing accounts. 
    // Exit before creating a record.
    if (existingUser !== undefined) {
        sendEmailError(res)
        return
    }

    // Now, hash the password and save to DB!
    // (We should only do this once we're more or less sure the user isn't
    // a spambot, since hashing is slow.)
    // TODO: rate limiting, etc.
    const hash = await bcrypt.hash(req.query.pass, 10)
    const handle = req.query.handle

    // TODO: .catch(err => ) DB errors somehow
    await db.run("insert into users (handle, email, password_hash) values (?, ?, ?)", handle, email, hash)

    req.session.user = {
        handle: handle,
        email: email
    }

    // Send back an OK response with some user information
    res.status(200)
    res.json({
        sessionID: req.sessionID,
        handle: handle,
        email: email
    })


    function sendEmailError(res) {
        // At some point, should check emails against a list of common spam domains
        // and emit this error if a user tries to sign up with an email address on
        // that list.
        res.status(403)
        res.json({
            error: "Could not sign up with this email address."
        })
    }
})

app.post("/login", async function (req, res) {
    // TODO: rate limiting, spam checks, proper session invalidation, etc.
    const email = req.query.email.trim().substring(0, 200) // cutoff at 200 chars, email column size
    const pass = req.query.pass
    console.log(`processing login request for ${email}`)

    // Check if we have an entry for that email address
    const userRecord = await db.get("select * from users where email = ?", email)
    if (userRecord === undefined) {
        sendUserPassError(res)
        return;
    }

    // Check if the password the user provided matches the hash we have
    if (await bcrypt.compare(pass, userRecord.password_hash)) {
        // Generate a session token with `express-session`
        req.session.user = {
            handle: userRecord.handle,
            email: userRecord.email
        }

        // Send back an OK response with some user information
        res.status(200)
        res.json({
            sessionID: req.sessionID,
            handle: userRecord.handle,
            email: userRecord.email
        })
    } else {
        sendUserPassError(res)
        return;
    }

    function sendUserPassError(res) {
        res.status(403) // TODO: look up the appropriate status code
        res.json({
            error: "Username/Password mismatch."
        })
    }
})

async function init() {
    console.log(`Running on http://localhost:${server.address().port}`)

    db = await Database.open("db/app.db")
    // Create the users table.
    await db.exec(`
        create table if not exists users (handle varchar(50), email varchar(200), password_hash binary(60));
    `)
}

const server = app.listen(8080, init)