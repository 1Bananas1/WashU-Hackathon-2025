import React from 'react';
import Header from './components/Header';
import Recommendations from './components/Recommendations';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Recommendations />
      </main>
      <Footer />
    </div>
  );
}

export default App;
