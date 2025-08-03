import React, { useEffect } from 'react';
import ProgressBarManager from '../Shared/ProgressBarManager';
import '../../CSS/Styles.css';

const AboutUs = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  return (
    <ProgressBarManager autoStartDelay={600}>
      <div className="about-us-page">
      <div className="about-page-container">
        
        {/* Page Title */}
        <div className="about-page-header">
          <h1>About Denimora</h1>
        </div>

        {/* Main Content */}
        <div className="about-page-content">
          
          {/* About Image Section - Only visible on desktop */}
          <div className="about-page-image-section">
            <img 
              src="/Assets/Shop/AboutUs-min.jpg" 
              alt="About Denimora - Turkish Denim Craftsmanship"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/Assets/Shop/AboutUs.jpg';
              }}
            />
          </div>

          {/* About Text Content */}
          <div className="about-page-text-section">
            <div className="about-section">
              <p>
                <span>Denimora</span> is where timeless style meets premium Turkish craftsmanship. 
                Born in the heart of Turkey, Denimora brings you high quality denim that blends 
                modern fits with rich fabric heritage.
              </p>
              <p>
                Every piece is thoughtfully designed and expertly made, using carefully selected 
                materials to ensure comfort, durability, and effortless style.
              </p>
            </div>

            <div className="about-section">
              <p>
                Our mission is simple: to deliver denim that feels as good as it looks. Whether 
                you're dressing up or keeping it casual, <span>Denimora</span> is your go-to for 
                jeans that move with you and last beyond seasons.
              </p>
            </div>

            <div className="about-section">
              <p>
                Welcome to <span>Denimora</span> where denim is more than fashion, it's a lifestyle. 
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
    </ProgressBarManager>
  );
};

export default AboutUs;
