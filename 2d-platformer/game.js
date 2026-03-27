// ============================================
// 2D Platformer - Learning Project
// ============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Camera ---
const camera = {
    y: 0,        // world Y offset (negative = scrolled up)
    targetY: 0,
    smoothing: 0.08
};

// --- Player ---
const player = {
    x: 50,
    y: 300,
    width: 22,
    height: 40,
    velX: 0,
    velY: 0,
    speed: 2.5,
    jumpForce: -10,
    grounded: false,
    facing: 1, // 1 = right, -1 = left
    highestY: 300 // tracks highest point reached
};

// --- Physics ---
const gravity = 0.35;
const friction = 0.8;

// --- Platforms ---
// Each platform can optionally have: moving, moveSpeed, moveMin, moveMax
const platforms = [
    // Ground
    { x: 28, y: 468, width: 744, height: 32 },
    // Starting floating platforms
    { x: 150, y: 370, width: 120, height: 16 },
    { x: 350, y: 300, width: 120, height: 16, moving: true, moveSpeed: 0.5, moveMin: 280, moveMax: 520 },
    { x: 550, y: 230, width: 120, height: 16 },
    { x: 300, y: 160, width: 120, height: 16, moving: true, moveSpeed: 0.4, moveMin: 200, moveMax: 450 },
    { x: 80,  y: 100, width: 120, height: 16 }
];

// Track the highest (lowest Y value) platform generated so far
let highestPlatformY = 100;

// --- Wall Settings ---
const wallWidth = 28;

// --- Level Themes (based on height, Y goes negative as you climb) ---
const levelThemes = [
    { // Level 1: Dirt & Grass (starting area, y > -500)
        minY: -500,
        wallBase: "#6B4226",
        wallHighlight: "#8B5E3C",
        wallDetail: "#5A3518",
        wallAccent: "#4E8B3C",
        brickH: 20,
        brickOffset: 14,
        name: "Forest",
        bgTop: "#1B4332",
        bgBottom: "#2D6A4F",
        particles: "leaves",
        platBase: "#8B5E3C",
        platHighlight: "rgba(255,220,170,0.45)",
        platShadow: "rgba(0,0,0,0.3)",
        platGrain: "rgba(90,50,20,0.25)",
        platDivider: "rgba(60,30,10,0.35)",
        platBorder: "rgba(60,30,10,0.5)",
        platTopDecor: "#4E8B3C",  // grass on top
        platStyle: "wood"
    },
    { // Level 2: Stone Cave (y -500 to -1500)
        minY: -1500,
        wallBase: "#5A5A6E",
        wallHighlight: "#7A7A8E",
        wallDetail: "#3E3E50",
        wallAccent: "#48485A",
        brickH: 24,
        brickOffset: 14,
        name: "Cave",
        bgTop: "#1a1a2e",
        bgBottom: "#16213e",
        particles: "dust",
        platBase: "#5A5A6E",
        platHighlight: "rgba(140,140,170,0.4)",
        platShadow: "rgba(0,0,0,0.4)",
        platGrain: "rgba(40,40,60,0.3)",
        platDivider: "rgba(30,30,50,0.4)",
        platBorder: "rgba(30,30,50,0.6)",
        platTopDecor: null,
        platStyle: "stone"
    },
    { // Level 3: Ice (y -1500 to -3000)
        minY: -3000,
        wallBase: "#A0D2DB",
        wallHighlight: "#D0EFF5",
        wallDetail: "#6BB5C5",
        wallAccent: "#E8F8FF",
        brickH: 18,
        brickOffset: 9,
        name: "Ice",
        bgTop: "#D6EFF5",
        bgBottom: "#87CEEB",
        particles: "snow",
        platBase: "#A8D8EA",
        platHighlight: "rgba(220,245,255,0.6)",
        platShadow: "rgba(80,140,180,0.3)",
        platGrain: "rgba(100,170,200,0.2)",
        platDivider: "rgba(80,150,180,0.3)",
        platBorder: "rgba(70,130,160,0.5)",
        platTopDecor: null,
        platStyle: "ice"
    },
    { // Level 4: Lava / Hell (y -3000 to -5000)
        minY: -5000,
        wallBase: "#4A2020",
        wallHighlight: "#6E3030",
        wallDetail: "#2E1010",
        wallAccent: "#E85020",
        brickH: 22,
        brickOffset: 11,
        name: "Inferno",
        bgTop: "#1A0000",
        bgBottom: "#3D0C02",
        particles: "embers",
        platBase: "#4A2828",
        platHighlight: "rgba(200,80,30,0.35)",
        platShadow: "rgba(0,0,0,0.5)",
        platGrain: "rgba(120,40,20,0.3)",
        platDivider: "rgba(80,20,10,0.4)",
        platBorder: "rgba(200,60,20,0.5)",
        platTopDecor: "#E85020",  // lava cracks on top
        platStyle: "obsidian"
    },
    { // Level 5: Sky Temple (y < -5000)
        minY: -Infinity,
        wallBase: "#C8B8A0",
        wallHighlight: "#E8DCC8",
        wallDetail: "#A09080",
        wallAccent: "#FFD700",
        brickH: 26,
        brickOffset: 13,
        name: "Sky Temple",
        bgTop: "#FFF8E7",
        bgBottom: "#87CEEB",
        particles: "sparkles",
        platBase: "#E8DCC8",
        platHighlight: "rgba(255,248,230,0.5)",
        platShadow: "rgba(160,140,120,0.3)",
        platGrain: "rgba(180,160,130,0.2)",
        platDivider: "rgba(180,160,130,0.3)",
        platBorder: "rgba(200,170,100,0.6)",
        platTopDecor: "#FFD700",  // gold trim
        platStyle: "marble"
    }
];

function getThemeForY(worldY) {
    for (const theme of levelThemes) {
        if (worldY > theme.minY) return theme;
    }
    return levelThemes[levelThemes.length - 1];
}

// --- Background Particles ---
const bgParticles = [];
const MAX_PARTICLES = 40;

function spawnParticle(theme) {
    const type = theme.particles;
    const p = {
        x: wallWidth + Math.random() * (canvas.width - wallWidth * 2),
        y: camera.y - 10,
        type: type,
        life: 1.0
    };

    if (type === "leaves") {
        p.size = 3 + Math.random() * 4;
        p.vy = 0.3 + Math.random() * 0.5;
        p.vx = (Math.random() - 0.5) * 0.8;
        p.wobble = Math.random() * Math.PI * 2;
        p.color = Math.random() > 0.5 ? "#2D6A4F" : "#52B788";
    } else if (type === "dust") {
        p.size = 1 + Math.random() * 2;
        p.vy = 0.1 + Math.random() * 0.2;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.color = "rgba(200,200,220,0.4)";
    } else if (type === "snow") {
        p.size = 2 + Math.random() * 3;
        p.vy = 0.4 + Math.random() * 0.6;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.wobble = Math.random() * Math.PI * 2;
        p.color = "#FFFFFF";
    } else if (type === "embers") {
        p.size = 2 + Math.random() * 3;
        p.vy = -(0.5 + Math.random() * 1.0); // float upward
        p.vx = (Math.random() - 0.5) * 0.6;
        p.y = camera.y + canvas.height + 10;  // start from bottom
        p.color = Math.random() > 0.5 ? "#FF6600" : "#FFAA00";
    } else if (type === "sparkles") {
        p.size = 1 + Math.random() * 2;
        p.vy = 0.1 + Math.random() * 0.3;
        p.vx = (Math.random() - 0.5) * 0.2;
        p.twinkle = Math.random() * Math.PI * 2;
        p.color = "#FFD700";
    }

    bgParticles.push(p);
}

function updateParticles(theme) {
    // Spawn new particles
    if (bgParticles.length < MAX_PARTICLES && Math.random() < 0.3) {
        spawnParticle(theme);
    }

    // Update existing
    for (let i = bgParticles.length - 1; i >= 0; i--) {
        const p = bgParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.003;

        if (p.wobble !== undefined) p.wobble += 0.05;
        if (p.twinkle !== undefined) p.twinkle += 0.1;

        // Remove if off-screen or dead
        if (p.life <= 0 || p.y > camera.y + canvas.height + 30 || p.y < camera.y - 30) {
            bgParticles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const p of bgParticles) {
        ctx.globalAlpha = Math.max(0, p.life * 0.7);

        if (p.type === "leaves") {
            const offsetX = Math.sin(p.wobble) * 2;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(p.x + offsetX, p.y, p.size, p.size * 0.5, p.wobble, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === "snow") {
            const offsetX = Math.sin(p.wobble) * 1.5;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x + offsetX, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === "embers") {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
            ctx.fill();
            // Glow effect
            ctx.globalAlpha *= 0.3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === "sparkles") {
            const alpha = Math.abs(Math.sin(p.twinkle));
            ctx.globalAlpha = alpha * p.life * 0.8;
            ctx.fillStyle = p.color;
            // Star shape: small cross
            ctx.fillRect(p.x - p.size, p.y - 0.5, p.size * 2, 1);
            ctx.fillRect(p.x - 0.5, p.y - p.size, 1, p.size * 2);
        } else {
            // dust
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;
    }
}

// --- Draw Background ---
function drawBackground(theme) {
    // Gradient background fills the entire canvas (drawn before camera transform)
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, theme.bgTop);
    grad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- Draw Walls ---
function drawWalls() {
    const visibleTop = camera.y - 50;
    const visibleBottom = camera.y + canvas.height + 50;

    // Draw wall in vertical slices, switching theme as needed
    let y = visibleTop;
    while (y < visibleBottom) {
        const theme = getThemeForY(y);
        // We draw row by row using brick pattern
        const brickH = theme.brickH;

        // Align brick rows to world grid
        let brickY = Math.floor(y / brickH) * brickH;

        while (brickY < visibleBottom) {
            const currentTheme = getThemeForY(brickY);
            const row = Math.floor(brickY / brickH);
            const offsetX = (row % 2 === 0) ? 0 : currentTheme.brickOffset;

            // Left wall
            drawWallBrick(0, brickY, wallWidth, brickH, offsetX, currentTheme, true);
            // Right wall
            drawWallBrick(canvas.width - wallWidth, brickY, wallWidth, brickH, offsetX, currentTheme, false);

            brickY += brickH;
        }
        break; // we handle everything in the inner loop
    }
}

function drawWallBrick(wx, wy, w, h, offsetX, theme, isLeft) {
    // Base brick fill
    ctx.fillStyle = theme.wallBase;
    ctx.fillRect(wx, wy, w, h);

    // Highlight (top half of each brick)
    const hlGrad = ctx.createLinearGradient(0, wy, 0, wy + h);
    hlGrad.addColorStop(0, theme.wallHighlight);
    hlGrad.addColorStop(0.5, theme.wallBase);
    hlGrad.addColorStop(1, theme.wallDetail);
    ctx.fillStyle = hlGrad;
    ctx.fillRect(wx, wy, w, h);

    // Mortar lines (horizontal)
    ctx.strokeStyle = theme.wallDetail;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wx, wy + h);
    ctx.lineTo(wx + w, wy + h);
    ctx.stroke();

    // Mortar line (vertical offset for brick pattern)
    ctx.beginPath();
    const vx = wx + offsetX;
    if (vx > wx && vx < wx + w) {
        ctx.moveTo(vx, wy);
        ctx.lineTo(vx, wy + h);
        ctx.stroke();
    }

    // Accent detail (small random-looking marks based on position)
    const seed = Math.abs(Math.floor(wy * 7 + wx * 13)) % 5;
    if (seed === 0) {
        ctx.fillStyle = theme.wallAccent;
        ctx.globalAlpha = 0.35;
        if (isLeft) {
            ctx.fillRect(wx + 4, wy + 3, 6, 4);
        } else {
            ctx.fillRect(wx + w - 10, wy + 3, 6, 4);
        }
        ctx.globalAlpha = 1.0;
    }

    // Inner edge shadow (the edge facing the play area)
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    if (isLeft) {
        ctx.fillRect(wx + w - 2, wy, 2, h);
    } else {
        ctx.fillRect(wx, wy, 2, h);
    }
}

// --- Procedural Platform Generation ---
function generatePlatforms() {
    // Generate new platforms above the current highest one
    while (highestPlatformY > camera.y - 300) {
        highestPlatformY -= 60 + Math.random() * 40; // 60-100px gap between levels
        const playArea = canvas.width - wallWidth * 2;
        const width = 80 + Math.random() * 80;       // 80-160px wide
        const x = wallWidth + Math.random() * (playArea - width);

        const plat = {
            x: x,
            y: highestPlatformY,
            width: width,
            height: 16
        };

        // ~35% chance to be a moving platform
        if (Math.random() < 0.35) {
            plat.moving = true;
            plat.moveSpeed = 0.3 + Math.random() * 0.5;
            const range = 60 + Math.random() * 100;
            plat.moveMin = Math.max(wallWidth, x - range / 2);
            plat.moveMax = Math.min(canvas.width - wallWidth - width, x + range / 2);
            // Ensure min < max
            if (plat.moveMin >= plat.moveMax) {
                plat.moveMin = wallWidth;
                plat.moveMax = canvas.width - wallWidth - width;
            }
            plat.moveDir = 1;
        }

        platforms.push(plat);
    }
}

// Remove platforms that are far below the camera (cleanup)
function cleanupPlatforms() {
    for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].y > camera.y + canvas.height + 200) {
            platforms.splice(i, 1);
        }
    }
}

// --- Input ---
const keys = {};

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    // Prevent scrolling with arrow keys / space
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
    }
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

// --- Score ---
let score = 0;

// --- Update ---
function update() {
    // Horizontal movement (Arrow keys + WASD)
    if (keys["ArrowLeft"] || keys["a"]) {
        player.velX = -player.speed;
        player.facing = -1;
    } else if (keys["ArrowRight"] || keys["d"]) {
        player.velX = player.speed;
        player.facing = 1;
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

    // Update moving platforms
    for (const platform of platforms) {
        if (platform.moving) {
            if (!platform.moveDir) platform.moveDir = 1;
            platform.x += platform.moveSpeed * platform.moveDir;
            if (platform.x <= platform.moveMin) {
                platform.x = platform.moveMin;
                platform.moveDir = 1;
            } else if (platform.x + platform.width >= platform.moveMax + platform.width) {
                platform.x = platform.moveMax;
                platform.moveDir = -1;
            }
        }
    }

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

                // If on a moving platform, move with it
                if (platform.moving) {
                    player.x += platform.moveSpeed * platform.moveDir;
                }
            } else if (player.velY < 0) {
                // Hitting from below
                player.y = platform.y + platform.height;
            }
            player.velY = 0;
        }
    }

    // Keep player in bounds (inside walls)
    if (player.x < wallWidth) player.x = wallWidth;
    if (player.x + player.width > canvas.width - wallWidth) player.x = canvas.width - wallWidth - player.width;

    // Update score based on height
    if (player.y < player.highestY) {
        score += Math.floor(player.highestY - player.y);
        player.highestY = player.y;
    }

    // --- Camera: follow player upward smoothly ---
    // Camera target: keep player in upper portion of screen
    const targetCameraY = player.y - canvas.height * 0.35;
    if (targetCameraY < camera.targetY) {
        camera.targetY = targetCameraY; // only scroll up, never back down
    }
    camera.y += (camera.targetY - camera.y) * camera.smoothing;

    // Generate new platforms as camera moves up
    generatePlatforms();

    // Cleanup old platforms below
    cleanupPlatforms();

    // Reset if player falls too far below the camera
    if (player.y > camera.y + canvas.height + 100) {
        player.x = 50;
        player.y = 300;
        player.velX = 0;
        player.velY = 0;
        player.highestY = 300;
        camera.y = 0;
        camera.targetY = 0;
        score = 0;

        // Reset platforms
        platforms.length = 0;
        platforms.push(
            { x: 28, y: 468, width: 744, height: 32 },
            { x: 150, y: 370, width: 120, height: 16 },
            { x: 350, y: 300, width: 120, height: 16, moving: true, moveSpeed: 0.5, moveMin: 280, moveMax: 520, moveDir: 1 },
            { x: 550, y: 230, width: 120, height: 16 },
            { x: 300, y: 160, width: 120, height: 16, moving: true, moveSpeed: 0.4, moveMin: 200, moveMax: 450, moveDir: 1 },
            { x: 80,  y: 100, width: 120, height: 16 }
        );
        highestPlatformY = 100;
    }
}

// --- Terraria-style Player ---
function drawPlayer(x, y, facing) {
    const px = 2; // pixel size for the sprite

    // Hair (brown, sits on top of head)
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(x + 3*px, y, 5*px, px);           // top row
    ctx.fillRect(x + 2*px, y + px, 7*px, px);      // second row
    if (facing === 1) {
        ctx.fillRect(x + 8*px, y + 2*px, 2*px, 2*px); // hair flows right
    } else {
        ctx.fillRect(x + px, y + 2*px, 2*px, 2*px);   // hair flows left
    }

    // Head (skin)
    ctx.fillStyle = "#FFCBA4";
    ctx.fillRect(x + 3*px, y + 2*px, 5*px, 5*px);

    // Eyes (white + pupil)
    ctx.fillStyle = "#FFFFFF";
    if (facing === 1) {
        ctx.fillRect(x + 5*px, y + 3*px, 2*px, 2*px); // right-facing eye
        ctx.fillStyle = "#222222";
        ctx.fillRect(x + 6*px, y + 3*px, px, 2*px);   // pupil
    } else {
        ctx.fillRect(x + 4*px, y + 3*px, 2*px, 2*px); // left-facing eye
        ctx.fillStyle = "#222222";
        ctx.fillRect(x + 4*px, y + 3*px, px, 2*px);   // pupil
    }

    // Shirt (blue like Terraria default)
    ctx.fillStyle = "#2E5CB8";
    ctx.fillRect(x + 2*px, y + 7*px, 7*px, 5*px);  // torso
    // Sleeves
    ctx.fillRect(x, y + 7*px, 2*px, 4*px);          // left arm
    ctx.fillRect(x + 9*px, y + 7*px, 2*px, 4*px);   // right arm

    // Hands (skin)
    ctx.fillStyle = "#FFCBA4";
    ctx.fillRect(x, y + 11*px, 2*px, 2*px);         // left hand
    ctx.fillRect(x + 9*px, y + 11*px, 2*px, 2*px);  // right hand

    // Pants (brown like Terraria default)
    ctx.fillStyle = "#6B4226";
    ctx.fillRect(x + 3*px, y + 12*px, 5*px, 4*px);  // waist area
    // Legs
    ctx.fillRect(x + 3*px, y + 16*px, 2*px, 2*px);  // left leg
    ctx.fillRect(x + 6*px, y + 16*px, 2*px, 2*px);  // right leg

    // Shoes (darker)
    ctx.fillStyle = "#3B2010";
    ctx.fillRect(x + 3*px, y + 18*px, 2*px, 2*px);  // left shoe
    ctx.fillRect(x + 6*px, y + 18*px, 2*px, 2*px);  // right shoe
}

// --- Draw ---
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw themed background (before camera transform)
    const bgTheme = getThemeForY(player.y);
    drawBackground(bgTheme);

    // Update particles
    updateParticles(bgTheme);

    // Apply camera transform
    ctx.save();
    ctx.translate(0, -camera.y);

    // Draw particles (in world space, behind walls)
    drawParticles();

    // Draw walls (behind platforms)
    drawWalls();

    // Draw platforms (themed style with rounded corners)
    for (const platform of platforms) {
        // Skip platforms outside visible area
        if (platform.y + platform.height < camera.y - 50 || platform.y > camera.y + canvas.height + 50) continue;

        const theme = getThemeForY(platform.y);
        const r = Math.min(6, platform.height / 2);

        // --- Main body ---
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.width, platform.height, r);
        ctx.fillStyle = theme.platBase;
        ctx.fill();

        // --- Clipped details ---
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.width, platform.height, r);
        ctx.clip();

        // Top highlight
        const topGrad = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
        topGrad.addColorStop(0, theme.platHighlight);
        topGrad.addColorStop(0.3, "rgba(0,0,0,0)");
        ctx.fillStyle = topGrad;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Bottom shadow
        const botGrad = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
        botGrad.addColorStop(0.7, "rgba(0,0,0,0)");
        botGrad.addColorStop(1, theme.platShadow);
        ctx.fillStyle = botGrad;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // --- Style-specific details ---
        if (theme.platStyle === "wood") {
            // Horizontal grain lines
            ctx.strokeStyle = theme.platGrain;
            ctx.lineWidth = 1;
            for (let gy = platform.y + 4; gy < platform.y + platform.height - 1; gy += 4) {
                ctx.beginPath();
                ctx.moveTo(platform.x + 2, gy);
                ctx.lineTo(platform.x + platform.width - 2, gy);
                ctx.stroke();
            }
            // Vertical plank dividers
            ctx.strokeStyle = theme.platDivider;
            ctx.lineWidth = 1.5;
            for (let px = platform.x + 50; px < platform.x + platform.width - 4; px += 50) {
                ctx.beginPath();
                ctx.moveTo(px, platform.y + 1);
                ctx.lineTo(px, platform.y + platform.height - 1);
                ctx.stroke();
            }
            // Grass tufts on top
            if (theme.platTopDecor) {
                ctx.fillStyle = theme.platTopDecor;
                for (let gx = platform.x + 5; gx < platform.x + platform.width - 5; gx += 8 + Math.floor((gx * 7) % 6)) {
                    const h = 3 + ((gx * 13) % 4);
                    ctx.fillRect(gx, platform.y - h + 2, 3, h);
                }
            }
        } else if (theme.platStyle === "stone") {
            // Rough stone cracks
            ctx.strokeStyle = theme.platGrain;
            ctx.lineWidth = 1;
            for (let cx = platform.x + 15; cx < platform.x + platform.width - 10; cx += 20 + ((cx * 7) % 15)) {
                ctx.beginPath();
                ctx.moveTo(cx, platform.y + 2);
                ctx.lineTo(cx + 3, platform.y + platform.height / 2);
                ctx.lineTo(cx - 2, platform.y + platform.height - 2);
                ctx.stroke();
            }
            // Small stone dots texture
            ctx.fillStyle = theme.platDivider;
            for (let dx = platform.x + 8; dx < platform.x + platform.width - 5; dx += 12 + ((dx * 3) % 8)) {
                const dy = platform.y + 4 + ((dx * 11) % (platform.height - 8));
                ctx.fillRect(dx, dy, 2, 2);
            }
        } else if (theme.platStyle === "ice") {
            // Shiny ice reflection streaks
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 1;
            for (let ix = platform.x + 10; ix < platform.x + platform.width - 15; ix += 25 + ((ix * 3) % 10)) {
                ctx.beginPath();
                ctx.moveTo(ix, platform.y + 3);
                ctx.lineTo(ix + 12, platform.y + platform.height - 3);
                ctx.stroke();
            }
            // Frost crystals on edges
            ctx.fillStyle = "rgba(220,245,255,0.6)";
            ctx.fillRect(platform.x, platform.y, platform.width, 2);
            // Subtle blue tint shimmer
            ctx.fillStyle = "rgba(150,210,240,0.15)";
            for (let sx = platform.x; sx < platform.x + platform.width; sx += 30) {
                ctx.fillRect(sx, platform.y, 15, platform.height);
            }
        } else if (theme.platStyle === "obsidian") {
            // Dark jagged cracks with lava glow
            ctx.strokeStyle = theme.platGrain;
            ctx.lineWidth = 1.5;
            for (let ox = platform.x + 12; ox < platform.x + platform.width - 8; ox += 18 + ((ox * 5) % 12)) {
                ctx.beginPath();
                ctx.moveTo(ox, platform.y + 1);
                ctx.lineTo(ox + 4, platform.y + platform.height * 0.5);
                ctx.lineTo(ox - 1, platform.y + platform.height - 1);
                ctx.stroke();
            }
            // Lava glow cracks on top
            if (theme.platTopDecor) {
                ctx.strokeStyle = theme.platTopDecor;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.003 + platform.x) * 0.2;
                for (let lx = platform.x + 6; lx < platform.x + platform.width - 6; lx += 15 + ((lx * 3) % 10)) {
                    ctx.beginPath();
                    ctx.moveTo(lx, platform.y + 1);
                    ctx.lineTo(lx + 8, platform.y + 1);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1.0;
            }
        } else if (theme.platStyle === "marble") {
            // Elegant marble veins
            ctx.strokeStyle = "rgba(200,185,160,0.3)";
            ctx.lineWidth = 1;
            for (let mx = platform.x + 10; mx < platform.x + platform.width - 10; mx += 22 + ((mx * 7) % 15)) {
                ctx.beginPath();
                ctx.moveTo(mx, platform.y + 2);
                ctx.quadraticCurveTo(mx + 8, platform.y + platform.height / 2, mx + 3, platform.y + platform.height - 2);
                ctx.stroke();
            }
            // Gold trim on top and bottom edges
            if (theme.platTopDecor) {
                ctx.fillStyle = theme.platTopDecor;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(platform.x + 2, platform.y, platform.width - 4, 2);
                ctx.fillRect(platform.x + 2, platform.y + platform.height - 2, platform.width - 4, 2);
                ctx.globalAlpha = 1.0;
            }
            // Subtle polish shine
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fillRect(platform.x, platform.y, platform.width * 0.6, platform.height);
        }

        ctx.restore();

        // --- Rounded border ---
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.width, platform.height, r);
        ctx.strokeStyle = theme.platBorder;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- Moving platform indicator ---
        if (platform.moving) {
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.font = "10px monospace";
            ctx.fillText("◄►", platform.x + platform.width / 2 - 8, platform.y + platform.height / 2 + 4);
        }
    }

    // Draw player (Terraria-style pixel character)
    drawPlayer(player.x, player.y, player.facing);

    ctx.restore(); // remove camera transform

    // Draw HUD (not affected by camera)
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    ctx.fillText("Arrow Keys / WASD to move  |  Space / Up / W to jump", 140, 20);

    // Score & Level name
    const currentTheme = getThemeForY(player.y);
    ctx.font = "bold 18px monospace";
    ctx.fillText("Score: " + score, 20, 48);
    ctx.fillStyle = currentTheme.wallAccent;
    ctx.fillText(currentTheme.name, canvas.width - 150, 48);
}

// --- Game Loop ---
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
