const boxEl = document.getElementById("box")
const firstPiece = document.getElementsByClassName("piece").item(0)
/** @type {HTMLTemplateElement} */
const pieceTemplate = document.getElementById("template_piece")
const hoverSquareEl = document.getElementById("hoversquare")

// The target for the 
const latestCoordinates = [0, 0]

console.log(firstPiece)

/**
 * Visually moves the specified piece element to the board X and Y coords provided.
 * @param {HTMLDivElement} pieceEl - The piece Element to move
 * @param {Number} x - Target board X-coordinate, [0, 8]
 * @param {Number} y - Target board Y-coordinate, [0, 8]
 */
function movePiece(pieceEl, x, y) {
    const pieceSize = pieceEl.clientHeight
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
function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max)
}
/**
 * Given coordinates (in CSS pixels) where 0,0 is the top left corner of 
 * the board, returns the logical board coordinates corresponding to that 
 * position.
 * @param  {Number} offsetX
 * @param  {Number} offsetY
 * @returns {Array.<Number>} TODO: fix this type declaration
 */
function getBoardCoordinates(offsetX, offsetY) {
    // HACK: look this up in the stylesheet instead
    const pieceSize = firstPiece.clientHeight
    const boardX = clamp(Math.floor(offsetX / pieceSize), 0, 7)
    const boardY = clamp(Math.floor(offsetY / pieceSize), 0, 7)
    return [boardX, boardY]
}

boxEl.addEventListener("mousemove", e => {
    /** @type {HTMLElement} */
    const targetEl = e.target

    // When hovering over anything except the hover highlight element itself…
    if (targetEl.id == "hoversquare") {
        return;
    }

    // Get the coordinates of this mousemove, relative to the board element:
    let offsetX = 0
    let offsetY = 0
    if (targetEl.id == "box") {
        [offsetX, offsetY] = [e.offsetX, e.offsetY]
    } else if (targetEl.style.length) {
        [offsetX, offsetY] = [
            parseInt(targetEl.style.getPropertyValue("--piece-offset-x")),
            parseInt(targetEl.style.getPropertyValue("--piece-offset-y"))
        ]
    }

    // e.offsetX and e.offsetY are coordinates relative to the board element:
    // Convert them to game coordinates!
    const [gameX, gameY] = getBoardCoordinates(offsetX, offsetY)
    console.log([offsetX, offsetY, targetEl])

    // Update the last hovered position
    latestCoordinates[0] = gameX;
    latestCoordinates[1] = gameY;

    // Move the highlight square to that position!
    movePiece(hoverSquareEl, gameX, gameY)

    // Show the highlight square in case it's hidden (i.e. user just tabbed back 
    // into the window)
    showHoverSquare()
})

boxEl.addEventListener("mouseenter", showHoverSquare)

boxEl.addEventListener("mouseleave", e => {
    hoverSquareEl.hidden = true;
})

function showHoverSquare() {
    hoverSquareEl.hidden = false;
}

boxEl.addEventListener("click", (e => {
    // If it's not a left click, early exit
    if (e.button != 0) {
        return;
    }

    movePiece(firstPiece, ...latestCoordinates)
    // movePiece(firstPiece, latestCoordinates[0], latestCoordinates[1])

}))