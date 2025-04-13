import React, { useState, useRef } from 'react'; // Removed useEffect as it's not used
import './Footer.css';
import mapLogo from '../assets/map_logo.png'; // Corrected map logo image import

const Footer = () => {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const footerRef = useRef(null);

  // Sample map pins data
  const mapPins = [
    { id: 1, name: 'Burger King', lat: 38.6270, lng: -90.1994 },
    { id: 2, name: 'Pizza Hut', lat: 38.6280, lng: -90.2050 },
    { id: 3, name: 'Taco Bell', lat: 38.6300, lng: -90.1980 },
    { id: 4, name: 'Subway', lat: 38.6260, lng: -90.2010 }
  ];

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setCurrentY(e.touches[0].clientY);
    
    // Calculate the difference
    const diff = startY - currentY;
    
    // If swiping up (diff > 0) and map is not expanded, expand it
    if (diff > 50 && !isMapExpanded) {
      setIsMapExpanded(true);
    }
    
    // If swiping down (diff < 0) and map is expanded, collapse it
    if (diff < -50 && isMapExpanded) {
      setIsMapExpanded(false);
    }
  };

  const handleTouchEnd = () => {
    setStartY(0);
    setCurrentY(0);
  };

  const handleClick = () => {
    // Allow click to toggle only if not expanded, to prevent accidental clicks on map
    if (!isMapExpanded) {
      setIsMapExpanded(true);
    }
  };

  return (
    <footer 
      className={`footer ${isMapExpanded ? 'expanded' : ''}`}
      ref={footerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // Removed onClick from the footer itself, handle click on the icon/indicator
    >
      <div className="footer-curve"></div>
      <div className="location-icon-container" onClick={handleClick}> {/* Make container clickable */}
        <img src={mapLogo} alt="Map Icon" className="location-icon-img" />
      </div>
      
      {/* Map content that appears when expanded */}
      <div className="map-container">
        <div className="map-header">
          <h3>Nearby Recommendations</h3>
          <div className="map-close" onClick={(e) => {
            e.stopPropagation(); // Prevent footer click handler
            setIsMapExpanded(false);
          }}>×</div>
        </div>
        <div className="map-content">
          {/* This would be replaced with an actual map component in a real app */}
          <div className="mock-map">
            <div className="map-background"></div>
            {mapPins.map(pin => (
              <div 
                key={pin.id} 
                className="map-pin"
                style={{ 
                  // Basic positioning for demo, replace with actual map coordinates
                  left: `${(pin.lng + 90.21) * 1500 % 90 + 5}%`, 
                  top: `${(pin.lat - 38.62) * 1500 % 90 + 5}%` 
                }}
                title={pin.name}
              >
                <div className="pin-icon">📍</div>
                <div className="pin-name">{pin.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Swipe indicator */}
      <div className="swipe-indicator" onClick={handleClick}> {/* Make indicator clickable */}
        <div className="swipe-line"></div>
        <div className="swipe-text">{isMapExpanded ? 'Swipe down to close' : 'Swipe up for map'}</div>
      </div>
    </footer>
  );
};

export default Footer;
