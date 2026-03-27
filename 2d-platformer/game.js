// ============================================
// 2D Platformer - Learning Project
// ============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Player ---
const player = {
    x: 50,
    y: 300,
    width: 32,
    height: 32,
    velX: 0,
    velY: 0,
    speed: 4,
    jumpForce: -10,
    grounded: false,
    color: "#e94560"
};

// --- Physics ---
const gravity = 0.5;
const friction = 0.8;

// --- Platforms ---
const platforms = [
    // Ground
    { x: 0, y: 468, width: 800, height: 32, color: "#0f3460" },
    // Floating platforms
    { x: 150, y: 370, width: 120, height: 16, color: "#533483" },
    { x: 350, y: 300, width: 120, height: 16, color: "#533483" },
    { x: 550, y: 230, width: 120, height: 16, color: "#533483" },
    { x: 300, y: 160, width: 120, height: 16, color: "#533483" },
    { x: 80,  y: 100, width: 120, height: 16, color: "#533483" }
];

// --- Input ---
const keys = {};

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// --- Collision Detection ---
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// --- Update ---
function update() {
    // Horizontal movement (Arrow keys + WASD)
    if (keys["ArrowLeft"] || keys["a"]) {
        player.velX = -player.speed;
    } else if (keys["ArrowRight"] || keys["d"]) {
        player.velX = player.speed;
    } else {
        player.velX *= friction;
    }

    // Jumping (Arrow Up, W, or Space)
    if ((keys["ArrowUp"] || keys["w"] || keys[" "]) && player.grounded) {
        player.velY = player.jumpForce;
        player.grounded = false;
    }

    // Apply gravity
    player.velY += gravity;

    // Move player horizontally
    player.x += player.velX;

    // Check horizontal collisions
    for (const platform of platforms) {
        if (isColliding(player, platform)) {
            if (player.velX > 0) {
                player.x = platform.x - player.width;
            } else if (player.velX < 0) {
                player.x = platform.x + platform.width;
            }
            player.velX = 0;
        }
    }

    // Move player vertically
    player.y += player.velY;

    // Check vertical collisions
    player.grounded = false;
    for (const platform of platforms) {
        if (isColliding(player, platform)) {
            if (player.velY > 0) {
                // Landing on top
                player.y = platform.y - player.height;
                player.grounded = true;
            } else if (player.velY < 0) {
                // Hitting from below
                player.y = platform.y + platform.height;
            }
            player.velY = 0;
        }
    }

    // Keep player in bounds (left/right)
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Reset if player falls off screen
    if (player.y > canvas.height + 50) {
        player.x = 50;
        player.y = 300;
        player.velX = 0;
        player.velY = 0;
    }
}

// --- Draw ---
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    for (const platform of platforms) {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw instructions
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    ctx.fillText("Arrow Keys / WASD to move  |  Space / Up / W to jump", 140, 20);
}

// --- Game Loop ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
