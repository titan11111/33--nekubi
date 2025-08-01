// 忍者寝首討ちゲーム - メインスクリプト

class NinjaGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'title'; // title, playing, clear, gameover
        
        // ゲーム設定
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        
        // プレイヤー（忍者）
        this.ninja = {
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            speed: 3,
            hiding: false,
            visible: true
        };
        
        // ゲーム状態
        this.score = 0;
        this.stage = 1;
        this.stealthLevel = 100;
        this.scrollY = 0;
        this.targetY = -2000; // 殿様の部屋の高さ
        
        // 敵・障害物
        this.guards = [];
        this.cats = [];
        this.obstacles = [];
        
        // コントロール
        this.keys = {
            left: false,
            right: false,
            hide: false
        };
        
        // アニメーション
        this.animationId = 0;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // キャンバスサイズ設定
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // イベントリスナー設定
        this.setupEventListeners();
        
        // ゲーム開始
        this.showTitle();
    }
    
    resizeCanvas() {
        this.canvasWidth = window.innerWidth;
        this.canvasHeight = window.innerHeight;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // 忍者の初期位置
        this.ninja.x = this.canvasWidth / 2 - this.ninja.width / 2;
        this.ninja.y = this.canvasHeight - 100;
    }
    
    setupEventListeners() {
        // ボタンクリック
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('retryBtn').addEventListener('click', () => this.startGame());
        
        // スマホ操作ボタン
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const hideBtn = document.getElementById('hideBtn');
        
        // タッチイベント
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.left = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.left = false;
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.right = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.right = false;
        });
        
        hideBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.hide = true;
            this.ninja.hiding = true;
        });
        hideBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.hide = false;
            this.ninja.hiding = false;
        });
        
        // マウスイベント（PC用）
        leftBtn.addEventListener('mousedown', () => this.keys.left = true);
        leftBtn.addEventListener('mouseup', () => this.keys.left = false);
        rightBtn.addEventListener('mousedown', () => this.keys.right = true);
        rightBtn.addEventListener('mouseup', () => this.keys.right = false);
        hideBtn.addEventListener('mousedown', () => {
            this.keys.hide = true;
            this.ninja.hiding = true;
        });
        hideBtn.addEventListener('mouseup', () => {
            this.keys.hide = false;
            this.ninja.hiding = false;
        });
        
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'Space':
                case 'KeyS':
                    this.keys.hide = true;
                    this.ninja.hiding = true;
                    e.preventDefault();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'Space':
                case 'KeyS':
                    this.keys.hide = false;
                    this.ninja.hiding = false;
                    break;
            }
        });
    }
    
    showTitle() {
        this.gameState = 'title';
        document.getElementById('titleScreen').style.display = 'block';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('clearScreen').style.display = 'none';
        document.getElementById('gameoverScreen').style.display = 'none';
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('titleScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        document.getElementById('clearScreen').style.display = 'none';
        document.getElementById('gameoverScreen').style.display = 'none';
        
        // ゲーム状態リセット
        this.score = 0;
        this.stage = 1;
        this.stealthLevel = 100;
        this.scrollY = 0;
        this.ninja.x = this.canvasWidth / 2 - this.ninja.width / 2;
        this.ninja.y = this.canvasHeight - 100;
        this.ninja.hiding = false;
        this.ninja.visible = true;
        
        // 敵・障害物生成
        this.generateLevel();
        
        // ゲームループ開始
        this.gameLoop();
    }
    
    generateLevel() {
        this.guards = [];
        this.cats = [];
        this.obstacles = [];
        
        // 見張りの目を配置
        for (let i = 0; i < 10; i++) {
            this.guards.push({
                x: Math.random() * (this.canvasWidth - 60),
                y: -200 - (i * 200),
                width: 60,
                height: 20,
                direction: Math.random() > 0.5 ? 1 : -1,
                speed: 1 + Math.random(),
                range: 80 + Math.random() * 40,
                alertLevel: 0
            });
        }
        
        // 猫を配置
        for (let i = 0; i < 8; i++) {
            this.cats.push({
                x: Math.random() * (this.canvasWidth - 30),
                y: -150 - (i * 250),
                width: 30,
                height: 20,
                sleepTime: Math.random() * 3000 + 2000,
                awakeBehavior: Math.random() > 0.5
            });
        }
        
        // 石垣の足場を配置
        for (let i = 0; i < 15; i++) {
            this.obstacles.push({
                x: Math.random() * (this.canvasWidth - 100),
                y: -100 - (i * 150),
                width: 100,
                height: 20,
                type: 'platform'
            });
        }
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // 忍者の移動
        if (this.keys.left && this.ninja.x > 0) {
            this.ninja.x -= this.ninja.speed;
        }
        if (this.keys.right && this.ninja.x < this.canvasWidth - this.ninja.width) {
            this.ninja.x += this.ninja.speed;
        }
        
        // 自動上昇（忍び足で登る）
        if (!this.ninja.hiding) {
            this.scrollY += 1;
            this.ninja.y -= 0.5;
        }
        
        // ステージ更新
        this.stage = Math.floor(Math.abs(this.scrollY) / 500) + 1;
        
        // 敵の更新
        this.updateGuards(deltaTime);
        this.updateCats(deltaTime);
        
        // 衝突判定
        this.checkCollisions();
        
        // ステルス度更新
        if (this.ninja.hiding) {
            this.stealthLevel = Math.min(100, this.stealthLevel + 0.5);
        } else {
            this.stealthLevel = Math.max(0, this.stealthLevel - 0.1);
        }
        
        // スコア更新
        this.score += 1;
        
        // クリア判定
        if (this.scrollY >= Math.abs(this.targetY)) {
            this.gameClear();
        }
        
        // UI更新
        this.updateUI();
    }
    
    updateGuards(deltaTime) {
        this.guards.forEach(guard => {
            // 見張りの動き
            guard.x += guard.direction * guard.speed;
            
            if (guard.x <= 0 || guard.x >= this.canvasWidth - guard.width) {
                guard.direction *= -1;
            }
            
            // 忍者を発見するかチェック
            const distance = Math.abs(guard.x - this.ninja.x);
            const verticalDistance = Math.abs((guard.y + this.scrollY) - this.ninja.y);
            
            if (distance < guard.range && verticalDistance < 50 && !this.ninja.hiding) {
                guard.alertLevel += deltaTime;
                if (guard.alertLevel > 1000) {
                    this.gameOver();
                }
            } else {
                guard.alertLevel = Math.max(0, guard.alertLevel - deltaTime * 0.5);
            }
        });
    }
    
    updateCats(deltaTime) {
        this.cats.forEach(cat => {
            cat.sleepTime -= deltaTime;
            
            if (cat.sleepTime <= 0) {
                // 猫が起きた時の処理
                const distance = Math.abs(cat.x - this.ninja.x);
                const verticalDistance = Math.abs((cat.y + this.scrollY) - this.ninja.y);
                
                if (distance < 60 && verticalDistance < 40) {
                    // 「ニャー」と鳴いて敵を呼ぶ
                    this.stealthLevel -= 20;
                    if (this.stealthLevel <= 0) {
                        this.gameOver();
                    }
                }
                
                cat.sleepTime = Math.random() * 5000 + 3000; // 再び眠る
            }
        });
    }
    
    checkCollisions() {
        // 障害物との衝突（足場として使用）
        this.obstacles.forEach(obstacle => {
            const obstacleScreenY = obstacle.y + this.scrollY;
            
            if (this.ninja.x < obstacle.x + obstacle.width &&
                this.ninja.x + this.ninja.width > obstacle.x &&
                this.ninja.y < obstacleScreenY + obstacle.height &&
                this.ninja.y + this.ninja.height > obstacleScreenY) {
                
                // 足場の上に立つ
                if (this.ninja.y > obstacleScreenY - 20) {
                    this.ninja.y = obstacleScreenY - this.ninja.height;
                }
            }
        });
    }
    
    render() {
        // 画面クリア
        this.ctx.fillStyle = 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 背景（石垣）
        this.drawBackground();
        
        // 障害物（足場）
        this.drawObstacles();
        
        // 敵
        this.drawGuards();
        this.drawCats();
        
        // 忍者
        this.drawNinja();
        
        // 殿様の部屋（ゴール）
        if (this.scrollY >= Math.abs(this.targetY) - 200) {
            this.drawLordRoom();
        }
    }
    
    drawBackground() {
        // 石垣のパターン
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        
        for (let y = -100; y < this.canvasHeight + 100; y += 50) {
            for (let x = 0; x < this.canvasWidth; x += 80) {
                const drawY = y + (this.scrollY % 50);
                this.ctx.fillRect(x, drawY, 78, 48);
                this.ctx.strokeRect(x, drawY, 78, 48);
            }
        }
    }
    
    drawObstacles() {
        this.ctx.fillStyle = '#8b4513';
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        
        this.obstacles.forEach(obstacle => {
            const y = obstacle.y + this.scrollY;
            if (y > -50 && y < this.canvasHeight + 50) {
                this.ctx.fillRect(obstacle.x, y, obstacle.width, obstacle.height);
                this.ctx.strokeRect(obstacle.x, y, obstacle.width, obstacle.height);
            }
        });
    }
    
    drawGuards() {
        this.guards.forEach(guard => {
            const y = guard.y + this.scrollY;
            if (y > -50 && y < this.canvasHeight + 50) {
                // 見張りの目
                this.ctx.fillStyle = guard.alertLevel > 500 ? '#ff0000' : '#ffff00';
                this.ctx.fillRect(guard.x, y, guard.width, guard.height);
                
                // 目
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(guard.x + 10, y + 5, 8, 8);
                this.ctx.fillRect(guard.x + 42, y + 5, 8, 8);
                
                // 警戒範囲（デバッグ用）
                if (guard.alertLevel > 0) {
                    this.ctx.strokeStyle = 'rgba(255,0,0,0.3)';
                    this.ctx.strokeRect(guard.x - guard.range/2, y - 25, guard.range, 50);
                }
            }
        });
    }
    
    drawCats() {
        this.cats.forEach(cat => {
            const y = cat.y + this.scrollY;
            if (y > -50 && y < this.canvasHeight + 50) {
                // 猫
                this.ctx.fillStyle = cat.sleepTime > 2000 ? '#666' : '#ff6b6b';
                this.ctx.fillRect(cat.x, y, cat.width, cat.height);
                
                // 猫の目（寝ているか起きているか）
                this.ctx.fillStyle = '#000';
                if (cat.sleepTime > 2000) {
                    // 寝ている目（線）
                    this.ctx.fillRect(cat.x + 5, y + 8, 6, 2);
                    this.ctx.fillRect(cat.x + 19, y + 8, 6, 2);
                } else {
                    // 起きている目（円）
                    this.ctx.beginPath();
                    this.ctx.arc(cat.x + 8, y + 8, 3, 0, Math.PI * 2);
                    this.ctx.arc(cat.x + 22, y + 8, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // 尻尾
                this.ctx.fillStyle = '#444';
                this.ctx.fillRect(cat.x + cat.width, y + 5, 8, 3);
            }
        });
    }
    
    drawNinja() {
        if (!this.ninja.visible) return;
        
        // 隠れている時は半透明
        this.ctx.globalAlpha = this.ninja.hiding ? 0.3 : 1.0;
        
        // 忍者の体
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.ninja.x, this.ninja.y, this.ninja.width, this.ninja.height);
        
        // 忍者の目
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(this.ninja.x + 8, this.ninja.y + 8, 6, 4);
        this.ctx.fillRect(this.ninja.x + 26, this.ninja.y + 8, 6, 4);
        
        // 刀
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(this.ninja.x + this.ninja.width - 5, this.ninja.y + 5, 3, 20);
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawLordRoom() {
        const roomY = this.targetY + this.scrollY + 50;
        
        // 殿様の部屋（背景）
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(0, roomY, this.canvasWidth, 200);
        
        // 畳の模様
        this.ctx.fillStyle = '#228b22';
        for (let x = 0; x < this.canvasWidth; x += 60) {
            for (let y = 0; y < 200; y += 40) {
                this.ctx.fillRect(x, roomY + y, 58, 38);
            }
        }
        
        // 殿様（寝ている）
        const lordX = this.canvasWidth / 2 - 40;
        const lordY = roomY + 100;
        
        // 布団
        this.ctx.fillStyle = '#ff69b4';
        this.ctx.fillRect(lordX - 10, lordY, 100, 60);
        
        // 殿様の体
        this.ctx.fillStyle = '#ffdbac';
        this.ctx.fillRect(lordX, lordY + 10, 80, 40);
        
        // 殿様の頭
        this.ctx.beginPath();
        this.ctx.arc(lordX + 40, lordY + 20, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 寝ている表現（zzz）
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('💤', lordX + 60, lordY - 10);
        
        // ゴール判定
        if (this.ninja.x > lordX - 20 && this.ninja.x < lordX + 100 &&
            this.ninja.y > lordY - 20 && this.ninja.y < lordY + 80) {
            this.gameClear();
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = `忍度: ${this.score}点`;
        document.getElementById('stage').textContent = `階: ${this.stage}F`;
        document.getElementById('stealth').textContent = `隠密度: ${Math.round(this.stealthLevel)}%`;
        
        // ステルス度による色変更
        const stealthElement = document.getElementById('stealth');
        if (this.stealthLevel > 70) {
            stealthElement.style.color = '#00ff00';
        } else if (this.stealthLevel > 30) {
            stealthElement.style.color = '#ffff00';
        } else {
            stealthElement.style.color = '#ff0000';
        }
    }
    
    gameClear() {
        this.gameState = 'clear';
        cancelAnimationFrame(this.animationId);
        
        // 最終スコア計算
        let rankText = '見習い忍者';
        if (this.score > 3000 && this.stealthLevel > 80) {
            rankText = '伝説の忍者';
        } else if (this.score > 2000 && this.stealthLevel > 60) {
            rankText = '上忍';
        } else if (this.score > 1000 && this.stealthLevel > 40) {
            rankText = '中忍';
        } else if (this.stealthLevel > 20) {
            rankText = '下忍';
        }
        
        document.getElementById('finalScore').textContent = `忍度: ${this.score}点`;
        document.getElementById('clearRank').textContent = `忍者ランク: ${rankText}`;
        
        // 画面切り替え
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('clearScreen').style.display = 'block';
        
        // 成功音効果（Web Audio API使用）
        this.playSuccessSound();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        cancelAnimationFrame(this.animationId);
        
        // 画面切り替え
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('gameoverScreen').style.display = 'block';
        
        // 失敗音効果
        this.playFailSound();
    }
    
    playSuccessSound() {
        try {
            // Web Audio APIで成功音を生成
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playFailSound() {
        try {
            // Web Audio APIで失敗音を生成
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new NinjaGame();
});

// PWA対応（オフライン動作）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}