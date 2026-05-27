// Keep Haversine as a "Fallback" just in case the OSRM routing server goes down
const calculateStraightLineFallback = (coord1, coord2) => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};

// The New Real-World Driving Distance Calculator
const calculateDistance = async (startCoords, endCoords) => {
    try {
        const [startLon, startLat] = startCoords;
        const [endLon, endLat] = endCoords;

        const url = `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;
        
        // 1. Log the URL to ensure coordinates aren't "undefined"
        console.log(`🌍 Pinging OSRM URL: ${url}`);

        // 2. Add a custom User-Agent so the public server doesn't block us
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'MyFoodDeliveryApp/1.0 (Student Project)' // Change this name if you want!
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
            const distanceInKm = data.routes[0].distance / 1000;
            console.log(`🛣️ OSRM Driving Route: ${distanceInKm.toFixed(2)} km`);
            return distanceInKm;
        } else {
            throw new Error('OSRM could not find a valid driving route');
        }
    } catch (error) {
        // 3. Deeper error logging to see the EXACT network failure
        console.warn('⚠️ Routing API failed. Reason:', error.cause || error.message);
        console.warn('🔄 Falling back to straight-line distance...');
        return calculateStraightLineFallback(startCoords, endCoords);
    }
};

module.exports = { calculateDistance };