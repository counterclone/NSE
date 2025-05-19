import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Table, Tabs, Tab, Badge, Pagination } from 'react-bootstrap';
import api from '../services/api';

const SchemeMasterDownload = () => {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [files, setFiles] = useState([]);
  const [schemeData, setSchemeData] = useState(null);
  const [activeTab, setActiveTab] = useState('files');
  const [dataLimit, setDataLimit] = useState(100);
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rawDataLimit, setRawDataLimit] = useState(10);

  // Load available files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Load scheme data when tab changes to 'json' or 'raw'
  useEffect(() => {
    if (activeTab === 'json' && !schemeData && selectedFile) {
      loadSchemeData();
    } else if (activeTab === 'raw' && !rawData && selectedFile) {
      loadRawData();
    }
  }, [activeTab, schemeData, rawData, selectedFile]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSchemeMasterFiles();
      setFiles(response.data.files || []);
      
      // Auto-select the first file if available
      if (response.data.files && response.data.files.length > 0) {
        setSelectedFile(response.data.files[0].fileName);
      }
    } catch (err) {
      console.error('Failed to load scheme master files:', err);
      setError('Failed to load scheme master files. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadSchemeData = async (fileName = selectedFile, limit = dataLimit) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSchemeMasterJson({ fileName, limit });
      setSchemeData(response.data);
    } catch (err) {
      console.error('Failed to load scheme data:', err);
      setError('Failed to load scheme data. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadRawData = async (fileName = selectedFile, limit = rawDataLimit) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSchemeMasterJson({ fileName, limit: 10000 }); // Get more data for pagination
      setRawData(response.data);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (err) {
      console.error('Failed to load raw scheme data:', err);
      setError('Failed to load raw scheme data. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (forceDownload = false) => {
    try {
      setDownloading(true);
      setError(null);
      setSuccess(null);
      const response = await api.downloadSchemeMaster({ forceDownload });
      setSuccess(response.data.message);
      loadFiles(); // Refresh file list
      
      // Clear cached data to reload with new file
      setSchemeData(null);
      setRawData(null);
    } catch (err) {
      console.error('Failed to download scheme master:', err);
      setError('Failed to download scheme master. ' + (err.response?.data?.error || err.message));
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = (fileName) => {
    setSelectedFile(fileName);
    setSchemeData(null); // Clear previous data
    setRawData(null);
    
    if (activeTab === 'json') {
      loadSchemeData(fileName, dataLimit);
    } else if (activeTab === 'raw') {
      loadRawData(fileName, rawDataLimit);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setDataLimit(newLimit);
  };

  const handleRawDataLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setRawDataLimit(newLimit);
    
    // Reset to first page when changing limit
    setCurrentPage(1);
  };

  const handleApplyLimit = () => {
    setSchemeData(null);
    loadSchemeData(selectedFile, dataLimit);
  };

  const handleApplyRawDataLimit = () => {
    // No need to reload data, just update the limit and reset page
    setCurrentPage(1);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleSwitchToOrderTab = () => {
    if (window.switchToOrderTab) {
      window.switchToOrderTab();
    }
  };

  // Calculate pagination
  const indexOfLastRecord = currentPage * rawDataLimit;
  const indexOfFirstRecord = indexOfLastRecord - rawDataLimit;
  const pageData = rawData?.data ? rawData.data.slice(indexOfFirstRecord, indexOfLastRecord) : [];
  const totalPages = rawData?.data ? Math.ceil(rawData.data.length / rawDataLimit) : 0;

  // Generate column headers from first record if available
  const tableColumns = pageData.length > 0 ? Object.keys(pageData[0]) : [];

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageItems = [];
    
    // Show first page
    pageItems.push(
      <Pagination.Item 
        key={1} 
        active={1 === currentPage}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Show ellipsis if needed
    if (currentPage > 3) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis-1" />);
    }
    
    // Show pages around current page
    for (let number = Math.max(2, currentPage - 1); number <= Math.min(currentPage + 1, totalPages - 1); number++) {
      pageItems.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      pageItems.push(<Pagination.Ellipsis key="ellipsis-2" />);
    }
    
    // Show last page if not already shown
    if (totalPages > 1) {
      pageItems.push(
        <Pagination.Item 
          key={totalPages} 
          active={totalPages === currentPage}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return (
      <Pagination className="mt-3 justify-content-center">
        <Pagination.Prev 
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        />
        {pageItems}
        <Pagination.Next 
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        />
      </Pagination>
    );
  };

  return (
    <div className="scheme-master-download">
      <div className="card">
        <div className="card-header bg-info text-white">
          <h4 className="mb-0">Scheme Master Download</h4>
        </div>
        <div className="card-body">
          {files.length === 0 && (
            <Alert variant="warning" className="mb-3">
              <Alert.Heading>Important: Scheme Master Required</Alert.Heading>
              <p>
                You need to download the latest scheme master file to use the Order Entry functionality. 
                The scheme master contains the list of available mutual fund schemes for investment.
              </p>
              <p>
                Please click the "Use/Download Latest Scheme Master" button below to download the latest scheme data.
              </p>
            </Alert>
          )}
          
          {files.length > 0 && (
            <Alert variant="success" className="mb-3">
              <Alert.Heading>Scheme Master Available</Alert.Heading>
              <p>
                You have {files.length} scheme master file(s) available. The Order Entry tab is using the most recent file automatically.
              </p>
              <div className="d-flex justify-content-end">
                <Button 
                  variant="outline-primary" 
                  onClick={handleSwitchToOrderTab}
                >
                  Go to Order Entry
                </Button>
              </div>
            </Alert>
          )}
          
          <div className="mb-3">
            <Button 
              variant="primary" 
              onClick={() => handleDownload(false)}
              disabled={downloading}
              className="me-2"
            >
              {downloading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Processing...
                </>
              ) : (
                'Use/Download Latest Scheme Master'
              )}
            </Button>
            
            <Button 
              variant="warning" 
              onClick={() => handleDownload(true)}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Processing...
                </>
              ) : (
                'Force New Download'
              )}
            </Button>
          </div>
          
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mt-3">
              {success}
            </Alert>
          )}
          
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-3"
          >
            <Tab eventKey="files" title="Available Files">
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : files.length === 0 ? (
                <Alert variant="info">
                  No scheme master files found. Click "Download Latest Scheme Master" to get started.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Size</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file, index) => (
                        <tr key={index} className={selectedFile === file.fileName ? 'table-primary' : ''}>
                          <td>{file.fileName}</td>
                          <td>{formatFileSize(file.size)}</td>
                          <td>{formatDate(file.created)}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleFileSelect(file.fileName)}
                              className="me-2"
                            >
                              Select
                            </Button>
                            <a 
                              href={api.getSchemeMasterRawUrl(file.fileName)} 
                              download={file.fileName}
                              className="btn btn-outline-success btn-sm"
                            >
                              Download
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>
            
            <Tab eventKey="json" title="JSON View">
              <div className="mb-3 d-flex">
                <Form.Group className="me-3">
                  <Form.Label>Data Limit</Form.Label>
                  <Form.Control
                    type="number"
                    min="10"
                    max="10000"
                    value={dataLimit}
                    onChange={handleLimitChange}
                    style={{ width: '150px' }}
                  />
                  <Form.Text className="text-muted">
                    Limit the number of rows to display (10-10000)
                  </Form.Text>
                </Form.Group>
                <Button 
                  variant="primary" 
                  onClick={handleApplyLimit}
                  disabled={loading}
                  className="mt-4"
                >
                  Apply
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : !selectedFile ? (
                <Alert variant="info">
                  Please select a file first from the "Available Files" tab.
                </Alert>
              ) : !schemeData ? (
                <Alert variant="info">
                  Loading scheme data...
                </Alert>
              ) : (
                <div>
                  <div className="d-flex justify-content-between mb-3">
                    <h5>
                      {schemeData.fileName} 
                      <Badge bg="info" className="ms-2">
                        {schemeData.total} schemes
                      </Badge>
                      {schemeData.limited && (
                        <Badge bg="warning" className="ms-2">
                          Limited to {schemeData.limit} records
                        </Badge>
                      )}
                    </h5>
                  </div>
                  
                  <div className="json-viewer">
                    <pre style={{ maxHeight: '600px', overflow: 'auto' }}>
                      {JSON.stringify(schemeData.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </Tab>
            
            <Tab eventKey="raw" title="Table View">
              <div className="mb-3 d-flex">
                <Form.Group className="me-3">
                  <Form.Label>Rows Per Page</Form.Label>
                  <Form.Control
                    type="number"
                    min="5"
                    max="100"
                    value={rawDataLimit}
                    onChange={handleRawDataLimitChange}
                    style={{ width: '150px' }}
                  />
                  <Form.Text className="text-muted">
                    Number of rows per page (5-100)
                  </Form.Text>
                </Form.Group>
                <Button 
                  variant="primary" 
                  onClick={handleApplyRawDataLimit}
                  disabled={loading}
                  className="mt-4"
                >
                  Apply
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : !selectedFile ? (
                <Alert variant="info">
                  Please select a file first from the "Available Files" tab.
                </Alert>
              ) : !rawData ? (
                <Alert variant="info">
                  Loading scheme data...
                </Alert>
              ) : (
                <div>
                  <div className="d-flex justify-content-between mb-3">
                    <h5>
                      {rawData.fileName} 
                      <Badge bg="info" className="ms-2">
                        {rawData.total} schemes
                      </Badge>
                      <Badge bg="primary" className="ms-2">
                        Page {currentPage} of {totalPages}
                      </Badge>
                      <Badge bg="secondary" className="ms-2">
                        Showing {indexOfFirstRecord+1}-{Math.min(indexOfLastRecord, rawData.data.length)} of {rawData.data.length}
                      </Badge>
                    </h5>
                  </div>
                  
                  <div className="table-responsive" style={{ maxHeight: '600px', overflow: 'auto' }}>
                    {pageData.length > 0 ? (
                      <Table striped bordered hover size="sm">
                        <thead className="sticky-top bg-light">
                          <tr>
                            {tableColumns.map((col, index) => (
                              <th key={index}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {tableColumns.map((col, colIndex) => (
                                <td key={colIndex}>{row[col]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Alert variant="info">No data available</Alert>
                    )}
                  </div>
                  
                  {renderPagination()}
                  
                  <div className="mt-3 text-center">
                    <a 
                      href={api.getSchemeMasterRawUrl(selectedFile)} 
                      download={selectedFile}
                      className="btn btn-outline-success"
                    >
                      Download Full File
                    </a>
                  </div>
                </div>
              )}
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SchemeMasterDownload; 