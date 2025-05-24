import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

function DatabaseViewer() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [uccRegistrations, setUccRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientCodeFilter, setClientCodeFilter] = useState('');
  const [schemeCodeFilter, setSchemeCodeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'ucc') {
      fetchUCCRegistrations();
    }
  }, [activeTab, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const skip = (currentPage - 1) * itemsPerPage;
      const params = {
        limit: itemsPerPage,
        skip,
        clientCode: clientCodeFilter || undefined,
        schemeCode: schemeCodeFilter || undefined
      };
      
      const response = await api.getStoredOrders(params);
      
      if (response.data && response.data.success) {
        setOrders(response.data.data);
        setTotalItems(response.data.pagination?.total || 0);
      } else {
        setError('Failed to fetch order data');
        toast.error('Failed to fetch order data');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.error || 'An error occurred while fetching data');
      toast.error('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  const fetchUCCRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const skip = (currentPage - 1) * itemsPerPage;
      const params = {
        limit: itemsPerPage,
        skip,
        clientCode: clientCodeFilter || undefined
      };
      
      const response = await api.getStoredUCCRegistrations(params);
      
      if (response.data && response.data.success) {
        setUccRegistrations(response.data.data);
        setTotalItems(response.data.pagination?.total || 0);
      } else {
        setError('Failed to fetch UCC registration data');
        toast.error('Failed to fetch UCC registration data');
      }
    } catch (err) {
      console.error('Error fetching UCC registrations:', err);
      setError(err.response?.data?.error || 'An error occurred while fetching data');
      toast.error('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when applying new filters
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'ucc') {
      fetchUCCRegistrations();
    }
  };

  const handleReset = () => {
    setClientCodeFilter('');
    setSchemeCodeFilter('');
    setCurrentPage(1);
    
    // Wait for state to update, then fetch
    setTimeout(() => {
      if (activeTab === 'orders') {
        fetchOrders();
      } else if (activeTab === 'ucc') {
        fetchUCCRegistrations();
      }
    }, 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderOrdersTable = () => {
    if (loading) {
      return <div className="text-center my-4"><div className="spinner-border" role="status"></div></div>;
    }
    
    if (error) {
      return <div className="alert alert-danger">{error}</div>;
    }
    
    if (orders.length === 0) {
      return <div className="alert alert-info">No order data found</div>;
    }
    
    return (
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-primary">
            <tr>
              <th>Order Reference</th>
              <th>Client Code</th>
              <th>Scheme Code</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Transaction ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.order_ref_number}</td>
                <td>{order.client_code}</td>
                <td>{order.scheme_code}</td>
                <td>₹{order.order_amount ? parseFloat(order.order_amount).toLocaleString() : '0'}</td>
                <td>
                  <span className={`badge ${order.trxn_status === 'SUCCESS' ? 'bg-success' : 
                    order.trxn_status === 'FAILURE' ? 'bg-danger' : 
                    order.trxn_status === 'SIMULATED' ? 'bg-warning' : 'bg-secondary'}`}>
                    {order.trxn_status || 'PENDING'}
                  </span>
                </td>
                <td>{order.trxn_order_id || 'N/A'}</td>
                <td>{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderUCCRegistrationsTable = () => {
    if (loading) {
      return <div className="text-center my-4"><div className="spinner-border" role="status"></div></div>;
    }
    
    if (error) {
      return <div className="alert alert-danger">{error}</div>;
    }
    
    if (uccRegistrations.length === 0) {
      return <div className="alert alert-info">No UCC registration data found</div>;
    }
    
    return (
      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-primary">
            <tr>
              <th>Client Code</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Registration ID</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {uccRegistrations.map((registration) => (
              <tr key={registration._id}>
                <td>{registration.client_code}</td>
                <td>{registration.primary_holder_first_name || 'N/A'}</td>
                <td>{registration.primary_holder_last_name || 'N/A'}</td>
                <td>{registration.reg_id || 'N/A'}</td>
                <td>
                  <span className={`badge ${registration.reg_status === 'REG_SUCCESS' ? 'bg-success' : 
                    registration.reg_status === 'REG_FAILURE' ? 'bg-danger' : 
                    registration.reg_status === 'REG_PENDING' ? 'bg-warning' : 'bg-secondary'}`}>
                    {registration.reg_status || 'REG_PENDING'}
                  </span>
                </td>
                <td>{formatDate(registration.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    return (
      <nav aria-label="Page navigation">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
          </li>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => (
              page === 1 || 
              page === totalPages || 
              (page >= currentPage - 1 && page <= currentPage + 1)
            ))
            .map((page, index, array) => {
              // Add ellipsis
              if (index > 0 && array[index - 1] !== page - 1) {
                return (
                  <React.Fragment key={`ellipsis-${page}`}>
                    <li className="page-item disabled">
                      <span className="page-link">...</span>
                    </li>
                    <li className={`page-item ${currentPage === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(page)}>
                        {page}
                      </button>
                    </li>
                  </React.Fragment>
                );
              }
              
              return (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(page)}>
                    {page}
                  </button>
                </li>
              );
            })}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Database Records</h5>
      </div>
      <div className="card-body">
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleTabChange('orders')}
            >
              Orders
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'ucc' ? 'active' : ''}`}
              onClick={() => handleTabChange('ucc')}
            >
              UCC Registrations
            </button>
          </li>
        </ul>
        
        <div className="row mb-3">
          <div className="col-md-10">
            <div className="row g-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Client Code"
                  value={clientCodeFilter}
                  onChange={(e) => setClientCodeFilter(e.target.value)}
                />
              </div>
              
              {activeTab === 'orders' && (
                <div className="col-md-4">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Scheme Code"
                    value={schemeCodeFilter}
                    onChange={(e) => setSchemeCodeFilter(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="col-md-2">
            <div className="d-grid gap-2">
              <button className="btn btn-primary" onClick={handleSearch}>
                Search
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
        </div>
        
        {activeTab === 'orders' && renderOrdersTable()}
        {activeTab === 'ucc' && renderUCCRegistrationsTable()}
        
        {renderPagination()}
      </div>
    </div>
  );
}

export default DatabaseViewer; 