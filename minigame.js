document.addEventListener('DOMContentLoaded', function() {
    const placeholder = document.querySelector('.mini-game-placeholder');
    const gameOverlay = document.querySelector('.game-overlay');
    const gameCanvas = document.getElementById('gameCanvas');
    let player;
    let scoreValue;
    let timerValue;
    let score = 0;
    let gameActive = false;
    let spawnInterval;
    let gameTimer;
    const gameDuration = 30;
    let fallDuration = 2000; // Уменьшаем начальное время падения
    const minFallDuration = 800; // Уменьшаем минимальное время падения
    const accelerationRate = 20; // Увеличиваем скорость ускорения
    const bombProbability = 0.095; // Немного уменьшаем вероятность бомбы
    const specialTargetProbability = 0.035;
    const greenSpecialProbability = 0.001; // 5% шанс для зеленого шара
    const minSpawnInterval = 300; // Уменьшаем минимальный интервал спавна
    const maxSpawnInterval = 800; // Уменьшаем максимальный интервал спавна

    let debugLog = [];

    function log(message) {
        console.log(message);
        debugLog.push(`${new Date().toISOString()}: ${message}`);
        if (debugLog.length > 100) debugLog.shift();
    }

    placeholder.addEventListener('click', startGame);
    document.querySelector('.close-game').addEventListener('click', closeGame);

    function startGame() {
        log('Game started');
        gameOverlay.style.display = 'flex';
        gameOverlay.style.justifyContent = 'center';
        gameOverlay.style.alignItems = 'center';
        gameActive = true;
        score = 0;
        
        gameOverlay.style.position = 'fixed';
        gameOverlay.style.top = '0';
        gameOverlay.style.left = '0';
        gameOverlay.style.width = '100%';
        gameOverlay.style.height = '100%';
        gameOverlay.style.overflow = 'hidden';
        gameOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        
        gameCanvas.style.display = 'block';
        gameCanvas.style.position = 'relative';
        gameCanvas.style.width = '90vmin';
        gameCanvas.style.height = '90vmin';
        gameCanvas.style.backgroundColor = '#000';
        
        gameCanvas.innerHTML = `
            <div id="timer">Time: <span id="timerValue">${gameDuration}</span></div>
            <div id="score">Score: <span id="scoreValue">0</span></div>
            <div id="player"></div>
        `;
        
        player = document.getElementById('player');
        scoreValue = document.getElementById('scoreValue');
        timerValue = document.getElementById('timerValue');
        scoreValue.textContent = score;
        timerValue.textContent = gameDuration;
        
        fallDuration = 2000;
        
        gameCanvas.addEventListener('touchmove', movePlayerTouch, { passive: false });
        gameCanvas.addEventListener('mousemove', movePlayerMouse);
        
        let lastSpawnTime = Date.now();
        
        function spawnLoop() {
            const currentTime = Date.now();
            if (currentTime - lastSpawnTime >= getRandomSpawnInterval()) {
                spawnTarget();
                lastSpawnTime = currentTime;
            }
            if (gameActive) {
                requestAnimationFrame(spawnLoop);
            }
        }
        
        spawnLoop();
        
        let timeLeft = gameDuration;
        gameTimer = setInterval(() => {
            timeLeft--;
            timerValue.textContent = timeLeft;
            log(`Time left: ${timeLeft}`);
            
            if (timeLeft <= 0) {
                log('Timer reached zero');
                endGame('Timer');
            }
        }, 1000);

        adjustGameSize();
        
        addGlobalMouseListener();
    }

    function addGlobalMouseListener() {
        document.addEventListener('mousemove', (e) => {
            if (gameActive) {
                const gameRect = gameCanvas.getBoundingClientRect();
                const x = e.clientX - gameRect.left;
                movePlayer(x);
            }
        });
    }

    function getRandomSpawnInterval() {
        return Math.random() * (maxSpawnInterval - minSpawnInterval) + minSpawnInterval;
    }

    function closeGame() {
        gameOverlay.style.display = 'none';
        gameActive = false;
        clearTimeout(spawnInterval);
        clearInterval(gameTimer);
        gameCanvas.removeEventListener('touchmove', movePlayerTouch);
        gameCanvas.removeEventListener('mousemove', movePlayerMouse);
    }

    function movePlayerTouch(e) {
        if (!gameActive) return;
        e.preventDefault();
        const touch = e.touches[0];
        const gameRect = gameCanvas.getBoundingClientRect();
        const x = touch.clientX - gameRect.left;
        movePlayer(x);
    }

    function movePlayerMouse(e) {
        if (!gameActive) return;
        const gameRect = gameCanvas.getBoundingClientRect();
        const x = e.clientX - gameRect.left;
        movePlayer(x);
    }

    function movePlayer(x) {
        const gameRect = gameCanvas.getBoundingClientRect();
        const playerWidth = player.offsetWidth;
        const minX = 0;
        const maxX = gameRect.width - playerWidth;
        const clampedX = Math.max(minX, Math.min(x, maxX));
        player.style.left = `${clampedX}px`;
    }

    function adjustGameSize() {
        const gameSize = Math.min(window.innerWidth, window.innerHeight) * 0.9;
        gameCanvas.style.width = `${gameSize}px`;
        gameCanvas.style.height = `${gameSize}px`;
        
        player.style.width = `${gameSize * 0.1}px`;
        player.style.height = `${gameSize * 0.1}px`;
        player.style.bottom = '10%';
        
        log(`Game size adjusted. Width: ${gameSize}, Height: ${gameSize}`);
    }

    function spawnTarget() {
        if (!gameActive) {
            log('Attempted to spawn target when game is not active');
            return;
        }

        const random = Math.random();
        let targetType;
        if (random < bombProbability) {
            targetType = 'bomb';
        } else if (random < bombProbability + specialTargetProbability) {
            targetType = 'special';
        } else if (random < bombProbability + specialTargetProbability + greenSpecialProbability) {
            targetType = 'green-special';
        } else {
            targetType = 'target';
        }

        const target = document.createElement('div');
        target.classList.add(targetType);
        
        const gameCanvasRect = gameCanvas.getBoundingClientRect();
        const maxLeft = gameCanvasRect.width - 30; // 30 - примерная ширина цели
        const leftPosition = Math.random() * maxLeft;
        target.style.left = `${leftPosition}px`;
        target.style.top = '-30px';
        
        log(`Spawning ${targetType} at left: ${leftPosition}, gameCanvas width: ${gameCanvasRect.width}`);
        
        gameCanvas.appendChild(target);

        const currentFallDuration = fallDuration * (Math.random() * 0.4 + 0.8);
        const startTime = Date.now();

        function fall() {
            if (!gameActive || !gameCanvas.contains(target)) {
                return;
            }

            const elapsedTime = Date.now() - startTime;
            const progress = elapsedTime / currentFallDuration;
            
            if (progress < 1) {
                const newTop = progress * (gameCanvasRect.height + 30);
                target.style.top = `${newTop}px`;
                requestAnimationFrame(fall);
            } else {
                if (gameCanvas.contains(target)) {
                    if (targetType !== 'target') {
                        gameCanvas.removeChild(target);
                    }
                    // Для обычных шариков проверка пропуска происходит в checkCollision
                }
            }
        }

        fall();

        checkCollision(target, targetType);

        fallDuration = Math.max(fallDuration - accelerationRate, minFallDuration);
    }

    function checkCollision(target, targetType) {
        function checkCollisionFrame() {
            if (!gameActive || !gameCanvas.contains(target)) {
                return;
            }

            const playerRect = player.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const gameCanvasRect = gameCanvas.getBoundingClientRect();

            // Определяем верхнюю часть игрового курсора (например, верхние 20%)
            const playerTopRect = {
                left: playerRect.left,
                right: playerRect.right,
                top: playerRect.top,
                bottom: playerRect.top + playerRect.height * 0.2
            };

            if (targetRect.bottom >= playerTopRect.top && targetRect.top <= playerTopRect.bottom) {
                if (
                    playerTopRect.left < targetRect.right &&
                    playerTopRect.right > targetRect.left
                ) {
                    if (gameCanvas.contains(target)) {
                        gameCanvas.removeChild(target);
                        log(`Collision detected with ${targetType}`);
                        if (targetType === 'bomb') {
                            score = Math.max(0, score - 100);
                            showEffect('-100', 'bomb');
                            shakeScreen();
                        } else if (targetType === 'special') {
                            score += 100;
                            showEffect('+100', 'special');
                        } else if (targetType === 'green-special') {
                            updateTotalMTH(1);
                            showEffect('+1 MTH', 'green-special');
                        } else {
                            score += 5;
                            showEffect('+5', 'target');
                        }
                        scoreValue.textContent = score;
                    }
                }
            } else if (targetRect.top > gameCanvasRect.bottom) {
                // Удаляем шар, только когда он полностью ушел за нижнюю границу
                if (gameCanvas.contains(target)) {
                    gameCanvas.removeChild(target);
                }
            }

            if (gameCanvas.contains(target)) {
                requestAnimationFrame(checkCollisionFrame);
            }
        }

        requestAnimationFrame(checkCollisionFrame);
    }

    function showEffect(value, type) {
        const effect = document.createElement('div');
        effect.classList.add('effect');
        effect.textContent = value;
        effect.style.color = type === 'special' ? '#c0c0c0' : 
                             (type === 'bomb' ? '#ff0000' : 
                             (type === 'green-special' ? '#00ff00' : '#ffffff'));
        effect.style.position = 'absolute';
        effect.style.top = '50%';
        effect.style.left = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.fontSize = '24px';
        effect.style.fontWeight = 'bold';
        effect.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        effect.style.opacity = '0';
        effect.style.transition = 'opacity 0.5s ease-out';
        
        if (type === 'special') {
            effect.style.textShadow = '0 0 10px #ffffff, 0 0 20px #c0c0c0';
        } else if (type === 'target') {
            effect.style.textShadow = '0 0 10px #ffffff';
        } else if (type === 'green-special') {
            effect.style.textShadow = '0 0 10px #00ff00, 0 0 20px #008000';
        }
        
        gameCanvas.appendChild(effect);
        
        setTimeout(() => {
            effect.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            effect.style.opacity = '0';
        }, 400);
        
        setTimeout(() => {
            if (gameCanvas.contains(effect)) {
                gameCanvas.removeChild(effect);
            }
        }, 900);
    }

    function endGame(reason) {
        if (!gameActive) {
            log('endGame called when game was already inactive');
            return;
        }
        log(`Game ended. Reason: ${reason}`);
        gameActive = false;
        clearTimeout(spawnInterval);
        clearInterval(gameTimer);
        const finalScore = score;
        gameCanvas.innerHTML = `
            <div style="color: white; font-size: 24px; text-align: center; padding-top: 40%;">
                Game Over!<br>Score: ${finalScore}
            </div>
        `;
        gameCanvas.removeEventListener('touchmove', movePlayerTouch);
        gameCanvas.removeEventListener('mousemove', movePlayerMouse);
        
        updateTotalFarmed(finalScore);
        
        log('Debug log:');
        debugLog.forEach(entry => log(entry));
        
        setTimeout(closeGame, 3000);
    }

    function updateTotalFarmed(gameScore) {
        const telegramId = localStorage.getItem('telegramId');
        if (telegramId) {
            const userRef = database.ref('users/' + telegramId);
            userRef.once('value', (snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    let currentTotalFarmed = userData.totalFarmed || 0;
                    let newTotalFarmed = currentTotalFarmed + gameScore;
                    
                    userRef.update({ totalFarmed: newTotalFarmed });
                    animateBalance(currentTotalFarmed, newTotalFarmed, 1000, 'totalFarmed');
                }
            });
        }
    }

    function updateTotalMTH(amount) {
        const telegramId = localStorage.getItem('telegramId');
        if (telegramId) {
            const userRef = database.ref('users/' + telegramId);
            userRef.once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    let currentTotalMTH = userData.mthtotalfarmed || 0;
                    let newTotalMTH = currentTotalMTH + amount;
                    
                    return userRef.update({ mthtotalfarmed: newTotalMTH });
                }
            }).then(() => {
                console.log('MTH updated successfully');
                // Обновляем отображение на странице
                const totalMTHDisplay = document.getElementById('totalMTH');
                if (totalMTHDisplay) {
                    let currentDisplayed = parseInt(totalMTHDisplay.textContent) || 0;
                    let newTotal = currentDisplayed + amount;
                    totalMTHDisplay.textContent = formatNumber(newTotal);
                }
            }).catch((error) => {
                console.error('Error updating MTH:', error);
            });
        }
    }

    function shakeScreen() {
        gameCanvas.classList.add('shake');
        setTimeout(() => {
            gameCanvas.classList.remove('shake');
        }, 500);
    }

    function preventSwipe(e) {
        if (e.target === gameCanvas || e.target.closest('#gameCanvas')) {
            e.preventDefault();
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        const balanceCircle = document.getElementById('balanceCircle');
        const mthcBalance = document.getElementById('mthcBalance');
        const mthBalance = document.getElementById('mthBalance');

        balanceCircle.addEventListener('click', function() {
            mthcBalance.classList.toggle('active');
            mthBalance.classList.toggle('active');
        });
    });
});