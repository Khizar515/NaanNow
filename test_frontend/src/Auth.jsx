import { useState } from 'react';
import { fetchAPI } from './api';

export default function Auth({ setToken }) {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
    const [log, setLog] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const payload = isLogin ? { email: form.email, password: form.password } : form;
        
        const res = await fetchAPI(endpoint, 'POST', payload);
        setLog(JSON.stringify(res.data, null, 2));
        if (res.status === 200 || res.status === 201) setToken(res.data.token);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
                {!isLogin && (
                    <>
                        <input placeholder="Name" onChange={e => setForm({...form, name: e.target.value})} required />
                        <select onChange={e => setForm({...form, role: e.target.value})}>
                            <option value="customer">Customer</option>
                            <option value="restaurant_owner">Vendor</option>
                            <option value="rider">Rider</option>
                            <option value="admin">Admin</option>
                        </select>
                    </>
                )}
                <input type="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} required />
                <input type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '10px' }}>
                Switch to {isLogin ? 'Register' : 'Login'}
            </button>
            <pre style={{ background: '#eee', padding: '10px', marginTop: '10px' }}>{log}</pre>
        </div>
    );
}