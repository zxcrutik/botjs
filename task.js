function completeFriendsTask() {
    const button = document.getElementById('friendsTaskButton');
    const database = firebase.database();
    const telegramId = localStorage.getItem('telegramId');

    if (!telegramId) {
        console.error('Telegram ID не найден в localStorage');
        return;
    }

    const userRef = database.ref('users/' + telegramId);

    userRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const friendsCount = userData.friendsCount || 0;
            const currentTotalFarmed = userData.totalFarmed || 0;

            // Обновляем текст кнопки
            button.textContent = `${friendsCount}/1`;

            if (friendsCount >= 1 && !userData.friendsTaskCompleted) {
                // Задача выполнена
                button.textContent = 'Claimed';
                button.disabled = true;
                button.style.opacity = '0.5';

                // Увеличиваем totalFarmed на 300, добавляя к существующему значению
                const newTotalFarmed = currentTotalFarmed + 300;

                // Обновляем данные в Firebase
                userRef.update({
                    totalFarmed: newTotalFarmed,
                    friendsTaskCompleted: true
                }).then(() => {
                    // Обновляем отображение totalFarmed на странице
                    const totalFarmedDisplay = document.getElementById('totalFarmed');
                    if (totalFarmedDisplay) {
                        totalFarmedDisplay.textContent = 'Total Farmed: ' + newTotalFarmed;
                    }
                    console.log('Task completed and totalFarmed updated:', newTotalFarmed);
                }).catch((error) => {
                    console.error('Error updating data:', error);
                });
            }
        }
    });
}

function initTaskPage(telegramId) {
    if (!telegramId) {
        console.error('Telegram ID was not passed to the initTaskPage function');
        return;
    }

    const database = firebase.database();
    const userRef = database.ref('users/' + telegramId);

    userRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const friendsCount = userData.friendsCount || 0;
            const friendsTaskCompleted = userData.friendsTaskCompleted || false;
            const totalFarmed = userData.totalFarmed || 0;
            const methodTaskCompleted = userData.methodTaskCompleted || false;
            const communityJoined = userData.communityJoined || false;

            const friendsTaskButton = document.getElementById('friendsTaskButton');
            if (friendsTaskButton) {
                if (friendsTaskCompleted) {
                    friendsTaskButton.textContent = 'Claimed';
                    friendsTaskButton.disabled = true;
                    friendsTaskButton.style.opacity = '0.5';
                } else {
                    friendsTaskButton.textContent = `${friendsCount}/1`;
                    friendsTaskButton.disabled = friendsCount < 1;
                }
            }

            const methodTaskButton = document.getElementById('methodTaskButton');
            if (methodTaskButton) {
                if (methodTaskCompleted) {
                    methodTaskButton.textContent = 'Claimed';
                    methodTaskButton.disabled = true;
                    methodTaskButton.style.opacity = '0.5';
                } else {
                    methodTaskButton.textContent = `${totalFarmed}/5000`;
                    methodTaskButton.disabled = totalFarmed < 5000;
                }
            }

            const communityTaskButton = document.getElementById('communityTaskButton');
            if (communityTaskButton) {
                if (communityJoined) {
                    communityTaskButton.textContent = 'Claimed';
                    communityTaskButton.disabled = true;
                    communityTaskButton.style.opacity = '0.5';
                } else {
                    communityTaskButton.textContent = 'Join';
                }
            }
        }
    });
}

// Функция для обновления состояния кнопки при загрузке страницы
function updateFriendsButton() {
    const button = document.getElementById('friendsButton');
    const database = firebase.database();
    const telegramId = localStorage.getItem('telegramId');

    if (!telegramId) {
        console.error('Telegram ID not found');
        return;
    }

    if (!button) {
        console.error('The friendsButton button does not exist');
        return;
    }

    const userRef = database.ref('users/' + telegramId);

    userRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const friendsCount = userData.friendsCount || 0;
            const friendsTaskCompleted = userData.friendsTaskCompleted || false;

            if (friendsTaskCompleted) {
                button.textContent = 'Claimed';
                button.disabled = true;
                button.style.opacity = '0.5';
            } else {
                button.textContent = `${friendsCount}/1`;
                button.disabled = friendsCount < 1;
                button.style.opacity = '1';
            }
        } else {
            console.error('The users data was not found');
            button.textContent = '0/1';
            button.disabled = true;
        }
    });
}

function claimFriendsReward() {
    const button = document.getElementById('friendsButton');
    const database = firebase.database();
    const telegramId = localStorage.getItem('telegramId');

    if (!telegramId) {
        console.error('Telegram ID not found');
        return;
    }

    const userRef = database.ref('users/' + telegramId);

    userRef.transaction((userData) => {
        if (userData && userData.friendsCount >= 1 && !userData.friendsTaskCompleted) {
            userData.totalFarmed = (userData.totalFarmed || 0) + 300;
            userData.friendsTaskCompleted = true;
        }
        return userData;
    }, (error, committed, snapshot) => {
        if (error) {
            console.error('Error updating data:', error);
        } else if (committed) {
            const userData = snapshot.val();
            button.textContent = 'Claimed';
            button.disabled = true;
            button.style.opacity = '0.5';
            
            const totalFarmedDisplay = document.getElementById('totalFarmed');
            if (totalFarmedDisplay) {
                totalFarmedDisplay.textContent = 'Total Farmed: ' + userData.totalFarmed;
            }
        }
    });
}

// Функция для обновления friendsCount
function updateFriendsCount(count) {
    const telegramId = localStorage.getItem('telegramId');
    if (!telegramId) {
        console.error('Telegram ID not found');
        return;
    }

    const database = firebase.database();
    const userRef = database.ref('users/' + telegramId);

    userRef.update({ friendsCount: count });
}

function completeMethodTask() {
    const button = document.getElementById('methodTaskButton');
    const database = firebase.database();
    const telegramId = localStorage.getItem('telegramId');

    if (!telegramId) {
        console.error('Telegram ID не найден в localStorage');
        return;
    }

    const userRef = database.ref('users/' + telegramId);

    userRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const currentTotalFarmed = userData.totalFarmed || 0;

            // Обновляем текст кнопки
            button.textContent = `${currentTotalFarmed}/5000`;

            if (currentTotalFarmed >= 5000 && !userData.methodTaskCompleted) {
                // Задача выполнена
                button.textContent = 'Claimed';
                button.disabled = true;
                button.style.opacity = '0.5';

                // Увеличиваем totalFarmed на 400, добавляя к существующему значению
                const newTotalFarmed = currentTotalFarmed + 400;

                // Обновляем данные в Firebase
                userRef.update({
                    totalFarmed: newTotalFarmed,
                    methodTaskCompleted: true
                }).then(() => {
                    // Обновляем отображение totalFarmed на странице
                    const totalFarmedDisplay = document.getElementById('totalFarmed');
                    if (totalFarmedDisplay) {
                        totalFarmedDisplay.textContent = 'Total Farmed: ' + newTotalFarmed;
                    }
                    console.log('Method task completed and totalFarmed updated:', newTotalFarmed);
                }).catch((error) => {
                    console.error('Error updating data:', error);
                });
            }
        }
    });
}

function updateMethodTaskButton() {
    const button = document.getElementById('methodTaskButton');
    const database = firebase.database();
    const telegramId = localStorage.getItem('telegramId');

    if (!telegramId) {
        console.error('Telegram ID not found');
        return;
    }

    if (!button) {
        console.error('The methodTaskButton button does not exist');
        return;
    }

    const userRef = database.ref('users/' + telegramId);

    userRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const totalFarmed = userData.totalFarmed || 0;
            const methodTaskCompleted = userData.methodTaskCompleted || false;

            if (methodTaskCompleted) {
                button.textContent = 'Claimed';
                button.disabled = true;
                button.style.opacity = '0.5';
            } else {
                button.textContent = `${totalFarmed}/5000`;
                button.disabled = totalFarmed < 5000;
                button.style.opacity = '1';
            }
        } else {
            console.error('The users data was not found');
            button.textContent = '0/5000';
            button.disabled = true;
        }
    });
}

function completeCommunityTask() {
    const button = document.getElementById('communityTaskButton');
    const database = firebase.database();
    const telegramId = localStorage.getItem('telegramId');

    if (!telegramId) {
        console.error('Telegram ID не найден в localStorage');
        return;
    }

    const userRef = database.ref('users/' + telegramId);

    userRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const communityJoined = userData.communityJoined || false;
            const currentTotalFarmed = userData.totalFarmed || 0;

            if (!communityJoined) {
                // Открываем ссылку на сообщество в новой вкладке
                window.open('https://t.me/method_community', '_blank');

                // Увеличиваем totalFarmed на 400, добавляя к существующему значению
                const newTotalFarmed = currentTotalFarmed + 400;

                // Обновляем данные в Firebase
                userRef.update({
                    communityJoined: true,
                    totalFarmed: newTotalFarmed
                }).then(() => {
                    button.textContent = 'Claimed';
                    button.disabled = true;
                    button.style.opacity = '0.5';

                    // Обновляем отображение totalFarmed на странице
                    const totalFarmedDisplay = document.getElementById('totalFarmed');
                    if (totalFarmedDisplay) {
                        totalFarmedDisplay.textContent = 'Total Farmed: ' + newTotalFarmed;
                    }
                    console.log('Community task completed and totalFarmed updated:', newTotalFarmed);
                }).catch((error) => {
                    console.error('Error updating data:', error);
                });
            }
        }
    });
}

function updateCommunityTaskButton() {
    const button = document.getElementById('communityTaskButton');
    const database = firebase.database();
    const telegramId = localStorage.getItem('telegramId');

    if (!telegramId) {
        console.error('Telegram ID not found');
        return;
    }

    if (!button) {
        console.error('The communityTaskButton button does not exist');
        return;
    }

    const userRef = database.ref('users/' + telegramId);

    userRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const communityJoined = userData.communityJoined || false;

            if (communityJoined) {
                button.textContent = 'Claimed';
                button.disabled = true;
                button.style.opacity = '0.5';
            } else {
                button.textContent = 'Join';
                button.disabled = false;
                button.style.opacity = '1';
            }
        } else {
            console.error('The users data was not found');
            button.textContent = 'Join';
            button.disabled = false;
        }
    });
}

// Вызываем функцию обновления кнопки при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const telegramId = localStorage.getItem('telegramId');
    
    if (telegramId) {
        const friendsButton = document.getElementById('friendsButton');
        const methodTaskButton = document.getElementById('methodTaskButton');
        const communityTaskButton = document.getElementById('communityTaskButton');
        
        if (friendsButton) {
            updateFriendsButton();
        } else {
            console.error('The friendsButton button does not exist');
        }
        
        if (methodTaskButton) {
            updateMethodTaskButton();
        } else {
            console.error('The methodTaskButton button does not exist');
        }
        
        if (communityTaskButton) {
            updateCommunityTaskButton();
        } else {
            console.error('The communityTaskButton button does not exist');
        }
        
        if (friendsButton) {
            friendsButton.addEventListener('click', claimFriendsReward);
        }
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                if (friendsButton) {
                    updateFriendsButton();
                }
                if (methodTaskButton) {
                    updateMethodTaskButton();
                }
                if (communityTaskButton) {
                    updateCommunityTaskButton();
                }
            }
        });
    } else {
        console.error('Telegram ID not found');
    }
});