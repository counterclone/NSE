import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SchemeSelector from './components/SchemeSelector';
import OrderForm from './components/OrderForm';
import ResponseDisplay from './components/ResponseDisplay';
import UCCRegistrationForm from './components/UCCRegistrationForm';
import UCCRegistration183Form from './components/UCCRegistration183Form';
import OrderStatusReport from './components/OrderStatusReport';
import OrderCancellation from './components/OrderCancellation';
import SchemeMasterDownload from './components/SchemeMasterDownload';
import DatabaseViewer from './components/DatabaseViewer';
import AOFTabs from './components/AOFTabs';
import FATCATabs from './components/FATCATabs';
import api from './services/api';

function App() {
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('order'); // 'order', 'ucc', 'ucc183', 'report', 'cancel', 'scheme', 'database', 'aof', or 'fatca'

  // Add global functions to switch between tabs
  useEffect(() => {
    // Function to switch to Scheme Master tab
    window.switchToSchemeMasterTab = () => {
      handleTabChange('scheme');
    };

    // Function to switch to Order Entry tab
    window.switchToOrderTab = () => {
      handleTabChange('order');
    };

    // Cleanup
    return () => {
      delete window.switchToSchemeMasterTab;
      delete window.switchToOrderTab;
    };
  }, []);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        const response = await api.getSchemes();
        setSchemes(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch schemes:', err);
        setError(err.response?.data?.error || 'Failed to load schemes. Please try again later.');
        toast.error('Failed to load schemes');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'order') {
      fetchSchemes();
    }
  }, [activeTab]);

  const handleSchemeSelect = (scheme) => {
    setSelectedScheme(scheme);
    setResponse(null);
  };

  const handleSubmitOrder = async (orderData) => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const response = await api.submitOrder({
        schemeCode: selectedScheme.code,
        ...orderData
      });

      setResponse(response.data);
      toast.success('Order submitted successfully');
    } catch (err) {
      console.error('Order submission failed:', err);
      setError(err.response?.data?.error || 'Failed to submit order');
      toast.error('Order submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUCC = async (clientDetails) => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const response = await api.registerUCC(clientDetails);

      setResponse(response.data);
      toast.success('UCC Registration submitted successfully');
    } catch (err) {
      console.error('UCC Registration failed:', err);
      setError(err.response?.data?.error || 'Failed to register UCC');
      toast.error('UCC Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUCC183 = async (clientDetails) => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const response = await api.registerUCC183(clientDetails);

      setResponse(response.data);
      toast.success('UCC Registration (183) submitted successfully');
    } catch (err) {
      console.error('UCC Registration (183) failed:', err);
      setError(err.response?.data?.error || 'Failed to register UCC');
      toast.error('UCC Registration (183) failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResponse(null);
    setError(null);
  };

  return (
    <div className="container mt-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">NSE Invest Platform</h2>
            </div>
            <div className="card-body">
              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'order' ? 'active' : ''}`}
                    onClick={() => handleTabChange('order')}
                  >
                    Order Entry
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'cancel' ? 'active' : ''}`}
                    onClick={() => handleTabChange('cancel')}
                  >
                    Order Cancellation
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
                    onClick={() => handleTabChange('report')}
                  >
                    Order Status Report
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'ucc' ? 'active' : ''}`}
                    onClick={() => handleTabChange('ucc')}
                  >
                    UCC Registration
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'ucc183' ? 'active' : ''}`}
                    onClick={() => handleTabChange('ucc183')}
                  >
                    UCC Registration (183)
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'aof' ? 'active' : ''}`}
                    onClick={() => handleTabChange('aof')}
                  >
                    AOF
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'fatca' ? 'active' : ''}`}
                    onClick={() => handleTabChange('fatca')}
                  >
                    FATCA
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'scheme' ? 'active' : ''}`}
                    onClick={() => handleTabChange('scheme')}
                  >
                    Scheme Master
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'database' ? 'active' : ''}`}
                    onClick={() => handleTabChange('database')}
                  >
                    Database
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'order' && (
        <div className="row">
          <div className="col-md-5">
            <SchemeSelector
              schemes={schemes}
              loading={loading}
              error={error}
              onSchemeSelect={handleSchemeSelect}
              selectedScheme={selectedScheme}
            />
          </div>

          <div className="col-md-7">
            {selectedScheme ? (
              <OrderForm
                scheme={selectedScheme}
                onSubmit={handleSubmitOrder}
                loading={loading}
              />
            ) : (
              <div className="card">
                <div className="card-body">
                  <p className="text-center text-muted">Please select a scheme to continue</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'cancel' && (
        <div className="row">
          <div className="col-12">
            <OrderCancellation />
          </div>
        </div>
      )}

      {activeTab === 'ucc' && (
        <div className="row">
          <div className="col-12">
            <UCCRegistrationForm
              onSubmit={handleSubmitUCC}
              loading={loading}
            />
          </div>
        </div>
      )}

      {activeTab === 'ucc183' && (
        <div className="row">
          <div className="col-12">
            <UCCRegistration183Form
              onSubmit={handleSubmitUCC183}
              loading={loading}
            />
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="row">
          <div className="col-12">
            <OrderStatusReport />
          </div>
        </div>
      )}

      {activeTab === 'scheme' && (
        <div className="row">
          <div className="col-12">
            <SchemeMasterDownload />
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="row">
          <div className="col-12">
            <DatabaseViewer />
          </div>
        </div>
      )}

      {activeTab === 'aof' && (
        <div className="row">
          <div className="col-12">
            <AOFTabs />
          </div>
        </div>
      )}

      {activeTab === 'fatca' && (
        <div className="row">
          <div className="col-12">
            <FATCATabs />
          </div>
        </div>
      )}

      {response && activeTab !== 'report' && activeTab !== 'cancel' && activeTab !== 'scheme' && activeTab !== 'database' && activeTab !== 'aof' && activeTab !== 'fatca' && (
        <div className="row mt-4">
          <div className="col-12">
            <ResponseDisplay response={response} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 