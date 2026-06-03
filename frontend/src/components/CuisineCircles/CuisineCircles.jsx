import React from 'react';
import './CuisineCircles.css';

const CUISINES = [
  {
    name: 'All',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Desi',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'BBQ',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Bakery',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Chinese',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=150&auto=format&fit=crop&q=60'
  },
  {
    name: 'Beverages',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=150&auto=format&fit=crop&q=60'
  }
];

function CuisineCircles({ selectedCuisine, onSelectCuisine }) {
  return (
    <div className="cuisine-circles-container">
      <h3 className="cuisine-title">In the mood for...</h3>
      <div className="cuisine-circles-list">
        {CUISINES.map((cuisine) => {
          const isActive = selectedCuisine === cuisine.name;
          return (
            <button
              key={cuisine.name}
              className={`cuisine-circle-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCuisine(cuisine.name)}
              aria-label={`Filter by ${cuisine.name}`}
            >
              <div className="cuisine-circle-img-wrapper">
                <img
                  src={cuisine.image}
                  alt={cuisine.name}
                  className="cuisine-circle-img"
                  loading="lazy"
                />
              </div>
              <span className="cuisine-circle-name">{cuisine.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CuisineCircles;