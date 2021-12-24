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
 * @param  {String} elementClass - element class to hide (set `hidden=true` on all elements of this class.)
 * @param  {HTMLElement} shownEl - element to show (unset its `hidden` property.)
 */
function toggleHiddenOneOfClass(elementClass, shownEl) {
    const wasHidden = shownEl.hidden;
    for (const elInClass of document.getElementsByClassName(elementClass)) {
        elInClass.hidden = true;
    }
    shownEl.hidden = !wasHidden;
}

const loginDialogEl = document.getElementById("login_dialog")
document.getElementById("login_link").addEventListener("click",
    () => toggleHiddenOneOfClass("dialog", loginDialogEl)
)

const signupDialogEl = document.getElementById("signup_dialog")
document.getElementById("signup_link").addEventListener("click",
    () => toggleHiddenOneOfClass("dialog", signupDialogEl)
)

document.getElementById("login_submit").addEventListener("click", function handleLogin(event) {
    event.preventDefault() // don't reload the page on submit!

    /** @type {HTMLInputElement} */
    const emailField = document.getElementById("login_email_field")
    /** @type {HTMLInputElement} */
    const passField = document.getElementById("login_pass_field")
    const url = new URL(location.origin)
    url.pathname = "login"
    url.searchParams.append("email", emailField.value)
    url.searchParams.append("pass", passField.value)

    // console.log(url.toString())

    fetch(url, {
        method: "POST"
    }).then(async res => {
        const body = await res.json()
        if (res.ok) {
            console.log("Logged in! Got session ID: " + body.sessionID)
            // TODO: display “log out” button
        } else {
            console.error(await body.error)
            // TODO: 'display error' function & UI Element
        }
    })
})

document.getElementById("signup_submit").addEventListener("click", function handleLogin(event) {
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

    fetch(url, {
        method: "POST"
    }).then(async res => {
        const body = await res.json()
        if (res.ok) {
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