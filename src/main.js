import { Telegraf, Markup } from 'telegraf';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyDWyM2cBDleys0M6GIDmtBjI4TsImceh5o',
  authDomain: 'method-e6c6c.firebaseapp.com',
  databaseURL: 'https://method-e6c6c-default-rtdb.firebaseio.com',
  projectId: 'method-e6c6c',
  storageBucket: 'method-e6c6c.appspot.com',
  messagingSenderId: '993831279121',
  appId: '1:993831279121:web:e1ce833088d75b6c6e6fb0',
  measurementId: 'G-G4N4T1C7NR'
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Инициализация бота Telegraf
const token = '6799316143:AAH9rHIoXPrUOz5qJe7XC6ibGgAA5B0G3g0'; // замените на ваш токен
const webAppUrl = 'https://method-e6c6c.web.app'; // ваш URL веб-приложения
const bot = new Telegraf(token);

// Функция для получения данных пользователя из Firebase
async function getUserData(telegramId) {
  const usersRef = ref(database, 'users/' + telegramId);
  const snapshot = await get(usersRef);
  return snapshot.exists() ? snapshot.val() : null;
}

// Функция для создания пользователя в Firebase
async function createUser(telegramId, telegramUsername) {
  const usersRef = ref(database, 'users/' + telegramId);
  const userData = {
    telegramId: telegramId,
    telegramUsername: telegramUsername,
    totalFarmed: 0,
    mthtotalfarmed: 0, // Добавляем это поле
    friendsCount: 0,
    tasks: {
      task1: { completed: false },
      task2: { completed: false },
      task3: { completed: false }
    },
    farmingState: {
      isActive: false,
      startTime: null,
      endTime: null
    }
  };

  try {
    await set(usersRef, userData);
    console.log('The user has been successfully created in the database');
  } catch (error) {
    console.error('Error creating a user in the database:', error);
  }
}

// Обновленная функция getUserReferralLink
async function getUserReferralLink(telegramId) {
  const userRef = ref(database, `users/${telegramId}`);
  const userSnapshot = await get(userRef);
  
  if (userSnapshot.exists() && userSnapshot.val().referralCode) {
    return `https://t.me/${bot.botInfo.username}?start=${userSnapshot.val().referralCode}`;
  } else {
    const referralCode = Math.random().toString(36).substring(2, 15);
    await set(ref(database, `users/${telegramId}/referralCode`), referralCode);
    await set(ref(database, `inviteCodes/${referralCode}`), {
      telegramId: telegramId,
      createdAt: Date.now()
    });
    return `https://t.me/${bot.botInfo.username}?start=${referralCode}`;
  }
}

// Обновленная команда /start
bot.command('start', async (ctx) => {
  try {
    console.log('/start command called');
    const user = ctx.message.from;
    const telegramId = user.id.toString();
    const telegramUsername = user.username;
    const startPayload = ctx.message.text.split(' ')[1]; // Извлекаем payload из команды

    console.log('Payload:', startPayload);

    // Проверяем, существует ли пользователь в базе данных Firebase
    let userData = await getUserData(telegramId);
    console.log('User data from Firebase:', userData);

    if (!userData) {
      // Если пользователь не существует, создаем его
      await createUser(telegramId, telegramUsername);
      userData = await getUserData(telegramId);

      // Проверяем, был ли пользователь приглашен по реферальной ссылке
      if (startPayload) {
        const inviteCodeRef = ref(database, `inviteCodes/${startPayload}`);
        const inviteCodeSnapshot = await get(inviteCodeRef);
        if (inviteCodeSnapshot.exists()) {
          const inviterTelegramId = inviteCodeSnapshot.val().telegramId;
          console.log('The user who invited:', inviterTelegramId);

          // Обновляем данные пользователя, добавляя информацию о пригласившем
          await set(ref(database, `users/${telegramId}/referredBy`), inviterTelegramId);

          // Увеличиваем счетчик приглашенных друзей у пригласившего пользователя
          const inviterRef = ref(database, `users/${inviterTelegramId}`);
          const inviterSnapshot = await get(inviterRef);
          if (inviterSnapshot.exists()) {
            const inviterData = inviterSnapshot.val();
            const currentFriendsCount = inviterData.friendsCount || 0;
            await set(ref(database, `users/${inviterTelegramId}/friendsCount`), currentFriendsCount + 1);
            
            // Добавляем нового пользователя в список приглашенных друзей
            await set(ref(database, `users/${inviterTelegramId}/invitedFriends/${telegramId}`), telegramUsername);

            // Оправляем уведомление приласившему пользователю
            await bot.telegram.sendMessage(inviterTelegramId, `You have a new invited friend: ${telegramUsername || 'User'}!`);
          }

          console.log('The data has been updated for the invited user');
        }
      }
    }

    // Обновляем username, если он изменился
    if (userData.telegramUsername !== telegramUsername) {
      const userRef = ref(database, 'users/' + telegramId);
      await set(userRef, { ...userData, telegramUsername: telegramUsername });
    }

    // Создаем кнопки
    const enterButton = Markup.button.webApp('Join to Method', `${webAppUrl}?telegramId=${telegramId}`);
    const referralButton = Markup.button.callback('Get a referral link', 'generate_referral');

    // Отправляем новое сообщение с кнопками
    await ctx.reply(
      'Добро пожаловать в Method! ☑️\n\n' +
      'Вот что вы можете сделать с Method прямо сейчас:\n\n' +
      '📊 Farm $MTHC: Начинайте фармить $MTHC, чтобы в будущем обменять валюту на наш токен $MTH или же $TON\n' +
      '🤖 Приглашайте друзей: Приведите своих друзей и родственников, чтобы получить больше $MTHC! Больше друзей = больше $MTHC\n' +
      '✅ Выполняйте задания: Завершайте задачи и зарабатывайте еще больше $MTHC!\n\n' +
      'Начните зарабатывать $MTHC уже сейчас, и, возможно, в будущем вас ждут удивительные награды! 🚀\n\n' +
      'Оставайтесь с METHOD!💎', 
      Markup.inlineKeyboard([
        [enterButton],
        [referralButton]
      ])
    );
  } catch (error) {
    console.error('Error with /start command:', error);
    ctx.reply('An error occurred while processing your request. Please try again later.');
  }
});

// Обработчик для кнопки "Получить реферальную ссылку"
bot.action('generate_referral', async (ctx) => {
  try {
    const user = ctx.from;
    const telegramId = user.id.toString();
    const referralLink = await getUserReferralLink(telegramId);

    const shareText = encodeURIComponent(`Join the METHOD with me and earn $MTHC -`);
    const shareUrl = `https://t.me/share/url?text=${shareText}&url=${referralLink}`;

    await ctx.answerCbQuery(); // Отвечаем на callback query
    await ctx.reply(`Your referral link: ${referralLink}`, Markup.inlineKeyboard([
      [Markup.button.url('Share a link', shareUrl)]
    ]));
  } catch (error) {
    console.error('Error when generating a referral link:', error);
    ctx.answerCbQuery('An error occurred while generating the referral link.');
  }
});

// Запуск бота
bot.launch().then(() => {
  console.log('The bot has been successfully launched');
}).catch((err) => {
  console.error('Error when launching the bot', err);
});

// Обработка ошибок
bot.catch((err) => {
  console.log('Oops, there was an error in the bot:', err);
});