import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- FIX FOR LEAFLET ICONS IN REACT/VITE ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});
// -------------------------------------------

const socket = io('http://localhost:5000');

export default function LiveTracker() {
    const [orderId, setOrderId] = useState('TEST_ORDER_123');
    const [role, setRole] = useState('customer'); 
    const [chat, setChat] = useState([]);
    const [msgInput, setMsgInput] = useState('');
    const [gpsError, setGpsError] = useState('');
    
    // Starting coordinates - Format: [Longitude, Latitude]
    const [riderCoords, setRiderCoords] = useState([73.084524, 33.650131]); 

    // 1. Existing Socket Listeners
    useEffect(() => {
        socket.emit('join_room', orderId);

        socket.on('receive_message', (data) => {
            setChat(prev => [...prev, `${data.sender}: ${data.text}`]);
        });

        socket.on('location_updated', (coords) => {
            // Only the Customer should update their map based on the socket
            if (role === 'customer') {
                setRiderCoords(coords);
            }
        });

        return () => {
            socket.off('receive_message');
            socket.off('location_updated');
        };
    }, [orderId, role]);

    // 2. NEW: The Hardware GPS Tracker for the Rider
    useEffect(() => {
        let watchId;

        if (role === 'rider') {
            if ('geolocation' in navigator) {
                // watchPosition continuously tracks the device
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        // Extract hardware coordinates
                        const { latitude, longitude } = position.coords;
                        
                        // Format to [Lng, Lat] for our backend standard
                        const newCoords = [longitude, latitude]; 
                        
                        setRiderCoords(newCoords); // Update Rider's own map
                        
                        // Beam the physical location to the server!
                        socket.emit('update_location', { orderId, coordinates: newCoords });
                        setGpsError('');
                    },
                    (error) => {
                        console.error("GPS Error:", error);
                        setGpsError('Please allow location permissions in your browser.');
                    },
                    { 
                        enableHighAccuracy: true, // Forces the device to use the GPS chip if available
                        maximumAge: 0, 
                        timeout: 5000 
                    }
                );
            } else {
                setGpsError('Geolocation is not supported by your browser.');
            }
        }

        // Cleanup: Stop tracking the GPS if the component unmounts or they change roles
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [role, orderId]);

    const sendMessage = () => {
        if (!msgInput) return;
        socket.emit('send_message', { orderId, sender: role, text: msgInput });
        setChat(prev => [...prev, `Me: ${msgInput}`]); 
        setMsgInput('');
    };

    // Component to automatically recenter the map when coordinates change
    function MapRecenter({ lat, lng }) {
        const map = useMap();
        useEffect(() => {
            map.flyTo([lat, lng], map.getZoom());
        }, [lat, lng, map]);
        return null;
    }

    return (
        <div style={{ padding: '20px', border: '2px solid #ccc', marginTop: '20px' }}>
            <h2>Live Hardware GPS Tracking</h2>
            
            <div style={{ marginBottom: '10px' }}>
                <label>Join Room: </label>
                <input value={orderId} onChange={e => setOrderId(e.target.value)} />
                <select value={role} onChange={e => setRole(e.target.value)} style={{ marginLeft: '10px' }}>
                    <option value="customer">I am the Customer</option>
                    <option value="rider">I am the Rider</option>
                </select>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                
                {/* THE OPENSTREETMAP DISPLAY */}
                <div style={{ flex: 2, border: '1px solid black', zIndex: 0 }}>
                    {role === 'rider' && (
                        <div style={{background: 'yellow', padding: '5px', margin: 0}}>
                            🚗 You are the Rider. Broadcasting hardware GPS...
                            {gpsError && <p style={{color: 'red', fontWeight: 'bold'}}>{gpsError}</p>}
                        </div>
                    )}
                    {role === 'customer' && <p style={{background: '#e0f7fa', padding: '5px', margin: 0}}>👀 You are the Customer. Watching the Rider's physical location...</p>}
                    
                    <MapContainer center={[riderCoords[1], riderCoords[0]]} zoom={16} style={{ height: '400px', width: '100%' }}>
                        <TileLayer 
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        />
                        <Marker position={[riderCoords[1], riderCoords[0]]}>
                            <Popup>{role === 'rider' ? 'You are here' : 'Rider is here'}</Popup>
                        </Marker>
                        
                        <MapRecenter lat={riderCoords[1]} lng={riderCoords[0]} />
                    </MapContainer>
                </div>

                {/* THE CHAT WIDGET */}
                <div style={{ flex: 1 }}>
                    <h3>Live Chat</h3>
                    <div style={{ height: '330px', overflowY: 'scroll', background: '#222', color: '#0f0', padding: '10px', marginBottom: '10px' }}>
                        {chat.map((c, i) => <div key={i}>{c}</div>)}
                    </div>
                    <div style={{ display: 'flex' }}>
                        <input 
                            style={{ flex: 1 }}
                            value={msgInput} 
                            onChange={e => setMsgInput(e.target.value)} 
                            placeholder="Type message..." 
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
}