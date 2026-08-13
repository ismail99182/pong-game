// Get canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Detect if device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Set canvas size to fill the screen
function resizeCanvas() {
    if (isMobile) {
        // Mobile: use full screen minus status bar and controls
        canvas.width = window.innerWidth;
        canvas.height = Math.min(window.innerHeight - 140, window.innerHeight * 0.7);
    } else {
        // Desktop: responsive sizing
        canvas.width = Math.min(window.innerWidth - 40, 1000);
        canvas.height = Math.min(window.innerHeight - 200, 600);
    }
    
    // Show/hide hints based on device
    document.getElementById('mobileHint').style.display = isMobile ? 'block' : 'none';
    document.getElementById('desktopHint').style.display = isMobile ? 'none' : 'block';
    
    // Update paddle positions if out of bounds
    if (player.y + paddleHeight > canvas.height) {
        player.y = canvas.height - paddleHeight;
    }
    if (computer.y + paddleHeight > canvas.height) {
        computer.y = canvas.height - paddleHeight;
    }
}

// Initial canvas resize
resizeCanvas();

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);

// Game Objects
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 8;

// Player Paddle
const player = {
    x: 20,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 7,
    score: 0
};

// Computer Paddle
const computer = {
    x: canvas.width - 30,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 5,
    score: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballSize,
    dx: 5,
    dy: 5,
    speed: 5
};

// Game State
let gameRunning = false;
let keys = {};
let touchActive = false;

// ============ KEYBOARD EVENTS ============
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        gameRunning = !gameRunning;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ============ MOUSE EVENTS ============
canvas.addEventListener('mousemove', (e) => {
    if (isMobile || touchActive) return; // Skip mouse on mobile
    
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    player.y = Math.max(0, Math.min(mouseY - paddleHeight / 2, canvas.height - paddleHeight));
});

// ============ TOUCH EVENTS ============
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    
    if (e.touches.length > 0) {
        touchActive = true;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentTouchY = touch.clientY - rect.top;
        
        // Move paddle based on touch position
        player.y = Math.max(0, Math.min(currentTouchY - paddleHeight / 2, canvas.height - paddleHeight));
    }
}, { passive: false });

// Start/pause with tap on mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchActive = true;
    
    if (e.touches.length === 1) {
        gameRunning = !gameRunning;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    touchActive = false;
}, { passive: false });

// Single tap to start game on desktop too
canvas.addEventListener('click', () => {
    if (!isMobile) {
        gameRunning = !gameRunning;
    }
});

// ============ GAME UPDATE FUNCTIONS ============

// Update player paddle with keyboard
function updatePlayerPaddle() {
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        player.y = Math.min(canvas.height - paddleHeight, player.y + player.speed);
    }
}

// Update computer paddle (AI)
function updateComputerPaddle() {
    const computerCenter = computer.y + paddleHeight / 2;
    const ballCenter = ball.y;
    
    if (computerCenter < ballCenter - 35) {
        computer.y = Math.min(canvas.height - paddleHeight, computer.y + computer.speed);
    } else if (computerCenter > ballCenter + 35) {
        computer.y = Math.max(0, computer.y - computer.speed);
    }
}

// Update ball position
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
    }

    // Ball collision with paddles
    if (
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = -ball.dx;
        ball.x = player.x + player.width + ball.radius;
        
        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - (player.y + paddleHeight / 2)) / (paddleHeight / 2);
        ball.dy += hitPos * 3;
    }

    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computer.x - ball.radius;
        
        // Add spin based on where ball hits paddle
        const hitPos = (ball.y - (computer.y + paddleHeight / 2)) / (paddleHeight / 2);
        ball.dy += hitPos * 3;
    }

    // Ball out of bounds (scoring)
    if (ball.x - ball.radius < 0) {
        computer.score++;
        resetBall();
        updateScore();
    }

    if (ball.x + ball.radius > canvas.width) {
        player.score++;
        resetBall();
        updateScore();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() - 0.5) * 6;
    gameRunning = false;
}

// Update score display
function updateScore() {
    document.getElementById('playerScore').textContent = player.score;
    document.getElementById('computerScore').textContent = computer.score;
}

// ============ DRAW FUNCTIONS ============

function drawPaddle(paddle) {
    ctx.fillStyle = 'white';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
}

function drawBall() {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawPaddle(player);
    drawPaddle(computer);
    drawBall();
    drawCenterLine();

    // Draw game status
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    if (!gameRunning) {
        ctx.fillText(isMobile ? 'Tap to start' : 'Press SPACE to start', canvas.width / 2, 40);
    }
    
    ctx.textAlign = 'left';
}

// ============ MAIN GAME LOOP ============

function gameLoop() {
    if (gameRunning) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();