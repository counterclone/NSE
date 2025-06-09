import React, { useState } from 'react';

const UCCRegistration183Form = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        // Required fields
        client_code: '',
        primary_holder_first_name: '',
        primary_holder_middle_name: '',
        primary_holder_last_name: '',
        tax_status: '01', // Default for Individual
        gender: 'M',
        primary_holder_dob_incorporation: '',
        occupation_code: '01', // Default for Business
        holding_nature: 'SI', // Default for Single
        primary_holder_pan: '',
        primary_holder_pan_exempt: 'N',
        client_type: 'D', // Default for Demat
        default_dp: 'CDSL',
        cdsl_dpid: '',
        cdslcltid: '',
        pms: 'N',

        // Bank Account Details
        account_type_1: 'SB', // Default for Savings
        account_no_1: '',
        micr_no_1: '',
        ifsc_code_1: '',
        default_bank_flag_1: 'Y',

        // Contact and Address Details
        cheque_name: '',
        div_pay_mode: '03',
        address_1: '',
        address_2: '',
        address_3: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        resi_phone: '',
        resi_fax: '',
        office_phone: '',
        office_fax: '',
        email: '',
        communication_mode: 'P', // Default for Physical

        // Additional Details
        indian_mobile_no: '',
        primary_holder_kyc_type: 'K',
        primary_holder_ckyc_number: '',
        aadhaar_updated: 'Y',
        mapin_id: '',
        paperless_flag: 'P',
        nomination_opt: 'N',
        nomination_authentication: 'O',
        mobile_declaration_flag: 'SE',
        email_declaration_flag: 'SE',

        // Minor/Guardian fields
        is_minor: false,
        guardian_first_name: '',
        guardian_middle_name: '',
        guardian_last_name: '',
        guardian_dob: '',
        guardian_pan: '',
        guardian_pan_exempt: 'N',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const updatedValue = name === 'primary_holder_pan' || name === 'guardian_pan'
            ? value.toUpperCase()
            : type === 'checkbox'
                ? checked
                : value;

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
            primary_holder_dob_incorporation: formatDate(formData.primary_holder_dob_incorporation),
            guardian_dob: formData.guardian_dob ? formatDate(formData.guardian_dob) : ''
        };

        // If not a minor, remove guardian details
        if (!formData.is_minor) {
            formattedData.guardian_first_name = '';
            formattedData.guardian_middle_name = '';
            formattedData.guardian_last_name = '';
            formattedData.guardian_dob = '';
            formattedData.guardian_pan = '';
            formattedData.guardian_pan_exempt = 'N';
        }

        onSubmit(formattedData);
    };

    // Calculate if date is less than 18 years ago
    const isMinorDate = (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        const birthDate = new Date(dateString);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age <= 18;
        }
        return age < 18;
    };

    // Update minor status when DOB changes
    const handleDOBChange = (e) => {
        const isMinor = isMinorDate(e.target.value);
        setFormData(prev => ({
            ...prev,
            primary_holder_dob_incorporation: e.target.value,
            is_minor: isMinor
        }));
    };

    return (
        <div className="card mb-4">
            <div className="card-header bg-info text-white">
                <h4 className="mb-0">UCC Registration (183 Format)</h4>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Personal Information */}
                        <h5 className="mb-3">Personal Information</h5>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="client_code" className="form-label">Client Code *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="client_code"
                                name="client_code"
                                value={formData.client_code}
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
                                style={{ textTransform: 'uppercase' }}
                            />
                            <small className="form-text text-muted">10 character PAN number</small>
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="primary_holder_first_name" className="form-label">First Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="primary_holder_first_name"
                                name="primary_holder_first_name"
                                value={formData.primary_holder_first_name}
                                onChange={handleChange}
                                maxLength={70}
                                required
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="primary_holder_middle_name" className="form-label">Middle Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="primary_holder_middle_name"
                                name="primary_holder_middle_name"
                                value={formData.primary_holder_middle_name}
                                onChange={handleChange}
                                maxLength={70}
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="primary_holder_last_name" className="form-label">Last Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="primary_holder_last_name"
                                name="primary_holder_last_name"
                                value={formData.primary_holder_last_name}
                                onChange={handleChange}
                                maxLength={70}
                                required
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="tax_status" className="form-label">Tax Status *</label>
                            <select
                                className="form-select"
                                id="tax_status"
                                name="tax_status"
                                value={formData.tax_status}
                                onChange={handleChange}
                                required
                            >
                                <option value="01">Individual</option>
                                <option value="02">HUF</option>
                                <option value="03">Company</option>
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
                            <label htmlFor="primary_holder_dob_incorporation" className="form-label">Date of Birth *</label>
                            <input
                                type="date"
                                className="form-control"
                                id="primary_holder_dob_incorporation"
                                name="primary_holder_dob_incorporation"
                                value={formData.primary_holder_dob_incorporation}
                                onChange={handleDOBChange}
                                required
                            />
                            {formData.is_minor && (
                                <small className="form-text text-warning">
                                    Minor detected - Guardian details required
                                </small>
                            )}
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="occupation_code" className="form-label">Occupation *</label>
                            <select
                                className="form-select"
                                id="occupation_code"
                                name="occupation_code"
                                value={formData.occupation_code}
                                onChange={handleChange}
                                required
                            >
                                <option value="01">Business</option>
                                <option value="02">Professional</option>
                                <option value="03">Service</option>
                            </select>
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="holding_nature" className="form-label">Holding Nature *</label>
                            <select
                                className="form-select"
                                id="holding_nature"
                                name="holding_nature"
                                value={formData.holding_nature}
                                onChange={handleChange}
                                required
                            >
                                <option value="SI">Single</option>
                                <option value="JO">Joint</option>
                                <option value="AS">Anyone or Survivor</option>
                            </select>
                        </div>

                        {/* Guardian Details Section - Only shown if minor */}
                        {formData.is_minor && (
                            <>
                                <h5 className="mb-3 mt-3">Guardian Details</h5>

                                <div className="col-md-4 mb-3">
                                    <label htmlFor="guardian_first_name" className="form-label">Guardian First Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="guardian_first_name"
                                        name="guardian_first_name"
                                        value={formData.guardian_first_name}
                                        onChange={handleChange}
                                        required={formData.is_minor}
                                        maxLength={70}
                                    />
                                </div>

                                <div className="col-md-4 mb-3">
                                    <label htmlFor="guardian_middle_name" className="form-label">Guardian Middle Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="guardian_middle_name"
                                        name="guardian_middle_name"
                                        value={formData.guardian_middle_name}
                                        onChange={handleChange}
                                        maxLength={70}
                                    />
                                </div>

                                <div className="col-md-4 mb-3">
                                    <label htmlFor="guardian_last_name" className="form-label">Guardian Last Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="guardian_last_name"
                                        name="guardian_last_name"
                                        value={formData.guardian_last_name}
                                        onChange={handleChange}
                                        required={formData.is_minor}
                                        maxLength={70}
                                    />
                                </div>

                                <div className="col-md-4 mb-3">
                                    <label htmlFor="guardian_dob" className="form-label">Guardian Date of Birth *</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="guardian_dob"
                                        name="guardian_dob"
                                        value={formData.guardian_dob}
                                        onChange={handleChange}
                                        required={formData.is_minor}
                                    />
                                </div>

                                <div className="col-md-4 mb-3">
                                    <label htmlFor="guardian_pan" className="form-label">Guardian PAN *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="guardian_pan"
                                        name="guardian_pan"
                                        value={formData.guardian_pan}
                                        onChange={handleChange}
                                        maxLength={10}
                                        pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                        placeholder="AAAAA1234A"
                                        required={formData.is_minor}
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                    <small className="form-text text-muted">10 character PAN number</small>
                                </div>
                            </>
                        )}

                        {/* Demat Account Details */}
                        <h5 className="mb-3 mt-3">Demat Account Details</h5>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="client_type" className="form-label">Client Type *</label>
                            <select
                                className="form-select"
                                id="client_type"
                                name="client_type"
                                value={formData.client_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="D">Demat</option>
                                <option value="P">Physical</option>
                            </select>
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="default_dp" className="form-label">Default DP *</label>
                            <select
                                className="form-select"
                                id="default_dp"
                                name="default_dp"
                                value={formData.default_dp}
                                onChange={handleChange}
                                required
                            >
                                <option value="CDSL">CDSL</option>
                                <option value="NSDL">NSDL</option>
                            </select>
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="cdsl_dpid" className="form-label">CDSL DP ID</label>
                            <input
                                type="text"
                                className="form-control"
                                id="cdsl_dpid"
                                name="cdsl_dpid"
                                value={formData.cdsl_dpid}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="cdslcltid" className="form-label">CDSL Client ID</label>
                            <input
                                type="text"
                                className="form-control"
                                id="cdslcltid"
                                name="cdslcltid"
                                value={formData.cdslcltid}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Bank Account Details */}
                        <h5 className="mb-3 mt-3">Bank Account Details</h5>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="account_type_1" className="form-label">Account Type *</label>
                            <select
                                className="form-select"
                                id="account_type_1"
                                name="account_type_1"
                                value={formData.account_type_1}
                                onChange={handleChange}
                                required
                            >
                                <option value="SB">Savings</option>
                                <option value="CA">Current</option>
                                <option value="NR">NRE</option>
                                <option value="NO">NRO</option>
                            </select>
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="account_no_1" className="form-label">Account Number *</label>
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
                                required
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="micr_no_1" className="form-label">MICR Number</label>
                            <input
                                type="text"
                                className="form-control"
                                id="micr_no_1"
                                name="micr_no_1"
                                value={formData.micr_no_1}
                                onChange={handleChange}
                            />
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
                            <label htmlFor="indian_mobile_no" className="form-label">Mobile Number *</label>
                            <input
                                type="tel"
                                className="form-control"
                                id="indian_mobile_no"
                                name="indian_mobile_no"
                                value={formData.indian_mobile_no}
                                onChange={handleChange}
                                pattern="[0-9]{10}"
                                required
                            />
                        </div>

                        <div className="col-md-12 mb-3">
                            <label htmlFor="address_1" className="form-label">Address Line 1 *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="address_1"
                                name="address_1"
                                value={formData.address_1}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-12 mb-3">
                            <label htmlFor="address_2" className="form-label">Address Line 2</label>
                            <input
                                type="text"
                                className="form-control"
                                id="address_2"
                                name="address_2"
                                value={formData.address_2}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-12 mb-3">
                            <label htmlFor="address_3" className="form-label">Address Line 3</label>
                            <input
                                type="text"
                                className="form-control"
                                id="address_3"
                                name="address_3"
                                value={formData.address_3}
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
                                required
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="state" className="form-label">State *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                            />
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
                                pattern="[0-9]{6}"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="col-12 mt-3">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Registration'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UCCRegistration183Form; 