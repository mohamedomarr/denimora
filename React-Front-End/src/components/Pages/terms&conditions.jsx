import React, { useEffect } from 'react';

const TermsConditions = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="terms-conditions-page">
      <div className="terms-page-container">
        
        {/* Page Title */}
        <div className="terms-page-header">
          <h1>Terms & Conditions</h1>
        </div>

        {/* Main Content */}
        <div className="terms-page-content">
          
          {/* Welcome Section */}
          <div className="terms-section">
            <h2>Welcome to Denimora</h2>
            <p>
              By accessing or using our website at <a href="https://denimora.com" style={{color: 'var(--Gold--)', textDecoration: 'underline'}}>Denimora.co</a> You agree to be bound by the following terms 
              and conditions. These Terms apply to all visitors and users of the Site.
            </p>
            <p>
              Please read these Terms carefully before using the Site. If you do not agree to these Terms, please 
              do not use the Site.
            </p>
          </div>

          {/* Use of the Site Section */}
          <div className="terms-section">
            <h2>Use of the Site</h2>
            <p>
              The Site and its content, including but not limited to text, graphics, images, and software, are the 
              property of Denimora and are protected by copyright and other intellectual property laws. You may 
              not use the Site or its content for any commercial purpose without the express written consent of 
              Denimora.
            </p>
            <p>
              You may not use the Site in any way that could damage, disable, overburden, or impair the Site or 
              interfere with any other party's use of the Site.
            </p>
          </div>

          {/* Purchases Section */}
          <div className="terms-section">
            <h2>Purchases</h2>
            <p>
              All purchases made on the Site are subject to our Return & Exchange policy, which is incorporated 
              into these Terms by reference.
            </p>
            <p>
              Denimora reserves the right to change the prices of products listed on the Site at any time and 
              without notice. We also reserve the right to limit the quantity of items purchased and to cancel 
              orders that appear to be placed by dealers or resellers.
            </p>
            <p>
              Denimora is not responsible for any errors or omissions in the pricing or product descriptions on the 
              Site.
            </p>
          </div>

          {/* Disclaimers Section */}
          <div className="terms-section">
            <h2>Disclaimers</h2>
            <p>
              The Site and its content are provided on an "as is" and "as available" basis. Denimora makes no 
              representations or warranties of any kind, express or implied, as to the operation of the Site or the 
              information, content, materials, or products included on the Site.
            </p>
            <p>
              To the full extent permissible by law, Denimora disclaims all warranties, express or implied, 
              including but not limited to implied warranties of merchantability and fitness for a particular 
              purpose.
            </p>
          </div>

          {/* Limitation of Liability Section */}
          <div className="terms-section">
            <h2>Limitation of Liability</h2>
            <p>
              Denimora will not be liable for any damages of any kind arising from the use of the Site, including 
              but not limited to direct, indirect, incidental, punitive, and consequential damages.
            </p>
          </div>

          {/* Governing Law Section */}
          <div className="terms-section">
            <h2>Governing Law</h2>
            <p>
              These Terms and your use of the Site will be governed by and construed in accordance with the laws 
              of the <strong>Arab Republic of Egypt</strong>, without giving effect to any principles of conflicts of law.
            </p>
          </div>

          {/* Changes to These Terms Section */}
          <div className="terms-section">
            <h2>Changes to These Terms</h2>
            <p>
              Denimora reserves the right to change these Terms at any time and without notice. Any changes will 
              be effective immediately upon posting to the Site. It is your responsibility to review these Terms 
              periodically for any changes. Your continued use of the Site following the posting of changes to these 
              Terms will constitute your acceptance of those changes.
            </p>
          </div>

          {/* Contact Us Section */}
          <div className="terms-section">
            <h2>Contact Us</h2>
            <p>
              If you have any questions or concerns about these Terms or the Site, please contact us at:{' '}
              <a href="mailto:denimora1011@gmail.com" className="terms-email-link">
                denimora1011@gmail.com
              </a>{' '}
              OR{' '}
              <a href="tel:+201099470666" className="terms-phone-link">
                01099470666
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
