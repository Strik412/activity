const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function initializeDb() {
    // Usar la misma URI que el backend: revisar variable de entorno o fallback
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon_app';
    try {
        console.log(`Conectando a MongoDB en: ${mongoUri}`);
        await mongoose.connect(mongoUri);
        
        // Crear usuario por defecto
        const defaultUser = {
            username: 'admin',
            password: await bcrypt.hash('pokemon123', 10)
        };

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ username: defaultUser.username });
        if (!existingUser) {
            await User.create(defaultUser);
            console.log('Usuario por defecto creado:');
            console.log('Username: admin');
            console.log('Password: pokemon123');
        } else {
            console.log('Usuario por defecto ya existe en la BD.');
        }

        await mongoose.disconnect();
        console.log('Desconectado de MongoDB.');
    } catch (error) {
        console.error('Error inicializando la BD:', error.message || error);
        process.exit(1);
    }
}

initializeDb();
