import React, { useState } from 'react';

const AOFImageUpload = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        client_code: '',
        file_name: '',
        document_type: 'NRM',
        file_data: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Update file name
            setFormData(prev => ({
                ...prev,
                file_name: file.name
            }));

            // Convert file to base64
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                setFormData(prev => ({
                    ...prev,
                    file_data: base64String
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.file_data) {
            alert('Please select a file to upload');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">AOF Image Upload</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="client_code" className="form-label">Client Code *</label>
                        <input
                            type="text"
                            className="form-control"
                            id="client_code"
                            name="client_code"
                            value={formData.client_code}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="document_type" className="form-label">Document Type *</label>
                        <select
                            className="form-select"
                            id="document_type"
                            name="document_type"
                            value={formData.document_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="NRM">Normal</option>
                            <option value="COR">Correction</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="file" className="form-label">AOF Image *</label>
                        <input
                            type="file"
                            className="form-control"
                            id="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            required
                        />
                        <small className="form-text text-muted">
                            Supported formats: Images (JPG, PNG) and PDF
                        </small>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Uploading...' : 'Upload AOF'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AOFImageUpload; 