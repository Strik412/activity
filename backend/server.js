const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your-secret-key';

mongoose.connect('mongodb://mongo:27017/pokemon_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(cors());
app.use(express.json());

// Middleware para verificar token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.username = decoded.username;
        next();
    });
};

// Ruta para registrar usuario (opcional)
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
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
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Agregar a favoritos
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

// Obtener favoritos
app.get('/api/favorites', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.username });
        res.json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
