import React, { useState } from 'react';

const OrderForm = ({ scheme, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    amount: '',
    clientCode: 'H34567', // Default client code from order-entry.js
    remarks: '',
    email: '',
    mobileNo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-info text-white">
        <h4 className="mb-0">Order Details</h4>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <h5>Selected Scheme</h5>
          <div className="p-3 bg-light rounded">
            <div><strong>Code:</strong> {scheme.code}</div>
            <div><strong>Name:</strong> {scheme.name}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="amount" className="form-label">Amount (₹) *</label>
            <input
              type="number"
              className="form-control"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="1000"
              required
            />
            <div className="form-text">Minimum amount is ₹1,000</div>
          </div>

          <div className="mb-3">
            <label htmlFor="clientCode" className="form-label">Client Code *</label>
            <input
              type="text"
              className="form-control"
              id="clientCode"
              name="clientCode"
              value={formData.clientCode}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="remarks" className="form-label">Remarks</label>
            <input
              type="text"
              className="form-control"
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Optional remarks"
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Optional email"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="mobileNo" className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-control"
                id="mobileNo"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleChange}
                placeholder="Optional mobile number"
              />
            </div>
          </div>

          <div className="d-grid">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm; 