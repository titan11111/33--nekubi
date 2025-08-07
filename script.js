// ゲーム状態管理
const gameState = {
    screen: 'title', // 'title', 'playing', 'gameover', 'clear'
    paused: false,
    score: 0,
    life: 3,
    currentFloor: 1,
    scrollY: 0,
    gameSpeed: 2
};

// キャンバス設定
let canvas;
let ctx;
let canvasWidth = 400;
let canvasHeight = 600;

// プレイヤー（忍者）
const player = {
    x: 200,
    y: 500,
    width: 40,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    direction: 1, // 1: 右, -1: 左
    isJumping: false,
    isAttacking: false,
    invulnerable: false,
    invulnerableTime: 0
};

// 敵配列
let enemies = [];
let projectiles = []; // 手裏剣
let enemyProjectiles = []; // 敵の矢

// フロア定義
const floors = [
    { y: 500, enemies: ['samurai', 'archer'] },
    { y: 400, enemies: ['samurai', 'samurai', 'archer'] },
    { y: 300, enemies: ['archer', 'samurai', 'archer'] },
    { y: 200, enemies: ['samurai', 'archer', 'samurai'] },
    { y: 100, enemies: ['lord'] } // ボスフロア
];

// 入力管理
const keys = {};
const touches = {};

// ゲーム初期化
function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // キャンバスサイズ調整
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // イベントリスナー設定
    setupEventListeners();
    
    // ゲームループ開始
    gameLoop();
}

// キャンバスサイズ調整
function resizeCanvas() {
    const container = document.getElementById('game-screen');
    const rect = container.getBoundingClientRect();
    
    canvasWidth = Math.min(rect.width, 400);
    canvasHeight = Math.min(rect.height - 140, 600); // UI分を除く
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // プレイヤー位置調整
    player.x = canvasWidth / 2 - player.width / 2;
    player.y = canvasHeight - 100;
}

// イベントリスナー設定
function setupEventListeners() {
    // タイトル画面
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);
    document.getElementById('play-again-button').addEventListener('click', restartGame);
    
    // キーボード操作
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // スマホコントローラー
    setupMobileControls();
    
    // 外部コントローラー対応
    window.addEventListener('message', handleExternalController);
}

// スマホコントローラー設定
function setupMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');
    const btnAttack = document.getElementById('btn-attack');
    
    // タッチイベント
    btnLeft.addEventListener('touchstart', () => keys.ArrowLeft = true);
    btnLeft.addEventListener('touchend', () => keys.ArrowLeft = false);
    btnLeft.addEventListener('mousedown', () => keys.ArrowLeft = true);
    btnLeft.addEventListener('mouseup', () => keys.ArrowLeft = false);
    
    btnRight.addEventListener('touchstart', () => keys.ArrowRight = true);
    btnRight.addEventListener('touchend', () => keys.ArrowRight = false);
    btnRight.addEventListener('mousedown', () => keys.ArrowRight = true);
    btnRight.addEventListener('mouseup', () => keys.ArrowRight = false);
    
    btnJump.addEventListener('touchstart', () => jumpPlayer());
    btnJump.addEventListener('click', () => jumpPlayer());
    
    btnAttack.addEventListener('touchstart', () => attackPlayer());
    btnAttack.addEventListener('click', () => attackPlayer());
}

// 外部コントローラー対応
function handleExternalController(event) {
    const cmd = event.data;
    if (cmd === 'left') keys.ArrowLeft = true;
    else if (cmd === 'right') keys.ArrowRight = true;
    else if (cmd === 'jump') jumpPlayer();
    else if (cmd === 'action') attackPlayer();
}

// キーボード操作
function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === ' ') jumpPlayer();
    if (e.key === 'x' || e.key === 'X') attackPlayer();
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

// ゲーム開始
function startGame() {
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    gameState.screen = 'playing';
    gameState.score = 0;
    gameState.life = 3;
    gameState.currentFloor = 1;
    gameState.scrollY = 0;
    
    resetPlayer();
    generateEnemies();
    updateUI();
}

// ゲーム再開
function restartGame() {
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('clear-screen').style.display = 'none';
    document.getElementById('title-screen').style.display = 'block';
    document.getElementById('game-screen').style.display = 'none';
    
    gameState.screen = 'title';
    enemies = [];
    projectiles = [];
    enemyProjectiles = [];
}

// プレイヤーリセット
function resetPlayer() {
    player.x = canvasWidth / 2 - player.width / 2;
    player.y = canvasHeight - 100;
    player.velocityX = 0;
    player.velocityY = 0;
    player.onGround = true;
    player.invulnerable = false;
}

// 敵生成
function generateEnemies() {
    enemies = [];
    const currentFloorData = floors[gameState.currentFloor - 1];
    
    currentFloorData.enemies.forEach((enemyType, index) => {
        const enemy = {
            type: enemyType,
            x: 50 + (index * 100),
            y: currentFloorData.y,
            width: enemyType === 'lord' ? 80 : 45,
            height: enemyType === 'lord' ? 60 : 45,
            health: enemyType === 'lord' ? 5 : 1,
            direction: Math.random() > 0.5 ? 1 : -1,
            speed: enemyType === 'samurai' ? 1 : 0.5,
            shootTimer: 0,
            patrolLeft: 50 + (index * 100) - 50,
            patrolRight: 50 + (index * 100) + 50
        };
        enemies.push(enemy);
    });
}

// プレイヤージャンプ
function jumpPlayer() {
    if (gameState.screen !== 'playing') return;
    if (player.onGround) {
        player.velocityY = -15;
        player.onGround = false;
        player.isJumping = true;
    }
}

// プレイヤー攻撃
function attackPlayer() {
    if (gameState.screen !== 'playing') return;
    if (!player.isAttacking) {
        player.isAttacking = true;
        
        // 手裏剣生成
        projectiles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            width: 20,
            height: 20,
            velocityX: player.direction * 8,
            velocityY: 0
        });
        
        setTimeout(() => player.isAttacking = false, 300);
    }
}

// ゲームループ
function gameLoop() {
    if (gameState.screen === 'playing' && !gameState.paused) {
        update();
        render();
    }
    requestAnimationFrame(gameLoop);
}

// ゲーム更新
function update() {
    updatePlayer();
    updateEnemies();
    updateProjectiles();
    updateCollisions();
    updateGameProgress();
}

// プレイヤー更新
function updatePlayer() {
    // 無敵時間管理
    if (player.invulnerable) {
        player.invulnerableTime--;
        if (player.invulnerableTime <= 0) {
            player.invulnerable = false;
        }
    }
    
    // 左右移動
    if (keys.ArrowLeft || keys['a'] || keys['A']) {
        player.velocityX = -5;
        player.direction = -1;
    } else if (keys.ArrowRight || keys['d'] || keys['D']) {
        player.velocityX = 5;
        player.direction = 1;
    } else {
        player.velocityX *= 0.8; // 摩擦
    }
    
    // 重力
    if (!player.onGround) {
        player.velocityY += 0.8;
    }
    
    // 位置更新
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // 画面端制限
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvasWidth) player.x = canvasWidth - player.width;
    
    // 地面判定
    if (player.y + player.height >= canvasHeight - 20) {
        player.y = canvasHeight - 20 - player.height;
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
    }
}

// 敵更新
function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.type === 'samurai') {
            // 侍：左右パトロール
            enemy.x += enemy.speed * enemy.direction;
            if (enemy.x <= enemy.patrolLeft || enemy.x >= enemy.patrolRight) {
                enemy.direction *= -1;
            }
        } else if (enemy.type === 'archer') {
            // 弓兵：定期的に矢を撃つ
            enemy.shootTimer++;
            if (enemy.shootTimer >= 120) { // 2秒間隔
                enemyProjectiles.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    width: 30,
                    height: 4,
                    velocityX: player.x < enemy.x ? -4 : 4,
                    velocityY: 0
                });
                enemy.shootTimer = 0;
            }
        }
    });
}

// 発射物更新
function updateProjectiles() {
    // プレイヤーの手裏剣
    projectiles = projectiles.filter(projectile => {
        projectile.x += projectile.velocityX;
        projectile.y += projectile.velocityY;
        return projectile.x > -20 && projectile.x < canvasWidth + 20;
    });
    
    // 敵の矢
    enemyProjectiles = enemyProjectiles.filter(projectile => {
        projectile.x += projectile.velocityX;
        return projectile.x > -30 && projectile.x < canvasWidth + 30;
    });
}

// 衝突判定
function updateCollisions() {
    // プレイヤーと敵の衝突
    if (!player.invulnerable) {
        enemies.forEach(enemy => {
            if (isColliding(player, enemy)) {
                takeDamage();
            }
        });
    }
    
    // プレイヤーと敵の矢の衝突
    if (!player.invulnerable) {
        enemyProjectiles.forEach((arrow, index) => {
            if (isColliding(player, arrow)) {
                enemyProjectiles.splice(index, 1);
                takeDamage();
            }
        });
    }
    
    // 手裏剣と敵の衝突
    projectiles.forEach((shuriken, shurikenIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(shuriken, enemy)) {
                projectiles.splice(shurikenIndex, 1);
                enemy.health--;
                gameState.score += 100;
                
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    gameState.score += enemy.type === 'lord' ? 1000 : 200;
                }
            }
        });
    });
}

// 衝突判定関数
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ダメージ処理
function takeDamage() {
    gameState.life--;
    player.invulnerable = true;
    player.invulnerableTime = 120; // 2秒間無敵
    
    if (gameState.life <= 0) {
        gameOver();
    }
    updateUI();
}

// ゲーム進行更新
function updateGameProgress() {
    // 全ての敵を倒したら次のフロアへ
    if (enemies.length === 0) {
        if (gameState.currentFloor >= 5) {
            gameClear();
        } else {
            gameState.currentFloor++;
            generateEnemies();
            updateUI();
        }
    }
}

// UI更新
function updateUI() {
    document.getElementById('life-count').textContent = gameState.life;
    document.getElementById('current-floor').textContent = gameState.currentFloor;
    document.getElementById('score').textContent = gameState.score;
}

// ゲームオーバー
function gameOver() {
    gameState.screen = 'gameover';
    document.getElementById('final-score').textContent = `スコア: ${gameState.score}`;
    document.getElementById('gameover-screen').style.display = 'block';
}

// ゲームクリア
function gameClear() {
    gameState.screen = 'clear';
    document.getElementById('clear-score').textContent = `最終スコア: ${gameState.score}`;
    document.getElementById('clear-screen').style.display = 'block';
}

// レンダリング
function render() {
    // 画面クリア
    ctx.fillStyle = 'linear-gradient(to bottom, #2c3e50, #34495e, #1a252f)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 背景（城の壁）
    drawCastleBackground();
    
    // プレイヤー描画
    drawPlayer();
    
    // 敵描画
    enemies.forEach(enemy => drawEnemy(enemy));
    
    // 発射物描画
    projectiles.forEach(projectile => drawShuriken(projectile));
    enemyProjectiles.forEach(arrow => drawArrow(arrow));
    
    // エフェクト描画
    drawEffects();
}

// 城の背景描画
function drawCastleBackground() {
    // グラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(0.5, '#34495e');
    gradient.addColorStop(1, '#1a252f');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 城の壁パターン
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    
    // 横線（床）
    for (let i = 1; i <= 5; i++) {
        const y = canvasHeight - (i * 100);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
    
    // 縦線（柱）
    for (let x = 50; x < canvasWidth; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }
    
    // 月と星
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(canvasWidth - 50, 50, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // 星
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * canvasWidth;
        const y = Math.random() * 150;
        drawStar(x, y, 2);
    }
}

// 星描画
function drawStar(x, y, size) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
}

// プレイヤー描画
function drawPlayer() {
    ctx.save();
    
    // 無敵状態の点滅効果
    if (player.invulnerable && Math.floor(player.invulnerableTime / 5) % 2) {
        ctx.globalAlpha = 0.5;
    }
    
    // 向きに応じて反転
    if (player.direction === -1) {
        ctx.scale(-1, 1);
        ctx.translate(-player.x - player.width, player.y);
    } else {
        ctx.translate(player.x, player.y);
    }
    
    // 忍者の体
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(12, 15, 16, 20);
    
    // 忍者の頭
    ctx.beginPath();
    ctx.arc(20, 12, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 目
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 10, 3, 2);
    ctx.fillRect(21, 10, 3, 2);
    
    ctx.restore();
}

// 敵描画
function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    
    if (enemy.type === 'samurai') {
        // 侍
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(15, 20, 15, 18);
        
        ctx.fillStyle = '#ffdbab';
        ctx.beginPath();
        ctx.arc(22.5, 15, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // ちょんまげ
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.ellipse(22.5, 10, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(21, 5, 3, 8);
        
        // 刀
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(35, 15);
        ctx.lineTo(35, 30);
        ctx.stroke();
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(33, 12, 4, 3);
        
    } else if (enemy.type === 'archer') {
        // 弓兵
        ctx.fillStyle = '#3366cc';
        ctx.fillRect(14, 18, 14, 17);
        
        ctx.fillStyle = '#ffdbab';
        ctx.beginPath();
        ctx.arc(21, 13, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 弓
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(8, 15, 7, -Math.PI/3, Math.PI/3, false);
        ctx.stroke();
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(5, 10);
        ctx.lineTo(5, 20);
        ctx.stroke();
        
    } else if (enemy.type === 'lord') {
        // 殿（ボス）
        ctx.fillStyle = '#6b46c1';
        ctx.beginPath();
        ctx.ellipse(40, 45, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.ellipse(40, 35, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffdbab';
        ctx.beginPath();
        ctx.arc(25, 25, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 髪
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(20, 18, 8, 0, Math.PI);
        ctx.fill();
        
        // 寝息
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.fillText('ZZZ', 50, 15);
        
        // ダメージ表示
        if (enemy.health < 5) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '10px Arial';
            ctx.fillText(`HP: ${enemy.health}`, 10, 10);
        }
    }
    
    ctx.restore();
}

// 手裏剣描画
function drawShuriken(shuriken) {
    ctx.save();
    ctx.translate(shuriken.x + shuriken.width/2, shuriken.y + shuriken.height/2);
    ctx.rotate(Date.now() * 0.01); // 回転アニメーション
    
    // 手裏剣の形
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(2, -2);
    ctx.lineTo(8, 0);
    ctx.lineTo(2, 2);
    ctx.lineTo(0, 8);
    ctx.lineTo(-2, 2);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-2, -2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// 矢描画
function drawArrow(arrow) {
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(arrow.x, arrow.y, 25, 2);
    
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.moveTo(arrow.x + 25, arrow.y - 2);
    ctx.lineTo(arrow.x + 30, arrow.y + 1);
    ctx.lineTo(arrow.x + 25, arrow.y + 4);
    ctx.closePath();
    ctx.fill();
}

// エフェクト描画
function drawEffects() {
    // 攻撃エフェクト
    if (player.isAttacking) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(player.x - 10, player.y - 10, player.width + 20, player.height + 20);
    }
    
    // ジャンプエフェクト
    if (player.isJumping) {
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.width/2, player.y + player.height + 5, 15, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // モバイルデバイスの判定
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // モバイルでは自動的にコントローラーを表示
        document.getElementById('mobile-controller').style.display = 'block';
    } else {
        // デスクトップでもコントローラーを表示（小学生向け）
        document.getElementById('mobile-controller').style.display = 'block';
    }
    
    // タッチイベントのデフォルト動作を防ぐ
    document.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('control-btn')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // ゲーム初期化
    initGame();
});

// デバッグ用関数（開発時のテスト用）
function debugInfo() {
    console.log('Player:', player);
    console.log('Enemies:', enemies.length);
    console.log('GameState:', gameState);
}

// ゲーム一時停止/再開
function togglePause() {
    gameState.paused = !gameState.paused;
}

// チート機能（デバッグ用）
function debugMode() {
    if (confirm('デバッグモードを有効にしますか？')) {
        gameState.life = 99;
        player.invulnerable = true;
        updateUI();
    }
}
