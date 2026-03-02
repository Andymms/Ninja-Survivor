const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
    width: 800,
    height: 600,
    keys: {},
    spawnTimer: 0,
    spawnInterval: 120
};

const player = {
    x: 400,
    y: 300,
    radius: 20,
    speed: 4,
    color: '#972f2f'
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

const enemies = [];

window.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    game.keys[e.key] = false;
});

window.addEventListener("keydown", (e) => {
    game.keys[e.key] = true;
    if (e.key === " " && !sword.attacking) {
        sword.attacking = true;
        sword.attackTimer = sword.attackDuration;
    }
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
        health: 20
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

function draw() {
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, game.width, game.height);

    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();

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

function gameLoop() {
    updatePlayer();
    updateSword();

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