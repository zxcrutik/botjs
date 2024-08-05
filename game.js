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
    let fallDuration = 3000;
    const minFallDuration = 1000;
    const accelerationRate = 50;
    const bombProbability = 0.2;
    const specialTargetProbability = 0.1;
    const greenSpecialProbability = 0.05;
    const minSpawnInterval = 500;
    const maxSpawnInterval = 1500;

    placeholder.addEventListener('click', startGame);
    document.querySelector('.close-game').addEventListener('click', closeGame);

    function startGame() {
        gameOverlay.style.display = 'block';
        gameActive = true;
        score = 0;
        
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        document.addEventListener('touchmove', preventSwipe, { passive: false });
        
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
        
        fallDuration = 3000;
        
        gameCanvas.addEventListener('mousemove', movePlayer);
        gameCanvas.addEventListener('touchmove', movePlayerTouch);
        
        scheduleNextSpawn();

        let timeLeft = gameDuration;
        gameTimer = setInterval(() => {
            timeLeft--;
            timerValue.textContent = timeLeft;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function closeGame() {
        gameOverlay.style.display = 'none';
        gameActive = false;
        clearInterval(gameTimer);
        clearTimeout(spawnInterval);
        gameCanvas.innerHTML = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.removeEventListener('touchmove', preventSwipe);
    }

    function movePlayer(e) {
        if (!gameActive) return;
        const rect = gameCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        player.style.left = `${Math.max(0, Math.min(x - player.offsetWidth / 2, gameCanvas.offsetWidth - player.offsetWidth))}px`;
    }

    function movePlayerTouch(e) {
        if (!gameActive) return;
        e.preventDefault();
        const rect = gameCanvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        player.style.left = `${Math.max(0, Math.min(x - player.offsetWidth / 2, gameCanvas.offsetWidth - player.offsetWidth))}px`;
    }

    function scheduleNextSpawn() {
        if (!gameActive) return;
        const delay = Math.random() * (maxSpawnInterval - minSpawnInterval) + minSpawnInterval;
        spawnInterval = setTimeout(() => {
            spawnTarget();
            scheduleNextSpawn();
        }, delay);
    }

    function spawnTarget() {
        if (!gameActive) return;
        const target = document.createElement('div');
        const random = Math.random();
        
        if (random < bombProbability) {
            target.className = 'bomb';
        } else if (random < bombProbability + specialTargetProbability) {
            target.className = 'special';
        } else if (random < bombProbability + specialTargetProbability + greenSpecialProbability) {
            target.className = 'green-special';
        } else {
            target.className = 'target';
        }
        
        target.style.left = `${Math.random() * (gameCanvas.offsetWidth - 30)}px`;
        gameCanvas.appendChild(target);

        const animation = target.animate([
            { top: '-30px' },
            { top: '100%' }
        ], {
            duration: fallDuration,
            easing: 'linear'
        });

        animation.onfinish = () => {
            if (target.className === 'target') {
                score = Math.max(0, score - 50);
                scoreValue.textContent = score;
                showEffect('-50', target.style.left, 'red');
            }
            target.remove();
        };

        checkCollision(target, animation);
    }

    function checkCollision(target, animation) {
        if (!gameActive) return;
        const collision = setInterval(() => {
            const targetRect = target.getBoundingClientRect();
            const playerRect = player.getBoundingClientRect();

            if (
                targetRect.left < playerRect.right &&
                targetRect.right > playerRect.left &&
                targetRect.bottom > playerRect.top &&
                targetRect.top < playerRect.bottom
            ) {
                clearInterval(collision);
                animation.cancel();
                target.remove();

                if (target.className === 'bomb') {
                    score = Math.max(0, score - 100);
                    showEffect('-100', target.style.left, 'red');
                    shakeScreen();
                } else if (target.className === 'special') {
                    score += 150;
                    showEffect('+150', target.style.left, 'gold');
                } else if (target.className === 'green-special') {
                    score += 200;
                    showEffect('+200', target.style.left, 'green');
                } else {
                    score += 50;
                    showEffect('+50', target.style.left, 'cyan');
                }

                scoreValue.textContent = score;
                fallDuration = Math.max(minFallDuration, fallDuration - accelerationRate);
            }

            if (!gameActive) {
                clearInterval(collision);
            }
        }, 10);
    }

    function showEffect(text, left, color) {
        const effect = document.createElement('div');
        effect.textContent = text;
        effect.style.position = 'absolute';
        effect.style.left = left;
        effect.style.top = '50%';
        effect.style.color = color;
        effect.style.fontSize = '24px';
        effect.style.fontWeight = 'bold';
        effect.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        gameCanvas.appendChild(effect);

        effect.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-50px)' }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => effect.remove();
    }

    function endGame() {
        gameActive = false;
        clearInterval(gameTimer);
        clearTimeout(spawnInterval);
        gameCanvas.innerHTML = `
            <div style="text-align: center; color: white;">
                <h2>Game Over</h2>
                <p>Your score: ${score}</p>
                <button onclick="startGame()">Play Again</button>
            </div>
        `;
        updateTotalMTH(score);
    }

    function shakeScreen() {
        gameCanvas.classList.add('shake');
        setTimeout(() => {
            gameCanvas.classList.remove('shake');
        }, 500);
    }

    function preventSwipe(e) {
        e.preventDefault();
    }
});

function updateTotalMTH(amount) {
    const telegramId = localStorage.getItem('telegramId');
    if (telegramId) {
        const userRef = firebase.database().ref('users/' + telegramId);
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

// Предполагается, что функция formatNumber определена где-то в глобальной области видимости