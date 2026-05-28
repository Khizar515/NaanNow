export const fetchAPI = async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    try {
        const res = await fetch(`http://localhost:5000/api${endpoint}`, config);
        const data = await res.json();
        return { status: res.status, data };
    } catch (error) {
        return { status: 500, data: { message: error.message } };
    }
};