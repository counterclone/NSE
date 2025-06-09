import React, { useState } from 'react';

const FATCAReport = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        pan_pkrn_no: '',
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

        if (diffDays > 31) {
            alert('Date range cannot exceed 31 days');
            return false;
        }

        if (from > to) {
            alert('From date cannot be greater than to date');
            return false;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateDates()) {
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
                <h5 className="card-title">FATCA Report</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="pan_pkrn_no" className="form-label">PAN/PEKRN Number</label>
                        <input
                            type="text"
                            className="form-control"
                            id="pan_pkrn_no"
                            name="pan_pkrn_no"
                            value={formData.pan_pkrn_no}
                            onChange={handleChange}
                            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                            title="Please enter a valid PAN number (e.g., ABCDE1234F)"
                        />
                        <small className="form-text text-muted">
                            Optional. If not provided, report will include all records within the date range.
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
                                required
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
                                required
                            />
                        </div>
                    </div>

                    <div className="alert alert-info" role="alert">
                        <small>
                            Note: Date range must be within 31 days
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

export default FATCAReport; 