import { useState, useEffect } from 'react';
import { fetchAPI } from './api';

export default function Vendor({ token }) {
    const [log, setLog] = useState('');
    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);

    const runApi = async (endpoint, method = 'GET', body = null) => {
        const res = await fetchAPI(endpoint, method, body, token);
        setLog(`[${method}] ${endpoint}\nStatus: ${res.status}\n${JSON.stringify(res.data, null, 2)}`);
        return res.data;
    };

    useEffect(() => {
        runApi('/restaurants/my-shop').then(data => { if(data._id) setShop(data) });
    }, []);

    const createShop = () => runApi('/restaurants', 'POST', {
        name: "Test Burger Shop", address: "Rawalpindi", coordinates: [73.074285, 33.667512], cuisineType: "Fast Food", phone: "1234567890", verificationDocuments: ["doc1.jpg"]
    });

    const addMenu = () => runApi('/menu', 'POST', {
        name: "Test Zinger", description: "Yummy", basePrice: 500, category: "Burgers"
    });

    return (
        <div>
            <h3>Vendor Actions</h3>
            <p>My Shop ID: {shop?._id || 'None (Create one!)'}</p>
            <p>Status: {shop?.isApproved ? 'Approved' : 'Unapproved'} | {shop?.isOpen ? 'OPEN' : 'CLOSED'}</p>

            <fieldset><legend>1. Shop Management</legend>
                <button onClick={createShop}>Create Shop</button>
                <button onClick={() => runApi(`/restaurants/${shop?._id}/update`, 'PUT', { phone: '0987654321' })}>Update Phone</button>
                <button onClick={() => runApi(`/restaurants/${shop?._id}/toggle-status`, 'PUT')}>Toggle Open/Close</button>
            </fieldset>

            <fieldset><legend>2. Menu & Orders</legend>
                <button onClick={addMenu}>Add Menu Item</button>
                <button onClick={async () => setOrders(await runApi('/orders/restaurant-queue'))}>Get Order Queue</button>
                {orders.length > 0 && (
                    <>
                        <p>Selected Order: {orders[0]._id}</p>
                        <button onClick={() => runApi(`/orders/${orders[0]._id}/status`, 'PUT', { status: 'Preparing' })}>Mark Preparing</button>
                        <button onClick={() => runApi(`/orders/${orders[0]._id}/status`, 'PUT', { status: 'Ready for Pickup' })}>Mark Ready</button>
                    </>
                )}
            </fieldset>

            <fieldset><legend>3. Wallet & Payout</legend>
                <button onClick={() => runApi('/wallet/earnings')}>Check Earnings</button>
                {/* Assuming Vendor has linked a card via Postman previously */}
                <button onClick={() => runApi('/wallet/withdraw', 'POST', { cardId: 'PASTE_CARD_ID_HERE', amount: 100 })}>Withdraw 100</button>
            </fieldset>

            <h4>API Response Log</h4>
            <pre style={{ background: '#222', color: '#0f0', padding: '10px', height: '300px', overflowY: 'scroll' }}>{log}</pre>
        </div>
    );
}