import React, { useState, useEffect } from 'react';

const DispatcherDashboard = ({ user }) => {
    const [trips, setTrips] = useState([]);
    const [users, setUsers] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [newDestination, setNewDestination] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tripsRes, usersRes, destRes] = await Promise.all([
                fetch('http://localhost:5000/api/trips', {
                    headers: {
                        'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                    }
                }),
                fetch('http://localhost:5000/api/users', {
                    headers: {
                        'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                    }
                }),
                fetch('http://localhost:5000/api/destinations', {
                    headers: {
                        'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                    }
                })
            ]);
            
            if (!tripsRes.ok || !usersRes.ok || !destRes.ok) throw new Error('Ошибка загрузки данных');
            
            const tripsData = await tripsRes.json();
            const usersData = await usersRes.json();
            const destData = await destRes.json();
            
            setTrips(tripsData);
            setUsers(usersData);
            setDestinations(destData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const assignDriver = async (tripId, driverId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                },
                body: JSON.stringify({ 
                    driverId,
                    status: 'assigned'
                })
            });
            
            if (!response.ok) throw new Error('Ошибка назначения водителя');
            
            const updatedTrip = await response.json();
            setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
        } catch (err) {
            setError(err.message);
        }
    };

    const cancelTrip = async (tripId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                },
                body: JSON.stringify({ 
                    status: 'canceled'
                })
            });
            
            if (!response.ok) throw new Error('Ошибка отмены поездки');
            
            const updatedTrip = await response.json();
            setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
        } catch (err) {
            setError(err.message);
        }
    };

    const addDestination = async () => {
        if (!newDestination.trim()) return;
        
        try {
            const response = await fetch('http://localhost:5000/api/destinations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                },
                body: JSON.stringify({ name: newDestination })
            });
            
            if (!response.ok) throw new Error('Ошибка добавления места назначения');
            
            setDestinations([...destinations, newDestination]);
            setNewDestination('');
        } catch (err) {
            setError(err.message);
        }
    };

    const addUser = async (newUser) => {
        try {
            const response = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                },
                body: JSON.stringify(newUser)
            });
            
            if (!response.ok) throw new Error('Ошибка добавления пользователя');
            
            const createdUser = await response.json();
            setUsers([...users, createdUser]);
        } catch (err) {
            setError(err.message);
        }
    };

    const updateUser = async (userId, updates) => {
        try {
            const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) throw new Error('Ошибка обновления пользователя');
            
            const updatedUser = await response.json();
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="dashboard">
            <h2>Панель диспетчера</h2>
            
            <div className="card">
                <h3>Все поездки</h3>
                {isLoading ? (
                    <p>Загрузка...</p>
                ) : error ? (
                    <p className="error">{error}</p>
                ) : trips.length === 0 ? (
                    <p>Нет активных поездок</p>
                ) : (
                    <table className="trips-table">
                        <thead>
                            <tr>
                                <th>Пассажир</th>
                                <th>Откуда</th>
                                <th>Куда</th>
                                <th>Время</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.map(trip => (
                                <tr key={trip.id}>
                                    <td>{trip.passengerName}</td>
                                    <td>{trip.from}</td>
                                    <td>{trip.to}</td>
                                    <td>{new Date(trip.scheduledTime).toLocaleString()}</td>
                                    <td>{trip.status}</td>
                                    <td>
                                        {trip.status === 'pending' && (
                                            <>
                                                <select 
                                                    onChange={(e) => assignDriver(trip.id, parseInt(e.target.value))}
                                                    defaultValue=""
                                                >
                                                    <option value="">Выберите водителя</option>
                                                    {users
                                                        .filter(u => u.role === 'driver')
                                                        .map(driver => (
                                                            <option key={driver.id} value={driver.id}>
                                                                {driver.name} ({driver.car})
                                                            </option>
                                                        ))}
                                                </select>
                                                <button 
                                                    onClick={() => cancelTrip(trip.id)}
                                                    className="btn-danger"
                                                >
                                                    Отменить
                                                </button>
                                            </>
                                        )}
                                        {trip.status === 'assigned' && (
                                            <button 
                                                onClick={() => cancelTrip(trip.id)}
                                                className="btn-danger"
                                            >
                                                Отменить
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <div className="card">
                <h3>Управление пользователями</h3>
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Имя</th>
                            <th>Роль</th>
                            <th>Детали</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.role}</td>
                                <td>
                                    {user.role === 'driver' && `${user.car} (${user.carNumber})`}
                                    {user.role === 'passenger' && user.department}
                                </td>
                                <td>
                                    <button 
                                        onClick={() => {
                                            const newName = prompt('Новое имя:', user.name);
                                            if (newName && newName !== user.name) {
                                                updateUser(user.id, { name: newName });
                                            }
                                        }}
                                        className="btn-primary"
                                    >
                                        Редактировать
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <h4>Добавить пользователя</h4>
                <button 
                    onClick={() => {
                        const role = prompt('Роль (driver/passenger/dispatcher):');
                        const username = prompt('Логин:');
                        const password = prompt('Пароль:');
                        const name = prompt('Имя:');
                        
                        if (role && username && password && name) {
                            const newUser = { 
                                username, 
                                password, 
                                role, 
                                name 
                            };
                            
                            if (role === 'driver') {
                                newUser.car = prompt('Марка машины:');
                                newUser.carNumber = prompt('Номер машины:');
                            } else if (role === 'passenger') {
                                newUser.department = prompt('Отдел:');
                            }
                            
                            addUser(newUser);
                        }
                    }}
                    className="btn-success"
                >
                    Добавить пользователя
                </button>
            </div>
            
            <div className="card">
                <h3>Места назначения</h3>
                <ul>
                    {destinations.map((dest, index) => (
                        <li key={index}>{dest}</li>
                    ))}
                </ul>
                
                <div className="form-group">
                    <input 
                        type="text" 
                        value={newDestination} 
                        onChange={(e) => setNewDestination(e.target.value)}
                        placeholder="Новое место назначения"
                    />
                    <button onClick={addDestination} className="btn-primary">
                        Добавить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DispatcherDashboard;