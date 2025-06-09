import React, { useState } from 'react';
import AOFImageUpload from './AOFImageUpload';
import AOFImageReport from './AOFImageReport';

const AOFTabs = () => {
    const [activeTab, setActiveTab] = useState('upload');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleImageUpload = async (formData) => {
        try {
            setLoading(true);
            setError(null);
            setResponse(null);

            const response = await fetch('/api/aof-image-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload AOF image');
            }

            setResponse(data);
        } catch (err) {
            console.error('AOF Image Upload failed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (formData) => {
        try {
            setLoading(true);
            setError(null);
            setResponse(null);

            const response = await fetch('/api/aof-image-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate AOF report');
            }

            setResponse(data);
        } catch (err) {
            console.error('AOF Report Generation failed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                                onClick={() => setActiveTab('upload')}
                            >
                                AOF Image Upload
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
                                onClick={() => setActiveTab('report')}
                            >
                                AOF Image Report
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="row">
                <div className="col-md-8">
                    {activeTab === 'upload' ? (
                        <AOFImageUpload onSubmit={handleImageUpload} loading={loading} />
                    ) : (
                        <AOFImageReport onSubmit={handleGenerateReport} loading={loading} />
                    )}
                </div>

                <div className="col-md-4">
                    {error && (
                        <div className="alert alert-danger">
                            <h6>Error</h6>
                            <p>{error}</p>
                        </div>
                    )}

                    {response && (
                        <div className="alert alert-success">
                            <h6>Response</h6>
                            <pre className="mb-0">
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AOFTabs; 