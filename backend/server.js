const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Cargar variables de entorno
try { require('dotenv').config(); } catch (_) {}

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'change-me-in-env';

// 🔥 IMPORTANTE: usar nombre del servicio de docker (mongo)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/pokemon_app';

// ==========================
// 🔌 CONEXIÓN + SEED USUARIO
// ==========================
mongoose.connect(MONGODB_URI).then(async () => {
    const redacted = MONGODB_URI.replace(/(mongodb(?:\+srv)?:\/\/)([^@]+)@/, '$1****@');
    console.log(`[MongoDB] Conectado a: ${redacted}`);

    try {
        // 🔥 Crear usuario default si no existe
        const existingUser = await User.findOne({ username: 'admin' });

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash('pokemon123', 10);

            await User.create({
                username: 'admin',
                password: hashedPassword,
                favorites: []
            });

            console.log('✅ Usuario default creado');
            console.log('👤 Username: admin');
            console.log('🔑 Password: pokemon123');
        } else {
            console.log('ℹ️ Usuario default ya existe');
        }

    } catch (error) {
        console.error('❌ Error creando usuario default:', error.message);
    }

}).catch(err => {
    console.error('[MongoDB] Error de conexión:', err.message);
});

// ==========================
// 🧩 MIDDLEWARES
// ==========================
app.use(cors());
app.use(express.json());

// Middleware para verificar token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.username = decoded.username;
        next();
    });
};

// ==========================
// 👤 AUTENTICACIÓN
// ==========================
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword,
            favorites: []
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully' });

    } catch (error) {
        res.status(400).json({ message: 'Error creating user' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ token, expiresIn: 3600 });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================
// ⭐ FAVORITOS
// ==========================
app.post('/api/favorites', verifyToken, async (req, res) => {
    try {
        const { pokemonId, name, sprite } = req.body;
        const user = await User.findOne({ username: req.username });

        if (!user.favorites.some(fav => fav.pokemonId === pokemonId)) {
            user.favorites.push({ pokemonId, name, sprite });
            await user.save();
        }

        res.json({ message: 'Added to favorites', favorites: user.favorites });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/favorites', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.username });
        res.json(user.favorites);

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================
// 🚀 SERVER
// ==========================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
