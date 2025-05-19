import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/clients');
        if (res.data && res.data.success) {
          setClients(res.data.clients);
        } else {
          setError('Failed to fetch clients');
        }
      } catch (err) {
        setError('Failed to fetch clients');
      }
      setLoading(false);
    };
    fetchClients();
  }, []);

  return (
    <div className="card mb-4">
      <div className="card-header bg-secondary text-white">
        <h4 className="mb-0">Registered Clients</h4>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center">
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading clients...
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : clients.length === 0 ? (
          <div className="alert alert-info">No clients registered yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Client Code</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, idx) => (
                  <tr key={client.clientCode || idx}>
                    <td>{client.clientCode}</td>
                    <td>{client.firstName}</td>
                    <td>{client.lastName}</td>
                    <td>{client.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients; 