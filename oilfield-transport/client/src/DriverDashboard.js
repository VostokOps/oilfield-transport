import React, { useState, useEffect } from 'react';

const DriverDashboard = ({ user }) => {
    const [trips, setTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/trips', {
                headers: {
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                }
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки поездок');
            
            const data = await response.json();
            setTrips(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTripStatus = async (tripId, status) => {
        try {
            const response = await fetch(`http://localhost:5000/api/trips/${tripId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`
                },
                body: JSON.stringify({ status })
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
            <h2>Панель водителя</h2>
            <p>Ваше транспортное средство: {user.car} ({user.carNumber})</p>
            
            <div className="card">
                <h3>Ваши поездки</h3>
                {isLoading ? (
                    <p>Загрузка...</p>
                ) : error ? (
                    <p className="error">{error}</p>
                ) : trips.length === 0 ? (
                    <p>У вас нет назначенных поездок</p>
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
                                        {trip.status === 'assigned' && (
                                            <>
                                                <button 
                                                    onClick={() => updateTripStatus(trip.id, 'in_progress')}
                                                    className="btn-primary"
                                                >
                                                    Начать поездку
                                                </button>
                                            </>
                                        )}
                                        {trip.status === 'in_progress' && (
                                            <button 
                                                onClick={() => updateTripStatus(trip.id, 'completed')}
                                                className="btn-success"
                                            >
                                                Завершить поездку
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

export default DriverDashboard;