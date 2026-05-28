import { useState } from 'react';
import { fetchAPI } from './api';

export default function Customer({ token }) {
    const [log, setLog] = useState('');
    const [state, setState] = useState({ cards: [], restaurants: [], menu: [], activeCardId: '', activeShopId: '' });

    const runApi = async (endpoint, method = 'GET', body = null) => {
        const res = await fetchAPI(endpoint, method, body, token);
        setLog(`[${method}] ${endpoint}\nStatus: ${res.status}\n${JSON.stringify(res.data, null, 2)}`);
        return res.data;
    };

    const getCards = async () => {
        const data = await runApi('/wallet/my-cards');
        if (data.length > 0) setState(s => ({ ...s, cards: data, activeCardId: data[0].id }));
    };

    const checkout = async () => {
        if (!state.activeCardId || !state.activeShopId) return alert("Fetch cards and a menu first!");
        // We use hardcoded coordinates to test OSRM
        const payload = {
            restaurantId: state.activeShopId,
            cardId: state.activeCardId,
            pin: "1234", // Assuming test pin is 1234
            deliveryAddress: "Test Address",
            deliveryCoordinates: [73.084524, 33.650131],
            items: [{ menuItemId: state.menu[0]?.id, quantity: 1 }]
        };
        runApi('/orders/checkout', 'POST', payload);
    };

    return (
        <div>
            <h3>Customer Actions</h3>

            <fieldset><legend>1. Wallet Tests</legend>
                <button onClick={getCards}>Get My Cards</button>
                <button onClick={() => runApi('/wallet/add-card', 'POST', { cardHolderName: 'Test User', cardNumber: '1111222233334444', expiryDate: '12/28', cvv: '123', pin: '1234' })}>Add Test Card</button>
                <button onClick={() => runApi(`/wallet/top-up`, 'PUT', { cardId: state.activeCardId, amount: 5000 })}>Top Up 5000</button>
                <button onClick={() => runApi(`/wallet/${state.activeCardId}`, 'DELETE')}>Delete Card</button>
                <p>Active Card ID: {state.activeCardId || 'None'}</p>
            </fieldset>

            <fieldset><legend>2. Browse & Order</legend>
                <button onClick={async () => {
                    const data = await runApi('/restaurants');
                    setState(s => ({ ...s, restaurants: data }));
                }}>Get Restaurants</button>

                {state.restaurants.length > 0 && (
                    <select onChange={e => setState(s => ({ ...s, activeShopId: e.target.value }))}>
                        <option value="">Select a Shop</option>
                        {state.restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                )}

                <button onClick={async () => {
                    const data = await runApi(`/menu/${state.activeShopId}`);
                    setState(s => ({ ...s, menu: data }));
                }}>Get Menu</button>
                <button onClick={checkout}>Checkout (Order 1st Item)</button>
                <button onClick={() => runApi('/orders/my-orders')}>View My Orders</button>
            </fieldset>

            <h4>API Response Log</h4>
            <pre style={{ background: '#222', color: '#0f0', padding: '10px', height: '300px', overflowY: 'scroll' }}>{log}</pre>
        </div>
    );
}