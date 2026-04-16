var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var scoreText = document.getElementById("tocke");
var timeText = document.getElementById("cas");
var livesText = document.getElementById("zivljenja");
var startBtn = document.getElementById("start-btn");
var restartBtn = document.getElementById("restart-btn");
var navodilaBtn = document.getElementById("navodila-btn");
var vizitkaBtn = document.getElementById("vizitka-btn");
var popup = document.getElementById("popup");
var popupTitle = document.getElementById("popup-title");
var popupText = document.getElementById("popup-text");
var popupClose = document.getElementById("popup-close");
var messageBox = document.getElementById("message-box");
var activePopup = "";
var pausedForPopup = false;

var WIDTH = canvas.width;
var HEIGHT = canvas.height;

var x;
var y;
var dx;
var dy;
var r = 10;

var paddlex;
var paddleh;
var paddlew;
var paddleSpeed;

var rightDown = false;
var leftDown = false;

var bricks;
var NROWS = 5;
var NCOLS = 8;
var BRICKWIDTH;
var BRICKHEIGHT = 25;
var PADDING = 8;
var BRICKTOP = 50;
var BRICKLEFT = 18;

var rowcolors = ["#ff7b72", "#ffb86b", "#ffd866", "#8be9fd", "#bd93f9"];
var stars = [];

var tocke = 0;
var zivljenja = 3;
var sekunde = 0;

var intervalId = null;
var timerId = null;
var running = false;
var finished = false;

function initStars() {
    stars = [];

    for (var i = 0; i < 70; i++) {
        stars.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT,
            size: Math.random() * 2 + 1
        });
    }
}

function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

function rect(x, y, w, h) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
    ctx.fill();
}

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function updateHud() {
    scoreText.textContent = tocke;
    livesText.textContent = zivljenja;
}

function updateTimer() {
    var minute = Math.floor(sekunde / 60);
    var sek = sekunde % 60;

    if (minute < 10) {
        minute = "0" + minute;
    }

    if (sek < 10) {
        sek = "0" + sek;
    }

    timeText.textContent = minute + ":" + sek;
}

function showMessage(text) {
    messageBox.textContent = text;
    messageBox.classList.remove("hidden");
}

function hideMessage() {
    messageBox.classList.add("hidden");
}

function isPopupOpen() {
    return !popup.classList.contains("hidden");
}

function pauseGameForPopup() {
    if (!running) {
        return;
    }

    running = false;
    pausedForPopup = true;
    rightDown = false;
    leftDown = false;

    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

function resumeGameAfterPopup() {
    if (!pausedForPopup || finished) {
        pausedForPopup = false;
        return;
    }

    pausedForPopup = false;
    running = true;

    if (intervalId !== null) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(draw, 10);
}

function closePopup(resumeGame) {
    popup.classList.add("hidden");
    activePopup = "";

    if (resumeGame === false) {
        pausedForPopup = false;
        return;
    }

    resumeGameAfterPopup();
}

function showPopup(name, title, text) {
    if (!isPopupOpen()) {
        pauseGameForPopup();
    }

    popupTitle.textContent = title;
    popupText.innerHTML = text;
    popup.classList.remove("hidden");
    activePopup = name;
}

function initPaddle() {
    paddlew = 120;
    paddleh = 14;
    paddleSpeed = 7;
    paddlex = (WIDTH - paddlew) / 2;
}

function initBall() {
    x = WIDTH / 2;
    y = HEIGHT - 70;
    dx = 2;
    dy = -3;
}

function initBricks() {
    BRICKWIDTH = (WIDTH - (BRICKLEFT * 2) - ((NCOLS - 1) * PADDING)) / NCOLS;
    bricks = new Array(NROWS);

    for (var i = 0; i < NROWS; i++) {
        bricks[i] = new Array(NCOLS);
        for (var j = 0; j < NCOLS; j++) {
            bricks[i][j] = 1;
        }
    }
}

function resetGame() {
    tocke = 0;
    zivljenja = 3;
    sekunde = 0;
    running = false;
    finished = false;

    initPaddle();
    initBall();
    initBricks();
    initStars();
    updateHud();
    updateTimer();
    drawScene();
    showMessage("Klikni Start za zacetek igre.");
}

function startTimer() {
    if (timerId !== null) {
        clearInterval(timerId);
    }

    timerId = setInterval(function () {
        if (running) {
            sekunde += 1;
            updateTimer();
        }
    }, 1000);
}

function startGame() {
    if (running) {
        return;
    }

    if (finished) {
        resetGame();
    }

    running = true;
    hideMessage();

    if (intervalId !== null) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(draw, 10);
    startTimer();
}

function stopGame(text) {
    running = false;
    finished = true;

    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }

    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }

    showMessage(text);
}

function loseLife() {
    zivljenja -= 1;
    updateHud();

    if (zivljenja <= 0) {
        stopGame("Konec igre. Klikni Start ali Restart.");
        return;
    }

    initBall();
    initPaddle();
}

function drawBricks() {
    for (var i = 0; i < NROWS; i++) {
        ctx.fillStyle = rowcolors[i];

        for (var j = 0; j < NCOLS; j++) {
            if (bricks[i][j] === 1) {
                var brickX = BRICKLEFT + j * (BRICKWIDTH + PADDING);
                var brickY = BRICKTOP + i * (BRICKHEIGHT + PADDING);
                rect(brickX, brickY, BRICKWIDTH, BRICKHEIGHT);
            }
        }
    }
}

function checkBrickHit() {
    var rowheight = BRICKHEIGHT + PADDING;
    var colwidth = BRICKWIDTH + PADDING;
    var row = Math.floor((y - BRICKTOP) / rowheight);
    var col = Math.floor((x - BRICKLEFT) / colwidth);

    if (row >= 0 && row < NROWS && col >= 0 && col < NCOLS && bricks[row][col] === 1) {
        var brickX = BRICKLEFT + col * (BRICKWIDTH + PADDING);
        var brickY = BRICKTOP + row * (BRICKHEIGHT + PADDING);

        if (x > brickX && x < brickX + BRICKWIDTH && y > brickY && y < brickY + BRICKHEIGHT) {
            bricks[row][col] = 0;
            dy = -dy;
            tocke += 1;
            scoreText.textContent = tocke;

            if (tocke === NROWS * NCOLS) {
                stopGame("Zmagal si. Razbil si vse opeke.");
                showVictoryPopup();
            }
        }
    }
}

function movePaddle() {
    if (rightDown) {
        paddlex += paddleSpeed;
        if (paddlex + paddlew > WIDTH) {
            paddlex = WIDTH - paddlew;
        }
    }

    if (leftDown) {
        paddlex -= paddleSpeed;
        if (paddlex < 0) {
            paddlex = 0;
        }
    }
}

function drawScene() {
    clear();

    ctx.fillStyle = "#050915";
    rect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    for (var i = 0; i < stars.length; i++) {
        circle(stars[i].x, stars[i].y, stars[i].size);
    }

    ctx.fillStyle = "rgba(70, 96, 180, 0.22)";
    circle(770, 110, 70);
    ctx.fillStyle = "rgba(173, 216, 255, 0.25)";
    circle(820, 150, 28);

    drawBricks();

    ctx.fillStyle = "#9fb4ff";
    rect(paddlex, HEIGHT - paddleh - 10, paddlew, paddleh);

    ctx.fillStyle = "#fff1a8";
    circle(x, y, r);
}

function draw() {
    movePaddle();
    drawScene();

    checkBrickHit();

    if (x + dx > WIDTH - r || x + dx < r) {
        dx = -dx;
    }

    if (y + dy < r) {
        dy = -dy;
    } else if (y + dy > HEIGHT - paddleh - 10 - r) {
        if (x > paddlex && x < paddlex + paddlew) {
            dx = 6 * ((x - (paddlex + paddlew / 2)) / paddlew);
            dy = -dy;
        } else if (y + dy > HEIGHT - r) {
            loseLife();
            return;
        }
    }

    x += dx;
    y += dy;
}

function showNavodila() {
    if (activePopup === "navodila" && isPopupOpen()) {
        closePopup();
        return;
    }

    showPopup("navodila", "Navodila", "" +
        "<p><strong>Cilj:</strong> razbij vse vesoljske opeke, preden izgubiš vsa življenja.</p>" +
        "<p><strong>Start:</strong> klikni Start, da se igra zacne. Restart postavi igro nazaj na zacetek.</p>" +
        "<p><strong>Premikanje:</strong> ploščico premikas z levo in desno puščico na tipkovnici.</p>" +
        "<p><strong>Kako se igra:</strong> žogica se odbija od sten, ploščice in opek. Ko zadene opeko, dobis točko.</p>" +
        "<p><strong>Življenja:</strong> če zogica pade mimo ploščice, izgubiš eno življenje. Na zacetku imas 3 življenja.</p>" +
        "<p><strong>Namig:</strong> če žogico odbijes z robom ploščice, ji bolj spremenis smer.</p>");
}

function showVizitka() {
    if (activePopup === "vizitka" && isPopupOpen()) {
        closePopup();
        return;
    }

    showPopup("vizitka", "Vizitka", "" +
        "<p><strong>Ime:</strong> Matija Vidmar</p>" +
        "<p><strong>Razred:</strong> 4.RA</p>" +
        "<p><strong>Projekt:</strong> Brickverse</p>" +
        "<p><strong>Tema:</strong> vesolje, zvezde in planeti.</p>");
}

function showVictoryPopup() {
    showPopup("zmaga", "Zmaga!", "" +
        "<p><strong>Bravo!</strong> Razbil si vse opeke in zmagal igro.</p>" +
        "<p><strong>Tocke:</strong> " + tocke + "</p>" +
        "<p><strong>Cas:</strong> " + timeText.textContent + "</p>" +
        "<p><strong>Preostala zivljenja:</strong> " + zivljenja + "</p>" +
        "<button id=\"popup-restart\" class=\"popup-action\">Igraj znova</button>");
}

function onKeyDown(evt) {
    if (evt.key === "Escape" && isPopupOpen()) {
        closePopup();
        return;
    }

    if (isPopupOpen()) {
        return;
    }

    if (evt.key === "ArrowRight") {
        rightDown = true;
    } else if (evt.key === "ArrowLeft") {
        leftDown = true;
    }
}

function onKeyUp(evt) {
    if (evt.key === "ArrowRight") {
        rightDown = false;
    } else if (evt.key === "ArrowLeft") {
        leftDown = false;
    }
}

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", function () {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }

    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }

    resetGame();
    closePopup(false);
});

navodilaBtn.addEventListener("click", showNavodila);
vizitkaBtn.addEventListener("click", showVizitka);
popupClose.addEventListener("click", function () {
    closePopup();
});

popup.addEventListener("click", function (evt) {
    if (evt.target === popup) {
        closePopup();
    }

    if (evt.target.id === "popup-restart") {
        closePopup(false);
        resetGame();
    }
});

resetGame();
