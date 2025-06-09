import React, { useState } from 'react';

const AOFImageReport = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        client_code: '',
        from_date: '',
        to_date: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const validateDates = () => {
        if (!formData.from_date || !formData.to_date) return true;

        const from = new Date(formData.from_date);
        const to = new Date(formData.to_date);
        const diffTime = Math.abs(to - from);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (!formData.client_code && diffDays > 31) {
            alert('Date range cannot exceed 31 days when client code is not provided');
            return false;
        }

        if (from > to) {
            alert('From date cannot be greater than to date');
            return false;
        }

        return true;
    };

    const validateClientCodes = () => {
        if (formData.client_code) {
            const codes = formData.client_code.split(',');
            if (codes.length > 50) {
                alert('Maximum 50 client codes are allowed');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateDates() || !validateClientCodes()) {
            return;
        }

        const formattedData = {
            ...formData,
            from_date: formatDate(formData.from_date),
            to_date: formatDate(formData.to_date)
        };

        onSubmit(formattedData);
    };

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">AOF Image Upload Report</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="client_code" className="form-label">Client Code(s)</label>
                        <input
                            type="text"
                            className="form-control"
                            id="client_code"
                            name="client_code"
                            value={formData.client_code}
                            onChange={handleChange}
                            placeholder="Enter up to 50 client codes separated by commas"
                        />
                        <small className="form-text text-muted">
                            Optional. You can enter multiple client codes separated by commas (max 50)
                        </small>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="from_date" className="form-label">From Date *</label>
                            <input
                                type="date"
                                className="form-control"
                                id="from_date"
                                name="from_date"
                                value={formData.from_date}
                                onChange={handleChange}
                                required={!formData.client_code}
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label htmlFor="to_date" className="form-label">To Date *</label>
                            <input
                                type="date"
                                className="form-control"
                                id="to_date"
                                name="to_date"
                                value={formData.to_date}
                                onChange={handleChange}
                                required={!formData.client_code}
                            />
                        </div>
                    </div>

                    <div className="alert alert-info" role="alert">
                        <small>
                            Note: If no client code is provided, date range must be within 31 days
                        </small>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Generating Report...' : 'Generate Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AOFImageReport; 