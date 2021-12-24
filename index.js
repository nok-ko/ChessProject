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
        secure: false, // only insecure in dev environments
        maxAge: 360000 // an hour (in ms)
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
    // Trim parameters to fit DB schema requirements
    /** @type {String} */
    const email = req.query.email.trim().substring(0, 200)
    /** @type {String} */
    const handle = req.query.handle.trim().substring(0, 50)

    // Doesn't matter how long the password is, we're hashing it with bcrypt anyway.
    /** @type {String} */
    const pass = req.query.pass

    // TODO: validate everything.
    // Reject empty fields!
    // If any of the parameters are missing/empty, exit early and send an error message.
    if (email.length == 0 || handle.length == 0 || pass.length == 0) {
        sendEmptyError(res)
        return
    }

    // Reject non-ascii characters in handles or emails?

    // Search the DB for users with the same email or handle
    const existingUserByEmail = await db.get("select * from users where email = ?", email)
    const existingUserByHandle = await db.get("select * from users where handle = ?", handle)
    // The user already existing in our system is an error, we
    // shouldn't overwrite existing accounts. 
    // Exit before creating a record.
    if (existingUserByEmail !== undefined) {
        sendEmailError(res)
        return
    }
    if (existingUserByHandle !== undefined) {
        sendHandleError(res)
        return;
    }


    // Now, hash the password and save to DB!
    // (We should only do this once we're more or less sure the user isn't
    // a spambot, since hashing is slow.)
    // TODO: rate limiting, etc.
    const hash = await bcrypt.hash(req.query.pass, 10)

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

    // TODO: seriously, look up the proper error codes!

    function sendEmailError(res) {
        // At some point, should check emails against a list of common spam domains
        // and emit this error if a user tries to sign up with an email address on
        // that list.
        res.status(403)
        res.json({
            error: "Could not sign up with this email address."
        })
    }

    function sendHandleError(res) {
        res.status(403)
        res.json({
            error: "Could not sign up with this handle."
        })
    }

    function sendEmptyError(res) {
        res.status(403)
        res.json({
            error: "The handle, email, and password fields are required."
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

app.get("/session", async function (req, res) {
    console.log("=>[/session]")
    if (req.sessionID) {
        res.status(200)
            .json({
                user: req.session.user
            })
    } else {
        res.status(403)
            .json({
                error: "No session!"
            })
    }
})

app.post("/logout", async function (req, res) {
    req.session.destroy()
    res.sendStatus(200)
})

// app.post("/ping", async function (req, res) {
//     res.status(200)
//        .json("???")
//     console.log(`ping from ${JSON.stringify(req.session)}`)
// })

async function init() {
    console.log(`Running on http://localhost:${server.address().port}`)

    db = await Database.open("db/app.db")
    // Create the users table.
    await db.exec(`
        create table if not exists users (handle varchar(50), email varchar(200), password_hash binary(60));
    `)
}

const server = app.listen(8080, init)