import React, { useState } from 'react';

const UCCRegistrationForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    // Required fields from backend
    clientCode: '',                  // Mandatory, 10 chars
    firstName: '',                   // Mandatory, 70 chars
    middleName: '',                  // Optional
    lastName: '',                    // Mandatory
    taxStatus: '01',                 // Mandatory, 2 chars - Default for Individual
    gender: 'M',                     // Conditional Mandatory for Individual
    dob: '',                         // Mandatory, DD/MM/YYYY
    occupationCode: '01',            // Mandatory, 2 chars - Default for Service
    holdingNature: 'SI',             // Mandatory, 2 chars - Default for Single
    email: '',                       // Mandatory, 50 chars
    address1: '',                    // Conditional Mandatory
    city: '',                        // Mandatory, 35 chars
    state: '',                       // Mandatory, 2 chars state code
    pincode: '',                     // Mandatory, 6 chars
    country: 'India',                // Mandatory, 35 chars - Default for India
    
    // Optional fields with defaults
    phone: '',                       // Optional, 15 chars
    mobileNo: '',                    // Conditional Mandatory for Indian
    communicationMode: 'P',          // Mandatory - Default P=Physical
    paperlessFlag: 'Z',              // Mandatory - Default Z
    nominationOpt: 'N',              // Optional - Default N
    ckycNumber: '',                  // Conditional Mandatory if KYC type C
    aadhaarUpdated: 'Y',             // Optional - Default Y
    clientType: 'P',                 // Mandatory - Default P (Physical)
    
    // Additional fields from the payload
    primary_holder_pan_exempt: "N",  // Default
    primary_holder_pan: "",          // Required for tax purposes
    default_dp: "CDSL",              // Default
    cdsl_dpid: "",                   // Optional
    cdslcltid: "",                   // Optional
    account_type_1: "SB",            // Default - Savings Bank
    account_no_1: "",                // Bank account number
    ifsc_code_1: "",                 // IFSC code
    default_bank_flag_1: "Y",        // Default
    cheque_name: "",                 // Name as on cheque
    div_pay_mode: "03",              // Default
    mobile_declaration_flag: "SE",   // Default
    email_declaration_flag: "SE"     // Default
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'primary_holder_pan' ? value.toUpperCase() : value;
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
    return `${day}/${month}/${year}`;
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
            {/* Personal Information - Required Fields */}
            <h5 className="mb-3">Personal Information</h5>
            
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
              <small className="form-text text-muted">Max 10 characters</small>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="primary_holder_pan" className="form-label">PAN Number *</label>
              <input
                type="text"
                className="form-control"
                id="primary_holder_pan"
                name="primary_holder_pan"
                value={formData.primary_holder_pan}
                onChange={handleChange}
                maxLength={10}
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                placeholder="AAAAA1234A"
                required
                style={{textTransform: 'uppercase'}}
              />
              <small className="form-text text-muted">10 character PAN number</small>
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
                <option value="04">HUF</option>
                <option value="05">Trust</option>
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

            {/* Contact Information */}
            <h5 className="mb-3 mt-3">Contact Information</h5>

            <div className="col-md-6 mb-3">
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

            <div className="col-md-6 mb-3">
              <label htmlFor="mobileNo" className="form-label">Mobile Number *</label>
              <input
                type="tel"
                className="form-control"
                id="mobileNo"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleChange}
                maxLength={10}
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div className="col-md-12 mb-3">
              <label htmlFor="address1" className="form-label">Address *</label>
              <input
                type="text"
                className="form-control"
                id="address1"
                name="address1"
                value={formData.address1}
                onChange={handleChange}
                required
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
                <option value="TN">Tamil Nadu</option>
                <option value="UP">Uttar Pradesh</option>
                <option value="GJ">Gujarat</option>
                <option value="WB">West Bengal</option>
                <option value="RJ">Rajasthan</option>
                <option value="MP">Madhya Pradesh</option>
                <option value="AP">Andhra Pradesh</option>
                <option value="TG">Telangana</option>
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

            {/* Bank Information */}
            <h5 className="mb-3 mt-3">Bank Information</h5>

            <div className="col-md-4 mb-3">
              <label htmlFor="account_no_1" className="form-label">Bank Account Number *</label>
              <input
                type="text"
                className="form-control"
                id="account_no_1"
                name="account_no_1"
                value={formData.account_no_1}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="ifsc_code_1" className="form-label">IFSC Code *</label>
              <input
                type="text"
                className="form-control"
                id="ifsc_code_1"
                name="ifsc_code_1"
                value={formData.ifsc_code_1}
                onChange={handleChange}
                pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="cheque_name" className="form-label">Name as on Cheque *</label>
              <input
                type="text"
                className="form-control"
                id="cheque_name"
                name="cheque_name"
                value={formData.cheque_name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Additional Information */}
            <h5 className="mb-3 mt-3">Additional Information</h5>

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

            <div className="col-md-4 mb-3">
              <label htmlFor="communicationMode" className="form-label">Communication Mode *</label>
              <select
                className="form-select"
                id="communicationMode"
                name="communicationMode"
                value={formData.communicationMode}
                onChange={handleChange}
                required
              >
                <option value="P">Physical</option>
                <option value="E">Email</option>
                <option value="M">Mobile</option>
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="paperlessFlag" className="form-label">Paperless Flag</label>
              <select
                className="form-select"
                id="paperlessFlag"
                name="paperlessFlag"
                value={formData.paperlessFlag}
                onChange={handleChange}
              >
                <option value="Z">Default</option>
                <option value="P">Paper</option>
                <option value="E">Paperless</option>
              </select>
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