import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import ResponseDisplay from './ResponseDisplay';
import api from '../services/api';

const OrderStatusReport = () => {
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    transType: 'ALL',
    orderType: 'ALL',
    subOrderType: 'ALL'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const validateDateRange = (fromDate, toDate) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.fromDate || !formData.toDate) {
      setError('Please select both From Date and To Date');
      return;
    }

    if (!validateDateRange(formData.fromDate, formData.toDate)) {
      setError('Date range cannot exceed 7 days');
      return;
    }

    try {
      setLoading(true);
      const response = await api.getOrderStatusReport(formData);
      setReportData(response);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-status-report">
      <h2>Order Status Report</h2>
      
      <Form onSubmit={handleSubmit} className="mb-4">
        <div className="row">
          <div className="col-md-6">
            <Form.Group className="mb-3">
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </div>
          
          <div className="col-md-6">
            <Form.Group className="mb-3">
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Transaction Type</Form.Label>
              <Form.Select
                name="transType"
                value={formData.transType}
                onChange={handleInputChange}
              >
                <option value="ALL">All</option>
                <option value="P">Purchase</option>
                <option value="R">Redemption</option>
              </Form.Select>
            </Form.Group>
          </div>

          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Order Type</Form.Label>
              <Form.Select
                name="orderType"
                value={formData.orderType}
                onChange={handleInputChange}
              >
                <option value="ALL">All</option>
                <option value="NRM">Normal</option>
                <option value="SIP">SIP</option>
                <option value="XSTP">XSTP</option>
                <option value="STP">STP</option>
              </Form.Select>
            </Form.Group>
          </div>

          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Sub Order Type</Form.Label>
              <Form.Select
                name="subOrderType"
                value={formData.subOrderType}
                onChange={handleInputChange}
              >
                <option value="ALL">All</option>
                <option value="NRM">Normal</option>
                <option value="SPOR">SPOR</option>
                <option value="SWH">Switch</option>
                <option value="STP">STP</option>
              </Form.Select>
            </Form.Group>
          </div>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          disabled={loading}
          className="w-100"
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Fetching Report...
            </>
          ) : (
            'Get Report'
          )}
        </Button>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      {reportData && <ResponseDisplay response={reportData} />}
    </div>
  );
};

export default OrderStatusReport; 