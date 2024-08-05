// friends.js

function initFriendsPage(telegramId) {
    console.log('Initializing friends page');
    displayInvitedUsers(telegramId);
    setupClaimButton(telegramId);
}

// Экспортируем функцию в глобальную область видимости
window.initFriendsPage = initFriendsPage;

function displayInvitedUsers(inviterId) {
    const userList = document.getElementById('userList');
    if (!userList) {
        console.error('Element with id "userList" not found');
        return;
    }
    userList.innerHTML = ''; // Очищаем список перед обновлением

    firebase.database().ref(`users/${inviterId}/invitedFriends`).on('value', (snapshot) => {
        const invitedFriends = snapshot.val();
        if (invitedFriends) {
            Object.entries(invitedFriends).forEach(([friendId, friendUsername]) => {
                const listItem = document.createElement('li');
                listItem.textContent = friendUsername;
                listItem.style.color = 'white';
                userList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = 'You dont have any invited friends yet';
            listItem.style.color = 'white';
            userList.appendChild(listItem);
        }
    });

    const claimButton = document.getElementById('claimButton');
    if (!claimButton) {
        console.error('Element with id "claimButton" not found');
        return;
    }

    // Отображаем количество приглашенных друзей
    firebase.database().ref(`users/${inviterId}/friendsCount`).on('value', (snapshot) => {
        const friendsCount = snapshot.val() || 0;
        const friendsCountElement = document.getElementById('friendsCount');
        if (friendsCountElement) {
            friendsCountElement.textContent = `Number of invited friends: ${friendsCount}`;
        }

        claimButton.textContent = `Claim ${friendsCount * 100}`;
        claimButton.disabled = friendsCount === 0;
        claimButton.style.backgroundColor = friendsCount > 0 ? 'green' : 'gray';
    });

    // Проверяем состояние кнопки при загрузке страницы
    checkClaimButtonStatus();
}

function setupClaimButton(telegramId) {
    const claimButton = document.getElementById('claimButton');
    if (!claimButton) {
        console.error('Element with id "claimButton" not found');
        return;
    }

    claimButton.addEventListener('click', async () => {
        console.log('Claim button clicked');
        
        const friendsCountRef = firebase.database().ref(`users/${telegramId}/friendsCount`);
        const totalFarmedRef = firebase.database().ref(`users/${telegramId}/totalFarmed`);
        const claimTimerRef = firebase.database().ref(`users/${telegramId}/claimTimer`);
        
        const friendsCountSnapshot = await friendsCountRef.once('value');
        const totalFarmedSnapshot = await totalFarmedRef.once('value');
        
        const friendsCount = friendsCountSnapshot.val() || 0;
        const currentTotalFarmed = totalFarmedSnapshot.val() || 0;
        const claimAmount = friendsCount * 100;
        
        // Обновляем totalFarmed в Firebase, добавляя к существующему значению
        const newTotalFarmed = currentTotalFarmed + claimAmount;
        await totalFarmedRef.set(newTotalFarmed);
        console.log(`Added ${claimAmount} to total farmed`);

        // Обновляем отображение totalFarmed на главной странице с форматом "k"
        const totalFarmedElement = window.parent.document.getElementById('totalFarmed');
        if (totalFarmedElement) {
            totalFarmedElement.textContent = formatNumber(newTotalFarmed);
        }

       // Показываем сообщение об успешном получении наград
        showPopupMessage(`You have successfully received ${claimAmount.toLocaleString('ru-RU', {useGrouping: true}).replace(/\s/g, '.')} $MTHC!`);
        createCosmicExplosion();
 
        // Устанавливаем таймер в Firebase на 24 часа
        const endTime = Date.now() + 24 * 60 * 60 * 1000; // 24 часа от текущего времени
        await claimTimerRef.set(endTime);

        startCountdown(telegramId, endTime);
    });

    // Проверяем состояние таймера при загрузке страницы
    checkClaimTimerStatus(telegramId);
}

// Добавьте эту новую функцию для форматирования чисел
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else {
        return num.toString();
    }
}

function startCountdown(telegramId, endTime) {
    const claimButton = document.getElementById('claimButton');
    const claimTimerRef = firebase.database().ref(`users/${telegramId}/claimTimer`);
    const friendsCountRef = firebase.database().ref(`users/${telegramId}/friendsCount`);

    const updateCountdown = () => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000));

        if (timeLeft > 0) {
            claimButton.disabled = true;
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;
            claimButton.textContent = `Claim ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            setTimeout(updateCountdown, 1000);
        } else {
            claimTimerRef.remove();
            friendsCountRef.once('value', (snapshot) => {
                const friendsCount = snapshot.val() || 0;
                claimButton.textContent = `Claim ${friendsCount * 100}`;
                claimButton.disabled = false;
                claimButton.style.backgroundColor = 'green';
            });
        }
    };

    updateCountdown();
}

function checkClaimTimerStatus(telegramId) {
    const claimTimerRef = firebase.database().ref(`users/${telegramId}/claimTimer`);
    
    claimTimerRef.once('value', (snapshot) => {
        const endTime = snapshot.val();
        if (endTime) {
            startCountdown(telegramId, endTime);
        }
    });
}

function checkClaimButtonStatus() {
    const claimButton = document.getElementById('claimButton');
    const claimButtonState = localStorage.getItem('claimButtonState');

    if (claimButtonState === 'disabled') {
        claimButton.disabled = true;
        let countdown = 5;
        const countdownInterval = setInterval(() => {
            claimButton.textContent = `Claim ${countdown}`;
            countdown--;
            if (countdown < 0) {
                clearInterval(countdownInterval);
                claimButton.textContent = `Claim`;
                claimButton.disabled = false;
                claimButton.style.backgroundColor = 'green';
                localStorage.setItem('claimButtonState', 'enabled');
            }
        }, 1000);
    }
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const telegramId = urlParams.get('telegramId');
    if (telegramId) {
        initFriendsPage(telegramId);
    } else {
        console.error('Telegram ID not found in URL');
    }
});

function showPopupMessage(message) {
    const popup = document.getElementById('popup-message');
    popup.textContent = message;
    popup.classList.add('show');
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000); // Сообщение будет отображаться 3 секунды
}

function createCosmicExplosion() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 200;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particles.push({
            x: centerX,
            y: centerY,
            size: Math.random() * 4 + 2,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            alpha: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }

    function drawParticle(particle) {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.beginPath();
        ctx.moveTo(-particle.size, -particle.size);
        ctx.lineTo(particle.size, -particle.size);
        ctx.lineTo(0, particle.size * 2);
        ctx.closePath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.fill();
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.alpha *= 0.98;
            particle.size *= 0.99;
            particle.rotation += particle.rotationSpeed;

            drawParticle(particle);

            // Эффект свечения
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.alpha * 0.3;
            ctx.fill();
        });

        if (particles[0].alpha > 0.01) {
            requestAnimationFrame(animate);
        } else {
            document.body.removeChild(canvas);
        }
    }

    animate();
}

// Удалите функцию showTransition, если она есть