import { useState, useEffect } from 'react';
import { fetchAPI } from './api';
import Auth from './Auth';
import Customer from './Customer';
import Vendor from './Vendor';
import Rider from './Rider';
import Admin from './Admin';

export default function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);

    // Fetch user profile automatically if token exists
    useEffect(() => {
        if (token) {
            fetchAPI('/auth/me', 'GET', null, token).then(res => {
                if (res.status === 200) setUser(res.data);
                else logout();
            });
        }
    }, [token]);

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    if (!token || !user) {
        return <Auth setToken={(t) => { localStorage.setItem('token', t); setToken(t); }} />;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h2>Logged in as: {user.name} ({user.role})</h2>
            <button onClick={logout}>Logout</button>
            <hr />
            
            {user.role === 'customer' && <Customer token={token} />}
            {user.role === 'restaurant_owner' && <Vendor token={token} />}
            {user.role === 'rider' && <Rider token={token} />}
            {user.role === 'admin' && <Admin token={token} />}
        </div>
    );
}