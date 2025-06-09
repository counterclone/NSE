import React, { useState } from 'react';

const FATCAImageUpload = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        file_name: '',
        pan_no: '',
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
                <h5 className="card-title">FATCA Image Upload</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="pan_no" className="form-label">PAN Number *</label>
                        <input
                            type="text"
                            className="form-control"
                            id="pan_no"
                            name="pan_no"
                            value={formData.pan_no}
                            onChange={handleChange}
                            required
                            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                            title="Please enter a valid PAN number (e.g., ABCDE1234F)"
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="file" className="form-label">FATCA Image *</label>
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
                        {loading ? 'Uploading...' : 'Upload FATCA'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FATCAImageUpload; 