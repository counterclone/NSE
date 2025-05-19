import React, { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';

const SchemeSelector = ({ schemes, loading, error, onSchemeSelect, selectedScheme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredSchemes = schemes.filter(scheme => 
    scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    scheme.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if error indicates no scheme master file
  const isNoSchemeMasterError = error && (
    error.includes('No scheme master files found') || 
    error.includes('Scheme file not found')
  );

  // Handler for switching to Scheme Master tab
  const handleSwitchToSchemeMasterTab = () => {
    // This will be handled in App.js
    if (window.switchToSchemeMasterTab) {
      window.switchToSchemeMasterTab();
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-secondary text-white">
        <h4 className="mb-0">Select Scheme</h4>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search schemes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading schemes...</p>
          </div>
        ) : isNoSchemeMasterError ? (
          <Alert variant="warning">
            <Alert.Heading>Scheme Master File Not Found</Alert.Heading>
            <p>
              No scheme master file was found or the file could not be read. You need to download the latest scheme master file first.
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button 
                variant="outline-primary" 
                onClick={handleSwitchToSchemeMasterTab}
              >
                Go to Scheme Master Tab
              </Button>
            </div>
          </Alert>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="scheme-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredSchemes.length > 0 ? (
              <div className="list-group">
                {filteredSchemes.map((scheme) => (
                  <button
                    key={scheme.code}
                    className={`list-group-item list-group-item-action ${selectedScheme?.code === scheme.code ? 'active' : ''}`}
                    onClick={() => onSchemeSelect(scheme)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{scheme.code}</div>
                        <small>{scheme.name}</small>
                      </div>
                      {selectedScheme?.code === scheme.code && (
                        <span className="badge bg-primary rounded-pill">Selected</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted">No schemes found matching "{searchTerm}"</p>
            )}
          </div>
        )}
        
        <div className="mt-3 text-muted small">
          <p>Total schemes: {schemes.length}</p>
          {searchTerm && <p>Filtered results: {filteredSchemes.length}</p>}
        </div>
      </div>
    </div>
  );
};

export default SchemeSelector; 