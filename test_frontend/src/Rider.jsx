import { useState } from 'react';
import { fetchAPI } from './api';

export default function Rider({ token }) {
    const [log, setLog] = useState('');
    const [jobs, setJobs] = useState([]);

    const runApi = async (endpoint, method = 'GET', body = null) => {
        const res = await fetchAPI(endpoint, method, body, token);
        setLog(`[${method}] ${endpoint}\nStatus: ${res.status}\n${JSON.stringify(res.data, null, 2)}`);
        return res.data;
    };

    return (
        <div>
            <h3>Rider Actions</h3>
            <button onClick={async () => setJobs(await runApi('/orders/available-deliveries'))}>Find Deliveries</button>
            {jobs.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                    <button onClick={() => runApi(`/orders/${jobs[0]._id}/status`, 'PUT', { status: 'Accepted by Rider' })}>Accept Order 1</button>
                    <button onClick={() => runApi(`/orders/${jobs[0]._id}/status`, 'PUT', { status: 'Delivered' })}>Mark Delivered (Get Paid)</button>
                </div>
            )}
            <hr/>
            <button onClick={() => runApi('/wallet/earnings')}>Check Earnings</button>
            
            <h4>API Response Log</h4>
            <pre style={{ background: '#222', color: '#0f0', padding: '10px', height: '300px', overflowY: 'scroll' }}>{log}</pre>
        </div>
    );
}