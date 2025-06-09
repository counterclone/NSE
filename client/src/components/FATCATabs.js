import React, { useState } from 'react';
import FATCAUpload from './FATCAUpload';
import FATCAReport from './FATCAReport';
import FATCAImageUpload from './FATCAImageUpload';

const FATCATabs = () => {
    const [activeTab, setActiveTab] = useState('upload');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleFATCAUpload = async (formData) => {
        try {
            setLoading(true);
            setError(null);
            setResponse(null);

            const response = await fetch('/api/registration/FATCA_COMMON', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit FATCA registration');
            }

            setResponse(data);
        } catch (err) {
            console.error('FATCA Registration failed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFATCAReport = async (formData) => {
        try {
            setLoading(true);
            setError(null);
            setResponse(null);

            const response = await fetch('/api/reports/FATCA_REPORT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate FATCA report');
            }

            setResponse(data);
        } catch (err) {
            console.error('FATCA Report Generation failed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFATCAImageUpload = async (formData) => {
        try {
            setLoading(true);
            setError(null);
            setResponse(null);

            const response = await fetch('/api/fileupload/FATCAIMG', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload FATCA image');
            }

            setResponse(data);
        } catch (err) {
            console.error('FATCA Image Upload failed:', err);
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
                                FATCA Registration
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
                                onClick={() => setActiveTab('report')}
                            >
                                FATCA Report
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'image' ? 'active' : ''}`}
                                onClick={() => setActiveTab('image')}
                            >
                                FATCA Image Upload
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="row">
                <div className="col-md-8">
                    {activeTab === 'upload' ? (
                        <FATCAUpload onSubmit={handleFATCAUpload} loading={loading} />
                    ) : activeTab === 'report' ? (
                        <FATCAReport onSubmit={handleFATCAReport} loading={loading} />
                    ) : (
                        <FATCAImageUpload onSubmit={handleFATCAImageUpload} loading={loading} />
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

export default FATCATabs; 