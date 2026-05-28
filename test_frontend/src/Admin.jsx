import { useState } from 'react';
import { fetchAPI } from './api';

export default function Admin({ token }) {
    const [log, setLog] = useState('');
    const [targetId, setTargetId] = useState('');

    const runApi = async (endpoint, method = 'GET', body = null) => {
        const res = await fetchAPI(endpoint, method, body, token);
        setLog(`[${method}] ${endpoint}\nStatus: ${res.status}\n${JSON.stringify(res.data, null, 2)}`);
    };

    return (
        <div>
            <h3>Admin Actions</h3>
            <button onClick={() => runApi('/admin/dashboard-stats')}>Get Dashboard Stats</button>
            
            <fieldset><legend>Target Actions</legend>
                <input placeholder="Paste Restaurant/User ID" onChange={e => setTargetId(e.target.value)} style={{ width: '250px' }}/>
                <button onClick={() => runApi(`/admin/approve-restaurant/${targetId}`, 'PUT')}>Approve Restaurant</button>
                <button onClick={() => runApi(`/admin/revoke-restaurant/${targetId}`, 'PUT', { reason: "Testing Revoke" })}>Revoke Restaurant</button>
                <button onClick={() => runApi(`/admin/change-role/${targetId}`, 'PUT', { newRole: 'rider' })}>Make User Rider</button>
            </fieldset>

            <fieldset><legend>Global Settings</legend>
                <button onClick={() => runApi('/admin/settings', 'PUT', { platformMarkupPercentage: 15, perKmDeliveryRate: 50 })}>Set Markup 15% & 50/km</button>
            </fieldset>

            <h4>API Response Log</h4>
            <pre style={{ background: '#222', color: '#0f0', padding: '10px', height: '300px', overflowY: 'scroll' }}>{log}</pre>
        </div>
    );
}