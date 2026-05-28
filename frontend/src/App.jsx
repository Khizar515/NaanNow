import React from 'react';
import Navbar from './components/Navbar/Navbar';
import Banner from './components/Hero-Banner/Hero-Banner'
/* We will import the Hero and Menu components here later */

function App() {
  return (
    <div className="app-container">
      {/* The Navbar stays at the top of the page */}
      <Navbar />
      <Banner />
      {/* The main tag will hold the rest of your page content */}
      <main style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--color-tandoori)', fontSize: '3rem' }}>
          Naan Now is Live!
        </h1>
        <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>
          Your standard CSS setup is working perfectly.
        </p>
        <div className="box" style={{ height: '1000px' }}>
          Hello
        </div>
      </main>
    </div>
  );
}

export default App;