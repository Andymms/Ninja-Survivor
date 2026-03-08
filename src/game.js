const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
    width: 800,
    height: 600,
    keys: {},
    spawnTimer: 0,
    spawnInterval: 100,
    gameOver: false
};

const player = {
    x: 400,
    y: 300,
    radius: 20,
    speed: 4,
    color: '#972f2f',
    hp: 100,
    maxHp: 100
};

const sword = {
    angle: 0,
    length: 80,
    damage: 20,
    attacking: false,
    attackTimer: 0,
    attackDuration: 10,
    slashProgress: 0
};

let enemies = [];
let particles = [];

window.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;
    if (e.key === " " && !sword.attacking && !game.gameOver) {
        sword.attacking = true;
        sword.attackTimer = sword.attackDuration;
    }
    if (e.key.toLowerCase() === 'r' && game.gameOver) resetGame();
});

window.addEventListener('keyup', (e) => {
    game.keys[e.key] = false;
});

function updatePlayer() {
    if (game.keys['w'] || game.keys['ArrowUp']) player.y -= player.speed;
    if (game.keys['s'] || game.keys['ArrowDown']) player.y += player.speed;
    if (game.keys['a'] || game.keys['ArrowLeft']) player.x -= player.speed;
    if (game.keys['d'] || game.keys['ArrowRight']) player.x += player.speed;

    player.x = Math.max(player.radius, Math.min(game.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(game.height - player.radius, player.y));
}

function updateSword() {
    if (game.keys["w"] || game.keys["ArrowUp"]) sword.angle = -Math.PI / 2;
    if (game.keys["s"] || game.keys["ArrowDown"]) sword.angle = Math.PI / 2;
    if (game.keys["a"] || game.keys["ArrowLeft"]) sword.angle = Math.PI;
    if (game.keys["d"] || game.keys["ArrowRight"]) sword.angle = 0;

    if (sword.attacking) {
        sword.attackTimer--;

        sword.slashProgress = 1 - sword.attackTimer / sword.attackDuration;

        if (sword.attackTimer <= 0) {
            sword.attacking = false;
        }
    }
}

function spawnEnemy() {
    const enemy = {
        radius: 15,
        speed: 1,
        color: '#2f972f',
        health: 40
    };

    const edge = Math.floor(Math.random() * 4);
    
    if (edge === 0) {
        // TOP
        enemy.x = Math.random() * game.width;
        enemy.y = -20;
    } else if (edge === 1) {
        // RIGHT
        enemy.x = game.width + 20;
        enemy.y = Math.random() * game.height;
    } else if (edge === 2) {
        // BOTTOM
        enemy.x = Math.random() * game.width;
        enemy.y = game.height + 20;
    } else {
        // LEFT
        enemy.x = -20;
        enemy.y = Math.random() * game.height;
    }

    enemies.push(enemy);
}

function updateEnemies() {
    enemies.forEach(enemy => {
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x)
        enemy.x += Math.cos(angleToPlayer) * enemy.speed
        enemy.y += Math.sin(angleToPlayer) * enemy.speed
    });
}

function checkCollisions() {
    enemies.forEach(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + enemy.radius) {
            player.hp -= 0.2; 
            if (player.hp <= 0) game.gameOver = true;
        }

        if (sword.attacking) {
            const swordArc = Math.PI / 4; // Total width of the hit zone
            const distToEnemy = distance;
            
            if (distToEnemy < sword.length + enemy.radius) {
                const angleToEnemy = Math.atan2(dy, dx);
                
                let angleDiff = angleToEnemy - sword.angle;
                
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                if (Math.abs(angleDiff) < swordArc) {
                    enemy.health -= sword.damage;
                    enemy.x += Math.cos(angleToEnemy) * 10;
                    enemy.y += Math.sin(angleToEnemy) * 10;
                }
            }
        }
    });

    enemies = enemies.filter(enemy => enemy.health > 0);
}

function draw() {
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, game.width, game.height);

    // Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x - 25, player.y - 35, 50, 6);
    ctx.fillStyle = player.hp > 30 ? '#2f972f' : '#972f2f'; // Green, turns red when low
    ctx.fillRect(player.x - 25, player.y - 35, (player.hp / player.maxHp) * 50, 6);

    if (sword.attacking) {
        const currentLength = sword.length;
        const arcSize = Math.PI / 6; 

        ctx.save();

        // FILLED CONE
        ctx.beginPath();
        ctx.moveTo(player.x  , player.y);  // Center of player
        ctx.arc(player.x, player.y, currentLength, sword.angle - arcSize, sword.angle + arcSize);
        ctx.closePath();  // Back to center

        ctx.fillStyle = '#fff';  // Solid white
        ctx.fill();
    
        // Thin outline
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.stroke();
    
        ctx.restore();
    }

    enemies.forEach(enemy => {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
    });

}

function resetGame() {
    player.hp = 100;
    player.x = 400;
    player.y = 300;
    enemies = [];
    particles = [];
    game.gameOver = false;
}

function gameLoop() {

    if (game.gameOver) {
        return;
    }

    updatePlayer();
    updateSword();
    checkCollisions();

    game.spawnTimer++;
    if (game.spawnTimer >= game.spawnInterval) {
        spawnEnemy();
        game.spawnTimer = 0;
    }

    updateEnemies();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();