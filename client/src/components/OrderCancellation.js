import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import ResponseDisplay from './ResponseDisplay';
import api from '../services/api';

const OrderCancellation = () => {
  const [formData, setFormData] = useState({
    client_code: '',
    order_no: '',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [addMultiple, setAddMultiple] = useState(false);
  const [ordersList, setOrdersList] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddOrder = () => {
    // Validate the current form data
    if (!formData.client_code || !formData.order_no || !formData.remarks) {
      setError('All fields are required to add an order');
      return;
    }

    // Add the current form data to the orders list
    setOrdersList(prev => [...prev, { ...formData }]);

    // Clear the form for the next order
    setFormData({
      client_code: '',
      order_no: '',
      remarks: ''
    });

    // Clear any previous errors
    setError(null);
  };

  const handleRemoveOrder = (index) => {
    setOrdersList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      setLoading(true);
      
      // Determine whether to send a single order or multiple orders
      const payload = addMultiple && ordersList.length > 0 
        ? ordersList 
        : formData;
      
      // Validate that we have data to submit
      if (addMultiple && ordersList.length === 0) {
        setError('Please add at least one order to cancel');
        setLoading(false);
        return;
      }
      
      if (!addMultiple && (!formData.client_code || !formData.order_no || !formData.remarks)) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      const response = await api.cancelOrder(payload);
      setResponse(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process cancellation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-cancellation">
      <div className="card mb-4">
        <div className="card-header bg-danger text-white">
          <h4 className="mb-0">Order Cancellation</h4>
        </div>
        <div className="card-body">
          <Form.Check 
            type="switch"
            id="multiple-orders-switch"
            label="Cancel multiple orders"
            checked={addMultiple}
            onChange={() => setAddMultiple(!addMultiple)}
            className="mb-3"
          />

          {addMultiple ? (
            <div className="multiple-orders mb-3">
              <Form>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <Form.Group>
                      <Form.Label>Client Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="client_code"
                        value={formData.client_code}
                        onChange={handleInputChange}
                        placeholder="Enter client code"
                      />
                    </Form.Group>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <Form.Group>
                      <Form.Label>Order Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="order_no"
                        value={formData.order_no}
                        onChange={handleInputChange}
                        placeholder="Enter order number"
                      />
                    </Form.Group>
                  </div>
                  
                  <div className="col-md-4 mb-3">
                    <Form.Group>
                      <Form.Label>Remarks</Form.Label>
                      <Form.Control
                        type="text"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        placeholder="Enter cancellation reason"
                      />
                    </Form.Group>
                  </div>
                </div>
                
                <Button 
                  variant="secondary" 
                  onClick={handleAddOrder}
                  className="mb-3"
                >
                  Add Order
                </Button>
              </Form>
              
              {ordersList.length > 0 && (
                <div className="orders-list mt-3">
                  <h5>Orders to Cancel:</h5>
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                      <thead>
                        <tr>
                          <th>Client Code</th>
                          <th>Order Number</th>
                          <th>Remarks</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersList.map((order, index) => (
                          <tr key={index}>
                            <td>{order.client_code}</td>
                            <td>{order.order_no}</td>
                            <td>{order.remarks}</td>
                            <td>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleRemoveOrder(index)}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <Button 
                variant="primary" 
                onClick={handleSubmit}
                disabled={loading || ordersList.length === 0}
                className="mt-3 w-100"
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Processing...
                  </>
                ) : (
                  'Cancel Orders'
                )}
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <Form.Group>
                    <Form.Label>Client Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="client_code"
                      value={formData.client_code}
                      onChange={handleInputChange}
                      placeholder="Enter client code"
                      required
                    />
                  </Form.Group>
                </div>
                
                <div className="col-md-4 mb-3">
                  <Form.Group>
                    <Form.Label>Order Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="order_no"
                      value={formData.order_no}
                      onChange={handleInputChange}
                      placeholder="Enter order number"
                      required
                    />
                  </Form.Group>
                </div>
                
                <div className="col-md-4 mb-3">
                  <Form.Group>
                    <Form.Label>Remarks</Form.Label>
                    <Form.Control
                      type="text"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Enter cancellation reason"
                      required
                    />
                  </Form.Group>
                </div>
              </div>
              
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
                className="w-100"
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Processing...
                  </>
                ) : (
                  'Cancel Order'
                )}
              </Button>
            </Form>
          )}
          
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
        </div>
      </div>
      
      {response && <ResponseDisplay response={response} />}
    </div>
  );
};

export default OrderCancellation; 