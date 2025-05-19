import React from 'react';

const ResponseDisplay = ({ response }) => {
  return (
    <div className="card mb-4">
      <div className="card-header bg-success text-white">
        <h4 className="mb-0">Order Response</h4>
      </div>
      <div className="card-body">
        {response.simulated && (
          <div className="alert alert-warning mb-3">
            <strong>Note:</strong> This is a simulated response for development purposes.
          </div>
        )}
        
        <div className="response-container">
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
        
        {response.success && (
          <div className="alert alert-success mt-3">
            <strong>Success!</strong> Your order has been processed.
            {response.data?.order_id && (
              <div className="mt-2">
                <strong>Order ID:</strong> {response.data.order_id}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseDisplay; 