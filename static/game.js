"use strict"
const boxEl = document.getElementById("box")
const firstPiece = document.getElementsByClassName("piece").item(0)
/** @type {HTMLTemplateElement} */
const pieceTemplate = document.getElementById("template_piece")
const hoverSquareEl = document.getElementById("hoversquare")

// Last-hovered square on the chessboard. (In board coordinates.)
const latestCoordinates = [0, 0]

/**
 * Hide a class of elements, and toggle whether the specified element is hidden.
 * Used for showing one dialog at a time.
 * @param  {String} elementClass - element class to hide (set `visibility:hidden` on all elements of this class.)
 * @param  {HTMLElement} shownEl - element to show (toggle its `visibility` property.)
 */
function toggleHiddenOneOfClass(elementClass, shownEl) {
    const oldVisibility = shownEl.style.getPropertyValue("visibility") ?? "visible"

    for (const elInClass of document.getElementsByClassName(elementClass)) {
        elInClass.style.setProperty("visibility", "hidden")
    }
    if (oldVisibility == "visible") {
        shownEl.style.setProperty("visibility", "hidden")
    } else {
        shownEl.style.setProperty("visibility", "visible")
    }
}
/**
 * Wraps `fetch()` so that it times out after `timeoutMs` milliseconds, and can be cancelled.
 * @param  {RequestInfo} request - to pass to `fetch()`
 * @param  {RequestInit} opts - to pass to `fetch()`
 * @param  {Number} timeoutMs - how many milliseconds without a response should lead to timeout
 * @returns {{cancel: Function, response: Promise<Response>}} 
 * where `response` is a `Promise<Response>` from the wrapped `fetch(…)` call, 
 * and `cancel()` is 0-argument method that cancels the `fetch` once called.
 */
function fetchWithTimeout(request, opts, timeoutMs) {
    const controller = new AbortController();
    const signal = controller.signal;
    // Cancel after `timeoutMs` milliseconds.
    setTimeout(() => controller.abort(), timeoutMs)
    return {
        cancel: () => controller.abort(),
        response: fetch(request, {
            ...opts,
            signal
        })
    };
}


const logoutLinkEl = document.getElementById("logout_link")
const signupLinkEl = document.getElementById("signup_link")
const loginLinkEl = document.getElementById("login_link")

const loginDialogEl = document.getElementById("login_dialog")
loginLinkEl.addEventListener("click",
    () => toggleHiddenOneOfClass("dialog", loginDialogEl)
)

const signupDialogEl = document.getElementById("signup_dialog")
signupLinkEl.addEventListener("click",
    () => toggleHiddenOneOfClass("dialog", signupDialogEl)
)

logoutLinkEl.addEventListener("click", async function handleLogout() {
    const logoutURL = new URL(`${location.origin}/logout`)
    let logoutResponse
    try {
        logoutResponse = await fetchWithTimeout(logoutURL, {
            method: "POST"
        }, 6000).response
    } catch (err) {
        console.error(err)
        if (err.name == "AbortError") {
            console.error("Request timed out!")
            return // Stay "logged in" if the request times out!
        }
    }
    if (logoutResponse.ok) {
        console.log("Logged out!")
        for (const linkEl of document.getElementsByClassName("nav_link")) {
            linkEl.style.setProperty("visibility", "visible")
        }
        this.style.setProperty("visibility", "hidden")
    }
})

document.getElementById("login_submit").addEventListener("click", async function handleLogin(event) {
    event.preventDefault() // don't reload the page on submit!
    const loginFormEl = loginDialogEl.querySelector("form")

    if (!loginFormEl.checkValidity()) {
        // TODO: Display error
        return;
    }

    /** @type {HTMLInputElement} */
    const emailField = document.getElementById("login_email_field")
    /** @type {HTMLInputElement} */
    const passField = document.getElementById("login_pass_field")
    const url = new URL(location.origin)
    url.pathname = "login"
    url.searchParams.append("email", emailField.value)
    url.searchParams.append("pass", passField.value)

    let response
    try {
        response = await fetchWithTimeout(url, {
            method: "POST"
        }, 6000).response
    } catch (err) {
        console.error(err)
        if (err.name == "AbortError") {
            //Timed out, exit early
            console.error("Request timed out.")
            return
        }
    }
    const body = await response.json()
    if (response.ok) {
        console.log("Logged in! Got session ID: " + body.sessionID)
        // Display logout link, and hide the dialog
        toggleHiddenOneOfClass("nav_link", logoutLinkEl)
        loginDialogEl.style.setProperty("visibility", "hidden")
    } else {
        console.error(await body.error)
        // TODO: 'display error' function & UI Element
    }
})

document.getElementById("signup_submit").addEventListener("click", async function handleSignup(event) {
    event.preventDefault() // don't reload the page on submit!

    // TODO: validate handles and emails before letting users submit the form.
    /** @type {HTMLInputElement} */
    const handleField = document.getElementById("signup_handle_field")
    /** @type {HTMLInputElement} */
    const emailField = document.getElementById("signup_email_field")
    /** @type {HTMLInputElement} */
    const passField = document.getElementById("signup_pass_field")
    /** @type {HTMLInputElement} */
    const confirmPassField = document.getElementById("signup_pass_confirm_field")

    // TODO: reject empty fields!
    // (really, should use HTML required attributes and other form validation stuff)
    // Reject nonmatching password/confirm password pairs
    if (confirmPassField.value !== passField.value) {
        // Show error message, exit early.
        // TODO: don't use alert() here!
        alert("Password/Confirm Password fields do not match!")
        return;
    }

    // TODO: use Dropbox's zxcvn for password strength filtering
    // TODO: consider a captcha?

    const url = new URL(location.origin)
    url.pathname = "signup"
    url.searchParams.append("handle", handleField.value)
    url.searchParams.append("email", emailField.value)
    url.searchParams.append("pass", passField.value)

    // console.log(url.toString())

    // TODO: error handling
    let response
    try {
        response = await fetchWithTimeout(url, {
            method: "POST"
        }, 6000).response
    } catch (err) {
        console.error(err)
        if (err.name == "AbortError") {
            //Timed out, exit early
            console.error("Request timed out.")
            return
        }
    }
    const body = await response.json()
    if (response.ok) {
        console.log("Signed up! Got session ID: " + body.sessionID)
        // TODO: reset field values?
        // TODO: display “log out” button
        // Close the dialog
        signupDialogEl.hidden = true;
    } else {
        console.error(await body.error)
        // TODO: 'display error' function & UI Element
    }
})

/**
 * Visually moves the specified piece element to the board X and Y coords provided.
 * @param {HTMLDivElement} pieceEl - The piece Element to move
 * @param {Number} x - Target board X-coordinate, [0, 8]
 * @param {Number} y - Target board Y-coordinate, [0, 8]
 */
function movePiece(pieceEl, x, y) {
    const pieceSize = 12.5 // in % units!
    const [actualX, actualY] = [x * pieceSize, y * pieceSize]
    pieceEl.style.setProperty("--piece-offset-x", actualX)
    pieceEl.style.setProperty("--piece-offset-y", actualY)
}

/** 
 * Math utility function. Clamps `x` between `min` and `max`.
 * @param {Number} x
 * @param {Number} min
 * @param {Number} max
 * @returns {Number} 
 */
Math.clamp = function (x, min, max) {
    return Math.min(Math.max(x, min), max)
}

/**
 * Given two numbers, `x` and `d`, find the nearest multiple of `1/d` that is less than `x`.
 * @see https://www.desmos.com/calculator/tfwnaosfjc
 * @param {Number} x
 * @param {Number} d
 * @returns {Number} the nearest simple fraction with denominator `d` below `x`.
 */
function nearestFractionDown(x, d) {
    return Math.floor(d * x) / d
}

/* TODO: I know there's a way to intelligently pass the event data to the boxEl 
 * instead of doing these weird calculations… but I don't know how. 
 * Will figure it out later.
 */
boxEl.addEventListener("mousemove", e => {
    /** @type {HTMLElement} */
    const targetEl = e.target

    // When hovering over anything except the hover highlight element itself…
    if (targetEl.id == "hoversquare") {
        return;
    }

    // Get the coordinates of this mousemove, relative to the board element:
    let [offsetX, offsetY] = [0, 0]
    const boxSize = boxEl.getClientRects().item(0).width
    if (targetEl.id == "box") {
        // Nearest 1/8th, times 100 for percent values
        offsetX = Math.clamp(nearestFractionDown(e.offsetX / boxSize, 8) * 100, 0, 100)
        offsetY = Math.clamp(nearestFractionDown(e.offsetY / boxSize, 8) * 100, 0, 100)
    }
    if (targetEl.classList.contains("piecesize")) {
        // We're hovering over a piece/piecelike element, so just use its stylesheet properties.
        offsetX = parseInt(targetEl.style.getPropertyValue("--piece-offset-x"))
        offsetY = parseInt(targetEl.style.getPropertyValue("--piece-offset-y"))
    }

    // e.offsetX and e.offsetY are coordinates relative to the board element:
    // Convert them to game coordinates!
    const [gameX, gameY] = [offsetX / 12.5, offsetY / 12.5]
    console.log([offsetX, offsetY], [gameX, gameY], targetEl)

    // Update the last hovered position
    latestCoordinates[0] = gameX;
    latestCoordinates[1] = gameY;

    // Move the highlight square to that position!
    movePiece(hoverSquareEl, gameX, gameY)
})

boxEl.addEventListener("click", (e => {
    // If it's not a left click, early exit
    if (e.button != 0) {
        return;
    }
    movePiece(firstPiece, ...latestCoordinates)
}))

// Dev mojo

async function ping() {
    const url = new URL(location.origin)
    url.pathname = "session"
    console.log(`pinging on ${url}`)
    try {
        const response = await fetchWithTimeout(url, {
            method: "POST"
        }, 6000).response
        console.log("got pong")
        console.log(`got pong: ${JSON.stringify(await response.json())}`)
    } catch (err) {
        if (err.name == "AbortError") {
            console.error("Request timed out!")
        }
        console.error("error!?")
        console.error(err)
    }
}

function startPinging() {
    return setInterval(ping, 500)
}