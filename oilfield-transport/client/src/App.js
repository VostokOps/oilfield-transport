import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import DriverDashboard from './pages/DriverDashboard';
import PassengerDashboard from './pages/PassengerDashboard';
import DispatcherDashboard from './pages/DispatcherDashboard';
import './styles.css';

function App() {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <Router>
            <div className="app">
                {user && (
                    <nav className="navbar">
                        <div className="navbar-brand">Нефтяное месторождение - Транспорт</div>
                        <div className="navbar-user">
                            {user.name} ({user.role})
                            <button onClick={handleLogout} className="logout-btn">Выйти</button>
                        </div>
                    </nav>
                )}
                
                <Routes>
                    <Route path="/" element={
                        user ? <Navigate to={`/${user.role}`} /> : <Navigate to="/login" />
                    } />
                    <Route path="/login" element={
                        user ? <Navigate to={`/${user.role}`} /> : <Login onLogin={handleLogin} />
                    } />
                    <Route path="/driver" element={
                        user?.role === 'driver' ? <DriverDashboard user={user} /> : <Navigate to="/login" />
                    } />
                    <Route path="/passenger" element={
                        user?.role === 'passenger' ? <PassengerDashboard user={user} /> : <Navigate to="/login" />
                    } />
                    <Route path="/dispatcher" element={
                        user?.role === 'dispatcher' ? <DispatcherDashboard user={user} /> : <Navigate to="/login" />
                    } />
                </Routes>
            </div>
        </Router>
    );
}

export default App;