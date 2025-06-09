import React, { useState, useEffect } from 'react';

const FATCAUpload = ({ onSubmit, loading }) => {
    const defaultUboDetails = {
        ubo_name: '',
        ubo_pan: '',
        ubo_add1: '',
        ubo_add2: '',
        ubo_add3: '',
        ubo_city: '',
        ubo_pin: '',
        ubo_state: '',
        ubo_dob: '',
        ubo_mobile: '',
        // Default values from test script
        ubo_nation: 'IN',
        ubo_cntry: 'IN',
        ubo_add_ty: '2',
        ubo_ctr: 'IN',
        ubo_tin: '', // Will be set to UBO PAN
        ubo_id_ty: 'C',
        ubo_cob: 'IN',
        ubo_gender: 'M',
        ubo_fr_nam: '',
        ubo_occ: '01',
        ubo_occ_ty: 'B',
        ubo_tel: '',
        ubo_code: 'C01',
        ubo_hol_pc: '100',
        ubo_categ: 'UBO',
        ubo_pep_fl: 'N',
        ubo_email: '',
        ubo_smo_de: 'Director'
    };

    const [formData, setFormData] = useState({
        reg_details: [{
            // Required fields that need user input
            pan_rp: '',
            inv_name: '',
            dob: '',
            po_bir_inc: '',
            nature_bus: '',
            net_worth: '',
            nw_date: '',
            log_name: '',

            // Fields with default values
            pekrn: '',
            fr_name: '',
            sp_name: '',
            tax_status: '04',
            data_src: 'P',
            addr_type: '3',
            co_bir_inc: 'IN',
            tax_res1: 'IN',
            tpin1: '', // Will be auto-filled with PAN for Indian residents
            id1_type: 'C',
            tax_res2: '',
            tpin2: '',
            id2_type: '',
            tax_res3: '',
            tpin3: '',
            id3_type: '',
            tax_res4: '',
            tpin4: '',
            id4_type: '',
            srce_wealt: '02',
            corp_servs: '01',
            inc_slab: '32',
            pep_flag: 'N',
            occ_code: '01',
            occ_type: 'B',
            exemp_code: 'M',
            ffi_drnfe: 'FFI',
            giin_no: '12345',
            spr_entity: 'ABC',
            giin_na: 'NO',
            giin_exemc: '1',
            nffe_catg: 'A',
            act_nfe_sc: '07',
            rel_listed: '',
            exch_name: 'O',
            ubo_appl: 'Y',
            ubo_count: '1',
            sdf_flag: 'Y',
            ubo_df: 'Y',
            aadhaar_rp: '',
            new_change: '',
            ubo_exch: 'B',
            ubo_isin: '',
            ubo_rel_li: '',
            npo_form: 'N',
            npo_dcl: '',
            npo_rgno: '',
            ubo_details: [defaultUboDetails]
        }]
    });

    // Effect to ensure TPIN1 is always synced with PAN for Indian residents
    useEffect(() => {
        if (formData.reg_details[0].tax_res1 === 'IN') {
            setFormData(prev => ({
                reg_details: [{
                    ...prev.reg_details[0],
                    tpin1: prev.reg_details[0].pan_rp
                }]
            }));
        }
    }, [formData.reg_details[0].pan_rp, formData.reg_details[0].tax_res1]);

    // Effect to ensure UBO TIN is always synced with UBO PAN
    useEffect(() => {
        setFormData(prev => ({
            reg_details: [{
                ...prev.reg_details[0],
                ubo_details: prev.reg_details[0].ubo_details.map(ubo => ({
                    ...ubo,
                    ubo_tin: ubo.ubo_pan
                }))
            }]
        }));
    }, [formData.reg_details[0].ubo_details[0]?.ubo_pan]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            reg_details: [{
                ...prev.reg_details[0],
                [name]: value
            }]
        }));
    };

    const handleUboChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            reg_details: [{
                ...prev.reg_details[0],
                ubo_details: [
                    {
                        ...prev.reg_details[0].ubo_details[0],
                        [name]: value
                    }
                ]
            }]
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

        if (formData.reg_details[0].tax_res1 === 'IN' && !formData.reg_details[0].tpin1) {
            alert('Tax Payer Identification Number (TPIN) is required for Indian residents');
            return;
        }

        const formattedData = {
            reg_details: [{
                ...formData.reg_details[0],
                dob: formatDate(formData.reg_details[0].dob),
                nw_date: formatDate(formData.reg_details[0].nw_date),
                ubo_details: formData.reg_details[0].ubo_details.map(ubo => ({
                    ...ubo,
                    ubo_dob: formatDate(ubo.ubo_dob)
                }))
            }]
        };

        onSubmit(formattedData);
    };

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">FATCA Registration</h5>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="pan_rp" className="form-label">PAN Number *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="pan_rp"
                                name="pan_rp"
                                value={formData.reg_details[0].pan_rp}
                                onChange={handleChange}
                                required
                                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                title="Please enter a valid PAN number (e.g., ABCDE1234F)"
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label htmlFor="inv_name" className="form-label">Investor Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="inv_name"
                                name="inv_name"
                                value={formData.reg_details[0].inv_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="dob" className="form-label">Date of Birth/Incorporation *</label>
                            <input
                                type="date"
                                className="form-control"
                                id="dob"
                                name="dob"
                                value={formData.reg_details[0].dob}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label htmlFor="po_bir_inc" className="form-label">Place of Birth/Incorporation *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="po_bir_inc"
                                name="po_bir_inc"
                                value={formData.reg_details[0].po_bir_inc}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="nature_bus" className="form-label">Nature of Business *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="nature_bus"
                                name="nature_bus"
                                value={formData.reg_details[0].nature_bus}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label htmlFor="net_worth" className="form-label">Net Worth *</label>
                            <input
                                type="number"
                                className="form-control"
                                id="net_worth"
                                name="net_worth"
                                value={formData.reg_details[0].net_worth}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="nw_date" className="form-label">Net Worth Date *</label>
                            <input
                                type="date"
                                className="form-control"
                                id="nw_date"
                                name="nw_date"
                                value={formData.reg_details[0].nw_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label htmlFor="log_name" className="form-label">Logger Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="log_name"
                                name="log_name"
                                value={formData.reg_details[0].log_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* UBO Details Section */}
                    <h6 className="mt-4 mb-3">Ultimate Beneficial Owner (UBO) Details</h6>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="ubo_name" className="form-label">UBO Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_name"
                                name="ubo_name"
                                value={formData.reg_details[0].ubo_details[0].ubo_name}
                                onChange={handleUboChange}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <label htmlFor="ubo_pan" className="form-label">UBO PAN *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_pan"
                                name="ubo_pan"
                                value={formData.reg_details[0].ubo_details[0].ubo_pan}
                                onChange={handleUboChange}
                                required
                                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                title="Please enter a valid PAN number (e.g., ABCDE1234F)"
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <label htmlFor="ubo_add1" className="form-label">Address Line 1 *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_add1"
                                name="ubo_add1"
                                value={formData.reg_details[0].ubo_details[0].ubo_add1}
                                onChange={handleUboChange}
                                required
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="ubo_add2" className="form-label">Address Line 2</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_add2"
                                name="ubo_add2"
                                value={formData.reg_details[0].ubo_details[0].ubo_add2}
                                onChange={handleUboChange}
                            />
                        </div>

                        <div className="col-md-4 mb-3">
                            <label htmlFor="ubo_add3" className="form-label">Address Line 3</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_add3"
                                name="ubo_add3"
                                value={formData.reg_details[0].ubo_details[0].ubo_add3}
                                onChange={handleUboChange}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-3 mb-3">
                            <label htmlFor="ubo_city" className="form-label">City *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_city"
                                name="ubo_city"
                                value={formData.reg_details[0].ubo_details[0].ubo_city}
                                onChange={handleUboChange}
                                required
                            />
                        </div>

                        <div className="col-md-3 mb-3">
                            <label htmlFor="ubo_pin" className="form-label">PIN Code *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_pin"
                                name="ubo_pin"
                                value={formData.reg_details[0].ubo_details[0].ubo_pin}
                                onChange={handleUboChange}
                                required
                                pattern="[0-9]{6}"
                                title="Please enter a valid 6-digit PIN code"
                            />
                        </div>

                        <div className="col-md-3 mb-3">
                            <label htmlFor="ubo_state" className="form-label">State *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_state"
                                name="ubo_state"
                                value={formData.reg_details[0].ubo_details[0].ubo_state}
                                onChange={handleUboChange}
                                required
                            />
                        </div>

                        <div className="col-md-3 mb-3">
                            <label htmlFor="ubo_mobile" className="form-label">Mobile *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="ubo_mobile"
                                name="ubo_mobile"
                                value={formData.reg_details[0].ubo_details[0].ubo_mobile}
                                onChange={handleUboChange}
                                required
                                pattern="[0-9]{10}"
                                title="Please enter a valid 10-digit mobile number"
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="ubo_dob" className="form-label">Date of Birth *</label>
                            <input
                                type="date"
                                className="form-control"
                                id="ubo_dob"
                                name="ubo_dob"
                                value={formData.reg_details[0].ubo_details[0].ubo_dob}
                                onChange={handleUboChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit FATCA Registration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FATCAUpload; 