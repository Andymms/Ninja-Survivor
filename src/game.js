const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
    width: 800,
    height: 600,
    keys: {},
    spawnTimer: 0,
    spawnInterval: 100,
    gameOver: false,
    screenShake: false,
    screenShakeProgress: 10
};

const player = {
    x: 400,
    y: 300,
    radius: 20,
    speed: 3,
    color: '#972f2f',
    hp: 100,
    maxHp: 100,
    xp: 0,
    nextLevelXp: 100,
    level: 1,
    magnetRange: 0
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
let xpGems = [];

window.addEventListener('keydown', (e) => {
    game.keys[e.key] = true;
    if (e.key === " " && !sword.attacking && !game.gameOver) {
        sword.attacking = true;
        sword.attackTimer = sword.attackDuration;
    }
    if (e.key.toLowerCase() === 'r' && !game.gameOver) resetGame();
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
            player.hp -= 0.8;
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
                    enemy.x += Math.cos(angleToEnemy) * 60;
                    enemy.y += Math.sin(angleToEnemy) * 60;

                    game.screenShake = true
                    game.screenShakeProgress = 10
                }
            }
        }
    });

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].health <= 0) {
            for (let p = 0; p < 10; p++) {
                particles.push({
                    x: enemies[i].x,
                    y: enemies[i].y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 30
                });

            }
            xpGems.push({
                x: enemies[i].x,
                y: enemies[i].y,
                value: 10
            });
            enemies.splice(i, 1);
        }
    }

}


function updateParticles() {

    particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
    });

    particles = particles.filter(p => p.life > 0);
}

function checkXPGemCollisions() {
    for (let index = xpGems.length - 1; index >= 0; index--) {
        const gem = xpGems[index];
        const dx = gem.x - player.x;
        const dy = gem.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.magnetRange && player.magnetRange > 0) {
            const angle = Math.atan2(player.y - gem.y, player.x - gem.x);
            gem.x += Math.cos(angle) * 3;
            gem.y += Math.sin(angle) * 3;
        }

        if (distance < player.radius + 10) {
            xpGems.splice(index, 1);
            player.xp += gem.value;
            if (player.xp >= player.nextLevelXp) {
                player.level++;
                if (player.level === 3) {
                    player.magnetRange = 100;
                }
                player.xp -= player.nextLevelXp;
                player.nextLevelXp += 50;
                player.speed = Math.min(5, player.speed + 0.5);
                player.maxHp = Math.min(150, player.maxHp + 10);
                player.hp = player.maxHp;
                sword.damage = Math.min(50, sword.damage + 2);
                sword.attackDuration = Math.max(8, sword.attackDuration - 0.5);
                game.spawnInterval = Math.max(20, game.spawnInterval - 2);  
            }
        }
    };
}

function draw() {

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.save();

    if (game.screenShake && game.screenShakeProgress > 0) {
        let x = (Math.random() - 0.5) * 3;
        let y = (Math.random() - 0.5) * 3;
        ctx.translate(x, y)

        game.screenShakeProgress--;
        if (game.screenShakeProgress <= 0) game.screenShake = false
    }

    // Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x - 25, player.y - 35, 50, 6);
    ctx.fillStyle = player.hp > 30 ? '#2f972f' : '#972f2f';
    ctx.fillRect(player.x - 25, player.y - 35, (player.hp / player.maxHp) * 50, 6);

    if (sword.attacking) {
        const currentLength = sword.length;
        const arcSize = Math.PI / 6;

        ctx.save();

        // FILLED CONE
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);  // Center of player
        ctx.arc(player.x, player.y, currentLength, sword.angle - arcSize, sword.angle + arcSize);
        ctx.closePath();

        ctx.fillStyle = '#fff'
        ctx.fill();

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

    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(107, 0, 0, ${particle.life / 30})`;
        ctx.fill();
    });

    xpGems.forEach(gem => {
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#fff240';
        ctx.fill();
    });

    ctx.restore();

    // Player XP bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; 
    ctx.fillRect(0, 0, game.width, 10);

    ctx.fillStyle = '#00d4ff';
    let barWidth = (player.xp / player.nextLevelXp) * game.width;
    ctx.fillRect(0, 0, barWidth, 10);

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
    updateParticles();

    game.spawnTimer++;
    if (game.spawnTimer >= game.spawnInterval) {
        spawnEnemy();
        game.spawnTimer = 0;
    }

    updateEnemies();
    checkXPGemCollisions();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();