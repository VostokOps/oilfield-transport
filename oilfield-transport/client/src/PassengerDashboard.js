import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PassengerDashboard = ({ user }) => {
    const [trips, setTrips] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [newTrip, setNewTrip] = useState({
        from: '',
        to: '',
        scheduledTime: '',
        isScheduled: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tripsRes, destRes] = await Promise.all([
                fetch('http://localhost:5000/api/trips', {
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
            
            if (!tripsRes.ok || !destRes.ok) throw new Error('Ошибка загрузки данных');
            
            const tripsData = await tripsRes.json();
            const destData = await destRes.json();
            
            setTrips(tripsData);
            setDestinations(destData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTrip = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                },
                body: JSON.stringify({
                    from: newTrip.from,
                    to: newTrip.to,
                    scheduledTime: newTrip.isScheduled ? newTrip.scheduledTime : undefined
                })
            });
            
            if (!response.ok) throw new Error('Ошибка создания поездки');
            
            const createdTrip = await response.json();
            setTrips([...trips, createdTrip]);
            setNewTrip({ from: '', to: '', scheduledTime: '', isScheduled: false });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelayTrip = async (tripId) => {
        const reason = prompt('Причина задержки:');
        if (!reason) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                },
                body: JSON.stringify({ delayReason: reason })
            });
            
            if (!response.ok) throw new Error('Ошибка обновления поездки');
            
            const updatedTrip = await response.json();
            setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="dashboard">
            <h2>Панель пассажира</h2>
            
            <div className="card">
                <h3>Создать заявку на транспорт</h3>
                <div className="form-group">
                    <label>Откуда:</label>
                    <select 
                        value={newTrip.from} 
                        onChange={(e) => setNewTrip({...newTrip, from: e.target.value})}
                    >
                        <option value="">Выберите место</option>
                        {destinations.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Куда:</label>
                    <select 
                        value={newTrip.to} 
                        onChange={(e) => setNewTrip({...newTrip, to: e.target.value})}
                    >
                        <option value="">Выберите место</option>
                        {destinations.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>
                        <input 
                            type="checkbox" 
                            checked={newTrip.isScheduled} 
                            onChange={(e) => setNewTrip({...newTrip, isScheduled: e.target.checked})}
                        />
                        Запланировать на определенное время
                    </label>
                    {newTrip.isScheduled && (
                        <input 
                            type="datetime-local" 
                            value={newTrip.scheduledTime} 
                            onChange={(e) => setNewTrip({...newTrip, scheduledTime: e.target.value})}
                        />
                    )}
                </div>
                <button onClick={handleCreateTrip} className="btn-primary">
                    Вызвать транспорт
                </button>
            </div>
            
            <div className="card">
                <h3>Мои поездки</h3>
                {isLoading ? (
                    <p>Загрузка...</p>
                ) : error ? (
                    <p className="error">{error}</p>
                ) : trips.length === 0 ? (
                    <p>У вас нет активных поездок</p>
                ) : (
                    <table className="trips-table">
                        <thead>
                            <tr>
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
                                    <td>{trip.from}</td>
                                    <td>{trip.to}</td>
                                    <td>{new Date(trip.scheduledTime).toLocaleString()}</td>
                                    <td>{trip.status}</td>
                                    <td>
                                        {trip.status === 'assigned' && (
                                            <button 
                                                onClick={() => handleDelayTrip(trip.id)}
                                                className="btn-warning"
                                            >
                                                Задержать
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PassengerDashboard;