import React, { useState } from 'react';
import './Hero-Banner.css';
import Naan from '../../assets/naan-removebg.png'
import { FiInfo, FiRefreshCw } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

//  can later fetch these from  backend/database
const allCategories = [
    'Desi', 'Naan', 'Karahi', 'Fast Food',
    'BBQ', 'Pizza', 'Burgers', 'Chinese',
    'Desserts', 'Healthy', 'Biryani', 'Rolls',
    'Salads', 'Seafood', 'Pasta'
];

const HeroBanner = ({ userName = "Muhammad Saad" }) => {


    const [currentIndex, setCurrentIndex] = useState(0);

    // 2. State for the categories currently showing (initially the first 4)
    const [displayedCategories, setDisplayedCategories] = useState(allCategories.slice(0, 4));

    // 3. State to handle the spinning animation
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 4. Sequential refresh logic
    const handleRefresh = () => {
        setIsRefreshing(true);

        setTimeout(() => {
            // Calculate the next starting index (move forward by 4)
            const nextIndex = (currentIndex + 4) % allCategories.length;

            // Grab the next 4 categories, wrapping back to the start if needed
            const nextCategories = [];
            for (let i = 0; i < 4; i++) {
                nextCategories.push(allCategories[(nextIndex + i) % allCategories.length]);
            }

            // Update states
            setCurrentIndex(nextIndex);
            setDisplayedCategories(nextCategories);
            setIsRefreshing(false);
        }, 400);
    };

    return (
        <div className="hero-banner">
            <div className="hero-content">
                <h1 className="hero-greeting">Good Evening, {userName}</h1>
                <div className="hero-subtext">
                    What are you craving today? <FiInfo className="info-icon" />
                </div>

                <div className="craving-pills">
                    <button className="pill icon-btn" aria-label="Refresh" onClick={handleRefresh}>
                        <FiRefreshCw className={isRefreshing ? 'spin-icon' : ''} />
                    </button>
                    <div className={`pills-list ${isRefreshing ? 'fading-out' : 'fading-in'}`}>
                    {/* Renders exactly 4 categories at a time sequentially */}
                    {displayedCategories.map((category) => (
                        <button key={category} className="pill">
                            <HiSparkles style={{ color: '#e87b1e', fontSize: '18px' }} />
                            {category}
                        </button>
                    ))}
                    </div>
                </div>
            </div>

            <div className="hero-illustration">

                <img
                    src={Naan}
                    alt="Food Cloche"
                    className="naan-dome-img"
                />
            </div>
        </div>
    );
};

export default HeroBanner;