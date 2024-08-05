// Проверяем, инициализирован ли Firebase
if (!firebase.apps.length) {
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
    firebase.initializeApp(firebaseConfig);
}

// Инициализация Auth и Database только один раз
window.auth = firebase.auth();
window.database = firebase.database();
