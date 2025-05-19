import React, { useState } from 'react';

const UCCRegistrationForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    clientCode: '',
    pan: '',
    firstName: '',
    middleName: '',
    lastName: '',
    taxStatus: '01', // Default for Individual
    gender: 'M',
    dob: '',
    occupationCode: '01', // Default for Service
    holdingNature: 'SI', // Default for Single
    email: '',
    address1: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    mobileNo: '',
    ckycNumber: '',
    communicationMode: 'P',
    paperlessFlag: 'P',
    nominationOpt: 'N',
    aadhaarUpdated: 'Y',
    clientType: 'D'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'pan' ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      [name]: updatedValue
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      dob: formatDate(formData.dob)
    };
    onSubmit(formattedData);
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-info text-white">
        <h4 className="mb-0">UCC Registration</h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="clientCode" className="form-label">Client Code *</label>
              <input
                type="text"
                className="form-control"
                id="clientCode"
                name="clientCode"
                value={formData.clientCode}
                onChange={handleChange}
                maxLength={10}
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="pan" className="form-label">PAN Number *</label>
              <input
                type="text"
                className="form-control"
                id="pan"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                maxLength={10}
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                placeholder="AAAAA1234A"
                required
                style={{textTransform: 'uppercase'}}
              />
              <small className="form-text text-muted">Enter 10 character PAN number</small>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="firstName" className="form-label">First Name *</label>
              <input
                type="text"
                className="form-control"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                maxLength={70}
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="middleName" className="form-label">Middle Name</label>
              <input
                type="text"
                className="form-control"
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                maxLength={70}
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="lastName" className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-control"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                maxLength={70}
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="taxStatus" className="form-label">Tax Status *</label>
              <select
                className="form-select"
                id="taxStatus"
                name="taxStatus"
                value={formData.taxStatus}
                onChange={handleChange}
                required
              >
                <option value="01">Individual</option>
                <option value="02">Company</option>
                <option value="03">NRI</option>
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="gender" className="form-label">Gender *</label>
              <select
                className="form-select"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="dob" className="form-label">Date of Birth *</label>
              <input
                type="date"
                className="form-control"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="occupationCode" className="form-label">Occupation *</label>
              <select
                className="form-select"
                id="occupationCode"
                name="occupationCode"
                value={formData.occupationCode}
                onChange={handleChange}
                required
              >
                <option value="01">Service</option>
                <option value="02">Business</option>
                <option value="03">Professional</option>
                <option value="04">Agriculture</option>
                <option value="05">Retired</option>
                <option value="06">Housewife</option>
                <option value="07">Student</option>
                <option value="08">Others</option>
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="holdingNature" className="form-label">Holding Nature *</label>
              <select
                className="form-select"
                id="holdingNature"
                name="holdingNature"
                value={formData.holdingNature}
                onChange={handleChange}
                required
              >
                <option value="SI">Single</option>
                <option value="JO">Joint</option>
                <option value="AS">Anyone or Survivor</option>
              </select>
            </div>

            <div className="col-md-8 mb-3">
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                maxLength={50}
                required
              />
            </div>

            <div className="col-md-12 mb-3">
              <label htmlFor="address1" className="form-label">Address</label>
              <input
                type="text"
                className="form-control"
                id="address1"
                name="address1"
                value={formData.address1}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="city" className="form-label">City *</label>
              <input
                type="text"
                className="form-control"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                maxLength={35}
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="state" className="form-label">State *</label>
              <select
                className="form-select"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              >
                <option value="">Select State</option>
                <option value="MH">Maharashtra</option>
                <option value="DL">Delhi</option>
                <option value="KA">Karnataka</option>
                {/* Add more states as needed */}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="pincode" className="form-label">Pincode *</label>
              <input
                type="text"
                className="form-control"
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="mobileNo" className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                id="mobileNo"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleChange}
                maxLength={10}
                pattern="[0-9]{10}"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="phone" className="form-label">Residence Phone</label>
              <input
                type="tel"
                className="form-control"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={15}
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="ckycNumber" className="form-label">CKYC Number</label>
              <input
                type="text"
                className="form-control"
                id="ckycNumber"
                name="ckycNumber"
                value={formData.ckycNumber}
                onChange={handleChange}
                maxLength={14}
              />
            </div>
          </div>

          <div className="d-grid gap-2">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : 'Register UCC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UCCRegistrationForm; 