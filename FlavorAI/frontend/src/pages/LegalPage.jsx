import React, { useEffect, useState } from 'react';
import './LegalPage.css';
import Docs from '../../public/docs';

const LegalPage = () => {
  const [docsText, setDocsText] = useState('');

  useEffect(() => {
    // Fetch from /docs.txt or wherever your combined text is
    fetch('/docs.txt')
      .then(response => response.text())
      .then(text => setDocsText(text))
      .catch(error => {
        console.error('Error loading docs:', error);
        setDocsText('Failed to load legal documents. Please try again later.');
      });
  }, []);

  return (
    <div className="legal-container">
      <h1 className="legal-title">Legal Documents</h1>
      <div className="legal-content-box">
        <Docs></Docs>
      </div>
    </div>
  );
};

export default LegalPage;
