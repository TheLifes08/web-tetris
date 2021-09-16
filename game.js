const blockX = 30;
const blockY = 30;
const blockColors = ["red", "green", "blue", "yellow"]

let keyPressed = false;
let fallKeyPressed = false;
let leftKeyPressed = false;
let rightKeyPressed = false;
let field = {
    size: {x: 0, y: 0},
    rows: [],
    object: undefined,
    nextObject: undefined
};

let leftInterval = undefined;
let rightInterval = undefined;
let fallInterval = setInterval(onLowerFigure, 500);

setInterval(onUpdate, 50);

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getColor(type) {
    if (type >= 0 && type < blockColors.length) {
        return blockColors[type];
    } else {
        return undefined;
    }
}

function createFigure(type) {
    switch (type) {
        case 0:
            return {offsets: [{x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: -1}]};
        case 1:
            return {offsets: [{x: 0, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}, {x: 1, y: 1}]};
        case 2:
            return {offsets: [{x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 0}, {x: 2, y: 0}]};
        case 3:
            return {offsets: [{x: 0, y: 0}, {x: 1, y: 1}, {x: 1, y: 0}, {x: 0, y: 1}]};
        case 4:
            return {offsets: [{x: 0, y: 0}, {x: 0, y: -1}, {x: 1, y: 0}, {x: 1, y: 1}]};
        case 5:
            return {offsets: [{x: 0, y: 0}, {x: 0, y: -1}, {x: -1, y: 0}, {x: -1, y: 1}]};
        case 6:
            return {offsets: [{x: 0, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 1}]};
        default:
            return undefined;
    }
}

function createRandomObject() {
    let object = {
        position: {x: random(2, field.size.x - 3), y: -1},
        color: getColor(random(0, 3)),
        figure: createFigure(random(0, 6))
    };

    switch (random(1, 4)) {
        case 1:
            rotateObject(object, "left");
            rotateObject(object, "left");
            break;
        case 2:
            rotateObject(object, "right");
            break;
        case 3:
            rotateObject(object, "left");
            break;
    }

    return object;
}

function rotateObject(object, direction) {
    for (let i = 0; i < object.figure.offsets.length; ++i) {
        let offset = object.figure.offsets[i];
        if (direction === "left") {
            let temp = offset.x * -1;
            offset.x = offset.y;
            offset.y = temp;
        } else if (direction === "right") {
            let temp = offset.x;
            offset.x = offset.y * -1;
            offset.y = temp;
        }
    }
}

function copyObject(object) {
    let clone = {
        position: {x: object.position.x, y: object.position.y},
        color: object.color,
        figure: {offsets: []}
    };

    for (let i = 0; i < object.figure.offsets.length; ++i) {
        let position = {x: 0, y: 0};
        position.x = object.figure.offsets[i].x;
        position.y = object.figure.offsets[i].y;
        clone.figure.offsets.push(position);
    }

    return clone;
}

function placeObject() {
    for (let i = 0; i < field.object.figure.offsets.length; ++i) {
        let offset = field.object.figure.offsets[i];
        let blockX = field.object.position.x + offset.x;
        let blockY = field.object.position.y + offset.y;

        field.rows[blockY][blockX].block = true;
        field.rows[blockY][blockX].color = field.object.color;
    }
}

function nextObject() {
    field.object = field.nextObject;
    field.nextObject = createRandomObject();
}

function onPageLoad() {
    document.title = "Tetris Game - " + localStorage["tetris.username"];
    document.getElementById("username-span").textContent = localStorage["tetris.username"];

    field.size.x = 10;
    field.size.y = 20;
    field.object = createRandomObject();
    field.nextObject = createRandomObject();
    field.rows = new Array(field.size.y);

    for (let y = 0; y < field.size.y; ++y) {
        field.rows[y] = new Array(field.size.x);
        for (let x = 0; x < field.size.x; ++x) {
            field.rows[y][x] = {color: "white", block: false};
        }
    }

    onUpdate();
}

function onUpdate() {
    clearScene();
    drawScene();
    drawObject();
    drawNextFigure();
}

function getFigureOutOfScreenSide() {
    for (let i = 0; i < field.object.figure.offsets.length; ++i) {
        let offset = field.object.figure.offsets[i];
        let blockX = field.object.position.x + offset.x;
        let blockY = field.object.position.y + offset.y;

        if (blockX < 0) {
            return "left";
        } else if (blockX >= field.size.x) {
            return "right";
        } else if (blockY >= field.size.y) {
            return "bottom";
        }
    }

    return "none";
}

function getFigureCollided() {
    for (let i = 0; i < field.object.figure.offsets.length; ++i) {
        let offset = field.object.figure.offsets[i];
        let blockX = field.object.position.x + offset.x;
        let blockY = field.object.position.y + offset.y;

        if (field.rows[blockY] !== undefined &&
            field.rows[blockY][blockX] !== undefined &&
            field.rows[blockY][blockX].block) {
            return true;
        }
    }

    return false;
}

function onLowerFigure() {
    field.object.position.y += 1;

    if (getFigureOutOfScreenSide() === "bottom" || getFigureCollided()) {
        field.object.position.y -= 1;

        placeObject();
        nextObject();
    }

    console.log(field.object)
}

function clearScene(canvasId = "game") {
    const canvas = document.getElementById(canvasId);
    if (canvas.getContext) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    }
}

function drawScene() {
    for (let y = 0; y < field.size.y; ++y) {
        for (let x = 0; x < field.size.x; ++x) {
            const block = field.rows[y][x];
            drawSquare(x * blockX + 0.5, y * blockY + 0.5, blockX, blockY, block.color);
        }
    }
}

function drawObject() {
    for (let i = 0; i < field.object.figure.offsets.length; ++i) {
        const offset = field.object.figure.offsets[i];
        drawSquare(blockX * (field.object.position.x + offset.x) + 0.5,
            blockY * (field.object.position.y + offset.y) + 0.5, blockX, blockY, field.object.color);
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

function drawNextFigure() {
    clearScene("next-figure-canvas");

    for (let i = 0; i < field.nextObject.figure.offsets.length; ++i) {
        const offset = field.nextObject.figure.offsets[i];
        drawSquare(blockX * (offset.x + 2) + 0.5,
            blockY * (offset.y + 2) + 0.5,
            blockX,
            blockY,
            field.nextObject.figure.color,
            "black",
            "next-figure-canvas");
    }
}

document.addEventListener('keydown', (event) => {
    if (keyPressed) {
        return;
    }

    keyPressed = true;

    const prevPos = {x: 0, y: 0};
    const prevOffsets = [];
    prevPos.x = field.object.position.x;
    prevPos.y = field.object.position.y;
    for (let i = 0; i < field.object.figure.offsets.length; ++i) {
        let offsetCopy = {x: 0, y: 0};
        let offset = field.object.figure.offsets[i];
        offsetCopy.x = offset.x;
        offsetCopy.y = offset.y;
        prevOffsets.push(offsetCopy);
    }

    if (event.key === "s") {
        fallKeyPressed = true;
        clearInterval(fallInterval.valueOf());
        fallInterval = setInterval(onLowerFigure, 50);
    } else if (event.key === "d") {
        leftInterval = setInterval()
        field.object.position.x += 1;
    } else if (event.key === "a") {
        field.object.position.x -= 1;
    } else if (event.key === "q") {
        rotateObject(field.object, "left");
    } else if (event.key === "e") {
        rotateObject(field.object, "right");
    }

    if (getFigureOutOfScreenSide() !== "none" || getFigureCollided()) {
        field.object.position = prevPos;
        field.object.figure.offsets = prevOffsets;
    }
});

document.addEventListener('keyup', (event) => {
    if (keyPressed) {
        keyPressed = false;

        if (fallKeyPressed) {
            fallKeyPressed = false;
            clearInterval(fallInterval.valueOf());
            fallInterval = setInterval(onLowerFigure, 500);
        }
    }
});