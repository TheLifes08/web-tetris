class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

const Size = Vector2D;
const Offset = Vector2D;
const Position = Vector2D;
const blockSize = new Size(30, 30);
const blockColors = ["red", "green", "blue", "yellow"];
const updateTimeout = 50;
const leftRightTimeout = 200;
const tetraminoSpawnZoneSizeY = 4;

let gameOver = false;
let keyPressed = false;
let fallKeyPressed = false;
let leftKeyPressed = false;
let rightKeyPressed = false;
let fallAudio = undefined;
let rowAudio = undefined;
let score = undefined;
let level = undefined;
let field = undefined;
let username = undefined;
let fallingTetramino = undefined;
let nextFallingTetramino = undefined;
let fallTimeout = undefined;
let leftInterval = undefined;
let rightInterval = undefined;
let fallInterval = undefined;
let updateInterval = undefined;

class Block {
    constructor(occupied = false, color = "white") {
        this.occupied = occupied;
        this.color = color;
    }
}

class Field {
    constructor(size = new Size()) {
        this.size = new Size(size.x, size.y);
        this.rows = new Array(this.size.y);

        for (let y = 0; y < this.size.y; ++y) {
            this.rows[y] = new Array(this.size.x);
            for (let x = 0; x < this.size.x; ++x) {
                this.rows[y][x] = new Block();
            }
        }
    }

    getBlock(x, y) {
        if (x < 0 || y < 0 || x >= field.size.x || y >= field.size.y) {
            return undefined;
        }

        return this.rows[y][x];
    }

    setBlock(x, y, value) {
        if (x < 0 || y < 0 || x >= field.size.x || y >= field.size.y) {
            return false;
        }

        this.rows[y][x] = value;

        return true;
    }
}

class Tetramino {
    constructor(type = 0, position = new Position(), color = getRandomColor()) {
        this.type = type
        this.position = new Position(position.x, position.y);
        this.color = color;

        switch (type) {
            case 0:
                this.offsets = [new Offset(0, 0),
                                new Offset(1, 0),
                                new Offset(-1, 0),
                                new Offset(0, -1)];
                break;
            case 1:
                this.offsets = [new Offset(0, 0),
                                new Offset(0, -1),
                                new Offset(0, 1),
                                new Offset(1, 1)];
                break;
            case 2:
                this.offsets = [new Offset(0, 0),
                                new Offset(1, 0),
                                new Offset(-1, 0),
                                new Offset(2, 0)];
                break;
            case 3:
                this.offsets = [new Offset(0, 0),
                                new Offset(1, 1),
                                new Offset(1, 0),
                                new Offset(0, 1)];
                break;
            case 4:
                this.offsets = [new Offset(0, 0),
                                new Offset(0, -1),
                                new Offset(1, 0),
                                new Offset(1, 1)];
                break;
            case 5:
                this.offsets = [new Offset(0, 0),
                                new Offset(0, -1),
                                new Offset(-1, 0),
                                new Offset(-1, 1)];
                break;
            case 6:
                this.offsets = [new Offset(0, 0),
                                new Offset(0, -1),
                                new Offset(0, 1),
                                new Offset(-1, 1)];
                break;
            default:
                this.offsets = undefined;
        }
    }

    static createRandomTetramino(position) {
        return new Tetramino(random(0, 6), position, getRandomColor());
    }
}

function onPageLoad() {
    score = 0;
    level = 1;
    username = localStorage["tetris.username"];
    document.title = "Tetris Game - " + username;
    document.getElementById("username-span").textContent = username;
    document.getElementById("level-span").textContent = level;

    setFallTimeout();

    fallAudio = new Audio("/audio/fell.mp3");
    rowAudio = new Audio("/audio/row.mp3");
    field = new Field(new Size(10, 20 + tetraminoSpawnZoneSizeY));
    fallingTetramino = Tetramino.createRandomTetramino(new Position(Math.round(field.size.x / 2), 1));
    nextFallingTetramino = Tetramino.createRandomTetramino(new Position(Math.round(field.size.x / 2), 1));
    fallInterval = setInterval(onTetraminoFall, fallTimeout);
    updateInterval = setInterval(onUpdate, updateTimeout);

    onUpdate();
}

function setFallTimeout() {
    fallTimeout = 1000 * (1 / Math.sqrt(level));
}

function updateScore(value) {
    score = value;

    if (score > level * 100) {
        ++level;
        document.getElementById("level-span").textContent = level;
    }

    document.getElementById("score-span").textContent = score;
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getColor(type) {
    return blockColors[type];
}

function getRandomColor() {
    return getColor(random(0, blockColors.length - 1));
}

function rotateTetramino(tetramino, angle) {
    angle = angle % 360;

    if (angle === 0 || tetramino.type === 3) {
        return;
    }

    for (let i = 0; i < tetramino.offsets.length; ++i) {
        const offset = tetramino.offsets[i];
        let temp;

        if (angle === -90 || angle === 270) {
            temp = offset.y;
            offset.y = offset.x * -1;
            offset.x = temp;
        } else if (angle === 90 || angle === -270) {
            temp = offset.x;
            offset.x = offset.y * -1;
            offset.y = temp;
        } else if (angle === 180 || angle === -180) {
            offset.x = offset.x * -1;
            offset.y = offset.y * -1;
        } else {
            throw "Unsupported angle";
        }
    }
}

function placeTetramino() {
    for (let i = 0; i < fallingTetramino.offsets.length; ++i) {
        const offset = fallingTetramino.offsets[i];
        const blockX = fallingTetramino.position.x + offset.x;
        const blockY = fallingTetramino.position.y + offset.y;

        field.getBlock(blockX, blockY).occupied = true;
        field.getBlock(blockX, blockY).color = fallingTetramino.color;
    }

    fallAudio.play();
    checkRowsFullness();
}

function selectNextTetramino() {
    fallingTetramino = nextFallingTetramino;
    nextFallingTetramino = Tetramino.createRandomTetramino(new Position(Math.round(field.size.x / 2), 1));
}

function onUpdate() {
    clearScene();
    drawScene();
    drawFallingTetramino();
    drawNextFallingTetramino();
}

function clearScene(canvasId = "game") {
    const canvas = document.getElementById(canvasId);
    if (canvas.getContext) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    }
}

function drawSquare(x, y, width, height, fillStyle = "white", strokeStyle = "black", canvasId = "game") {
    const canvas = document.getElementById(canvasId);
    if (canvas.getContext) {
        let context = canvas.getContext("2d");

        context.strokeStyle = strokeStyle;
        context.fillStyle = fillStyle;

        context.fillRect(x, y, width, height);
        context.strokeRect(x, y, width, height);
    }
}

function drawScene() {
    for (let y = tetraminoSpawnZoneSizeY; y < field.size.y; ++y) {
        for (let x = 0; x < field.size.x; ++x) {
            drawSquare(x * blockSize.x + 0.5, (y - tetraminoSpawnZoneSizeY) * blockSize.y + 0.5,
                blockSize.x, blockSize.y, field.getBlock(x, y).color);
        }
    }
}

function drawFallingTetramino() {
    for (let i = 0; i < fallingTetramino.offsets.length; ++i) {
        const offset = fallingTetramino.offsets[i];
        drawSquare(blockSize.x * (fallingTetramino.position.x + offset.x) + 0.5,
            blockSize.y * (fallingTetramino.position.y + offset.y - tetraminoSpawnZoneSizeY ) + 0.5,
            blockSize.x, blockSize.y, fallingTetramino.color);
    }
}

function drawNextFallingTetramino() {
    for (let y = 0; y < 3; ++y) {
        for (let x = 0; x < 4; ++x) {
            let div = document.getElementById(`square${x}${y}`);
            div.style.backgroundColor = "white";
        }
    }

    for (let i = 0; i < nextFallingTetramino.offsets.length; ++i) {
        const offset = nextFallingTetramino.offsets[i];
        const squareX = offset.x + 1;
        const squareY = offset.y + 1;
        let div = document.getElementById(`square${squareX}${squareY}`);
        div.style.backgroundColor = nextFallingTetramino.color;
    }
}

function getTetraminoOutOfScreenSide() {
    let sides = [];

    for (let i = 0; i < fallingTetramino.offsets.length; ++i) {
        const offset = fallingTetramino.offsets[i];
        const blockX = fallingTetramino.position.x + offset.x;
        const blockY = fallingTetramino.position.y + offset.y;

        if (blockX < 0) {
            sides.push("left");
        } else if (blockX >= field.size.x) {
            sides.push("right");
        } else if (blockY >= field.size.y) {
            sides.push("bottom");
        } else if (blockY < 0) {
            sides.push("top");
        }
    }

    if (sides.includes("bottom")) {
        return "bottom";
    } else if (sides.includes("left")) {
        return "left";
    } else if (sides.includes("right")) {
        return "right";
    } else if (sides.includes("top")) {
        return "top";
    }

    return "none";
}

function isTetraminoCollided() {
    for (let i = 0; i < fallingTetramino.offsets.length; ++i) {
        const offset = fallingTetramino.offsets[i];
        const blockX = fallingTetramino.position.x + offset.x;
        const blockY = fallingTetramino.position.y + offset.y;
        const block = field.getBlock(blockX, blockY);

        if (block === undefined || field.rows[blockY][blockX].occupied) {
            return true;
        }
    }

    return false;
}

function isTetraminoLanded() {
    for (let i = 0; i < fallingTetramino.offsets.length; ++i) {
        const offset = fallingTetramino.offsets[i];
        const blockX = fallingTetramino.position.x + offset.x;
        const blockY = fallingTetramino.position.y + offset.y + 1;
        const block = field.getBlock(blockX, blockY);

        if (block === undefined || field.rows[blockY][blockX].occupied) {
            return true;
        }
    }

    return false;
}

function isTetraminoInSpawnZone() {
    for (let i = 0; i < fallingTetramino.offsets.length; ++i) {
        const offset = fallingTetramino.offsets[i];
        const blockY = fallingTetramino.position.y + offset.y;

        if (blockY < tetraminoSpawnZoneSizeY) {
            return true;
        }
    }

    return false;
}

function tryMoveFallingTetramino(direction = undefined) {
    let previousPosition = new Position(fallingTetramino.position.x, fallingTetramino.position.y);

    switch (direction) {
        case "up":
            fallingTetramino.position.y -= 1;
            break;
        case "down":
            fallingTetramino.position.y += 1;
            break;
        case "left":
            fallingTetramino.position.x -= 1;
            break;
        case "right":
            fallingTetramino.position.x += 1;
            break;
        default:
            return;
    }

    if (getTetraminoOutOfScreenSide() !== "none" || isTetraminoCollided()) {
        fallingTetramino.position = previousPosition;

        if (isTetraminoLanded()) {
            if (isTetraminoInSpawnZone()) {
                endGame();
            } else {
                placeTetramino(fallingTetramino);
                selectNextTetramino();
            }
        }
    }
}

function tryRotateFallingTetramino(angle) {
    let previousOffsets = new Array(fallingTetramino.offsets.length);

    for (let i = 0; i < fallingTetramino.offsets.length; ++i) {
        const offset = fallingTetramino.offsets[i];
        previousOffsets[i] = new Offset(offset.x, offset.y);
    }

    rotateTetramino(fallingTetramino, angle);

    if (getTetraminoOutOfScreenSide() !== "none" || isTetraminoCollided()) {
        fallingTetramino.offsets = previousOffsets;

        if (isTetraminoLanded()) {
            if (isTetraminoInSpawnZone()) {
                endGame();
            } else {
                placeTetramino(fallingTetramino);
                selectNextTetramino();
            }
        }
    }
}

function downRows(rowY) {
    rowY = Math.min(rowY, field.size.y - 1);

    for (let y = rowY - 1; y >= 0; --y) {
        for (let x = 0; x < field.size.x; ++x) {
            field.getBlock(x, y + 1).color = field.getBlock(x, y).color;
            field.getBlock(x, y + 1).occupied = field.getBlock(x, y).occupied;
        }
    }

    for (let x = 0; x < field.size.x; ++x) {
        field.setBlock(x, 0, new Block());
    }
}

function checkRowsFullness() {
    let fullRowsCount = 0;

    for (let y = 0; y < field.size.y; ++y) {
        let occupiedBlockCount = 0;

        for (let x = 0; x < field.size.x; ++x) {
            if (field.getBlock(x, y).occupied) {
                ++occupiedBlockCount;
            }
        }

        if (occupiedBlockCount === field.size.x) {
            downRows(y);
            ++fullRowsCount;
            updateScore(score + fullRowsCount * field.size.x);
            rowAudio.play();
        }
    }
}

function endGame() {
    gameOver = true;

    onUpdate();
    clearInterval(updateInterval);
    clearInterval(rightInterval);
    clearInterval(leftInterval);
    clearInterval(fallInterval);

    alert("Game over!");

    let records = (window.localStorage["tetris.records"])? JSON.parse(window.localStorage["tetris.records"]) : {};
    if (!records[`${username}`] || records[`${username}`] < score) {
        records[`${username}`] = score;
    }
    window.localStorage["tetris.records"] = JSON.stringify(records);
    document.location.href = "https://localhost/records.html";
}

function onTetraminoFall() {
    tryMoveFallingTetramino("down");
}

function onMoveRight() {
    tryMoveFallingTetramino("right");
}

function onMoveLeft() {
    tryMoveFallingTetramino("left");
}

// Button press handler
document.addEventListener('keydown', (event) => {
    if (gameOver) {
        return;
    }

    if (event.code === "KeyS" && !fallKeyPressed) {
        fallKeyPressed = true;
        onTetraminoFall();
        clearInterval(fallInterval);
        fallInterval = setInterval(onTetraminoFall, 40);
    } else if (event.code === "KeyD" && !rightKeyPressed) {
        rightKeyPressed = true;
        onMoveRight();
        rightInterval = setInterval(onMoveRight, leftRightTimeout)
    } else if (event.code === "KeyA" && !leftKeyPressed) {
        leftKeyPressed = true;
        onMoveLeft();
        leftInterval = setInterval(onMoveLeft, leftRightTimeout);
    } else if (event.code === "KeyQ" && !keyPressed) {
        keyPressed = true;
        tryRotateFallingTetramino(-90);
    } else if (event.code === "KeyE" && !keyPressed) {
        keyPressed = true;
        tryRotateFallingTetramino(90);
    }
});

// Button release handler
document.addEventListener('keyup', (event) => {
    if (gameOver) {
        return;
    }

    if (event.code === "KeyS" && fallKeyPressed) {
        fallKeyPressed = false;
        clearInterval(fallInterval);
        fallInterval = setInterval(onTetraminoFall, fallTimeout);
    } else if (event.code === "KeyD" && rightKeyPressed) {
        rightKeyPressed = false;
        clearInterval(rightInterval);
    } else if (event.code === "KeyA" && leftKeyPressed) {
        leftKeyPressed = false;
        clearInterval(leftInterval);
    } else if (event.code === "KeyQ" || event.code === "KeyE") {
        keyPressed = false;
    }
});