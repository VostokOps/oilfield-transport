const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock database
let users = [
    { id: 1, username: 'driver1', password: 'pass', role: 'driver', name: 'Иван Петров', car: 'Toyota Land Cruiser', carNumber: 'A123BC' },
    { id: 2, username: 'passenger1', password: 'pass', role: 'passenger', name: 'Алексей Сидоров', department: 'Геология' },
    { id: 3, username: 'dispatcher', password: 'pass', role: 'dispatcher', name: 'Мария Иванова' }
];

let trips = [];
let destinations = ['Цех №1', 'Цех №2', 'Офисное здание', 'Склад', 'Буровая площадка'];

// Auth middleware
const authenticate = (req, res, next) => {
    const { username, password } = req.headers;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) return res.status(401).send('Неверные учетные данные');
    
    req.user = user;
    next();
};

// Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) return res.status(401).send('Неверные учетные данные');
    
    res.json(user);
});

// Trip endpoints
app.get('/api/trips', authenticate, (req, res) => {
    if (req.user.role === 'driver') {
        res.json(trips.filter(t => t.driverId === req.user.id));
    } else if (req.user.role === 'passenger') {
        res.json(trips.filter(t => t.passengerId === req.user.id));
    } else {
        res.json(trips);
    }
});

app.post('/api/trips', authenticate, (req, res) => {
    if (req.user.role !== 'passenger' && req.user.role !== 'dispatcher') {
        return res.status(403).send('Только пассажиры и диспетчеры могут создавать поездки');
    }
    
    const trip = {
        id: trips.length + 1,
        passengerId: req.body.passengerId || req.user.id,
        passengerName: users.find(u => u.id === (req.body.passengerId || req.user.id)).name,
        from: req.body.from,
        to: req.body.to,
        scheduledTime: req.body.scheduledTime || new Date().toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    trips.push(trip);
    res.status(201).json(trip);
});

app.put('/api/trips/:id', authenticate, (req, res) => {
    const trip = trips.find(t => t.id === parseInt(req.params.id));
    
    if (!trip) return res.status(404).send('Поездка не найдена');
    
    if (req.user.role === 'dispatcher') {
        // Диспетчер может изменять любые поля
        Object.assign(trip, req.body);
    } else if (req.user.role === 'passenger' && req.user.id === trip.passengerId) {
        // Пассажир может только задерживать машину
        if (req.body.delayReason) {
            trip.delayReason = req.body.delayReason;
            trip.status = 'delayed';
        }
    } else if (req.user.role === 'driver' && req.user.id === trip.driverId) {
        // Водитель может только обновлять статус
        if (req.body.status) {
            trip.status = req.body.status;
        }
    } else {
        return res.status(403).send('Нет прав для изменения поездки');
    }
    
    res.json(trip);
});

// User management (only for dispatcher)
app.get('/api/users', authenticate, (req, res) => {
    if (req.user.role !== 'dispatcher') return res.status(403).send('Только для диспетчера');
    res.json(users);
});

app.post('/api/users', authenticate, (req, res) => {
    if (req.user.role !== 'dispatcher') return res.status(403).send('Только для диспетчера');
    
    const newUser = {
        id: users.length + 1,
        ...req.body
    };
    
    users.push(newUser);
    res.status(201).json(newUser);
});

app.put('/api/users/:id', authenticate, (req, res) => {
    if (req.user.role !== 'dispatcher') return res.status(403).send('Только для диспетчера');
    
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).send('Пользователь не найден');
    
    Object.assign(user, req.body);
    res.json(user);
});

// Destinations
app.get('/api/destinations', authenticate, (req, res) => {
    res.json(destinations);
});

app.post('/api/destinations', authenticate, (req, res) => {
    if (req.user.role !== 'dispatcher') return res.status(403).send('Только для диспетчера');
    
    destinations.push(req.body.name);
    res.status(201).json(destinations);
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));