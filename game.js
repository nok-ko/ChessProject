const boxEl = document.getElementById("box")
const firstPiece = document.getElementsByClassName("piece").item(0)
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
    const [actualX, actualY] = [x * pieceSize, y * pieceSize];
    pieceEl.style.setProperty("transform", `translate(${actualX}px, ${actualY}px)`)
}

function animate(i) {
    console.log("animating?")
    movePiece(firstPiece, i % 8, i % 8)
    setTimeout(() => {animate(i + 1)}, 500)
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
    return [Math.floor(offsetX / pieceSize), Math.floor(offsetY / pieceSize)]
}

boxEl.addEventListener("mousemove", e => {
    showHoverSquare()
    // HACK: figure out how bubbling works to not do this!
    if (e.target.id !== "box") {
        return
    }

    // e.layerX and e.layerY are relative coordinates
    // convert to game coordinates!
    const [gameX, gameY] = getBoardCoordinates(e.offsetX, e.offsetY)
    latestCoordinates[0] = gameX;
    latestCoordinates[1] = gameY;
    console.log([gameX, gameY], [e.offsetX, e.offsetY], e.target.id)
    movePiece(hoverSquareEl, gameX, gameY)
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