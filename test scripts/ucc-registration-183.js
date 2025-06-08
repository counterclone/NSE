/**
 * NSE Invest API - UCC Registration Script (183 Column Format)
 * ---------------------------------------------------------
 * This script handles UCC (Unified Client Code) registration with the NSE Invest API
 * using the 183 column format specification.
 */

// Use modern require statements for dependencies
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');

// Configuration (use environment variables in production)
const config = {
    url: 'https://nseinvestuat.nseindia.com/nsemfdesk/api/v2',
    loginUserId: 'ADMIN',
    apiKeyMember: '32CDDA112E2C5E1EE06332C911AC32B6',
    apiSecretUser: '32CDDA112E2D5E1EE06332C911AC32B6',
    memberCode: '1002516'
};

// Generate encrypted password as per NSE documentation
const generateEncryptedPassword = () => {
    // Create random salt and IV (128 bits)
    const salt = crypto.randomBytes(16).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');

    // Create plaintext with separator and random number
    const separator = '|';
    const randomNumber = Math.floor((Math.random() * 10000000000) + 1);
    const plainText = config.apiSecretUser + separator + randomNumber;

    console.log('Plain text:', plainText);
    console.log('Salt:', salt);
    console.log('IV:', iv);

    // Encrypt using AES-128-CBC
    const key = crypto.pbkdf2Sync(config.apiKeyMember, Buffer.from(salt, 'hex'), 1000, 16, 'sha1');
    const cipher = crypto.createCipheriv('aes-128-cbc', key, Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    console.log('Encrypted:', encrypted);

    // Format as per NSE documentation: base64(iv:salt:aes_encrypted_val)
    const encryptedPassword = Buffer.from(`${iv}::${salt}::${encrypted}`).toString('base64');

    return encryptedPassword;
};

// Constants for field validation
const TAX_STATUS = {
    INDIVIDUAL: '01',
    HUF: '02',
    COMPANY: '03',
    // Add other tax status codes as needed
};

const OCCUPATION_CODES = {
    BUSINESS: '01',
    PROFESSIONAL: '02',
    SERVICE: '03',
    // Add other occupation codes as needed
};

const HOLDING_NATURE = {
    SINGLE: 'SI',
    JOINT: 'JO',
    ANYONE_SURVIVOR: 'AS'
};

// Sample UCC registration payload generator with 183 column format
const generateUccPayload = (clientDetails) => {
    // Helper function to format date to DD/MM/YYYY
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr.trim() === '') return '';
        return dateStr; // Assuming input is already in correct format
    };

    return {
        reg_details: [{
            client_code: clientDetails.client_code?.trim() || '',
            primary_holder_first_name: clientDetails.primary_holder_first_name?.trim() || '',
            primary_holder_middle_name: clientDetails.primary_holder_middle_name?.trim() || '',
            primary_holder_last_name: clientDetails.primary_holder_last_name?.trim() || '',
            tax_status: TAX_STATUS[clientDetails.tax_status] || clientDetails.tax_status,
            gender: clientDetails.gender?.substring(0, 1) || '',
            primary_holder_dob_incorporation: formatDate(clientDetails.primary_holder_dob_incorporation),
            occupation_code: OCCUPATION_CODES[clientDetails.occupation_code] || clientDetails.occupation_code,
            holding_nature: HOLDING_NATURE[clientDetails.holding_nature] || clientDetails.holding_nature,

            // Second holder details
            second_holder_first_name: clientDetails.second_holder_first_name?.trim() || '',
            second_holder_middle_name: clientDetails.second_holder_middle_name?.trim() || '',
            second_holder_last_name: clientDetails.second_holder_last_name?.trim() || '',
            second_holder_dob: formatDate(clientDetails.second_holder_dob),

            // Third holder details
            third_holder_first_name: clientDetails.third_holder_first_name?.trim() || '',
            third_holder_middle_name: clientDetails.third_holder_middle_name?.trim() || '',
            third_holder_last_name: clientDetails.third_holder_last_name?.trim() || '',
            third_holder_dob: formatDate(clientDetails.third_holder_dob),

            // Guardian details
            guardian_first_name: clientDetails.guardian_first_name?.trim() || '',
            guardian_middle_name: clientDetails.guardian_middle_name?.trim() || '',
            guardian_last_name: clientDetails.guardian_last_name?.trim() || '',
            guardian_dob: formatDate(clientDetails.guardian_dob),

            // PAN and exemption details
            primary_holder_pan_exempt: clientDetails.primary_holder_pan_exempt === 'NO' ? 'N' : 'Y',
            second_holder_pan_exempt: clientDetails.second_holder_pan_exempt?.trim() || '',
            third_holder_pan_exempt: clientDetails.third_holder_pan_exempt?.trim() || '',
            guardian_pan_exempt: clientDetails.guardian_pan_exempt?.trim() || '',
            primary_holder_pan: clientDetails.primary_holder_pan?.trim() || '',
            second_holder_pan: clientDetails.second_holder_pan?.trim() || '',
            third_holder_pan: clientDetails.third_holder_pan?.trim() || '',
            guardian_pan: clientDetails.guardian_pan?.trim() || '',

            // Client and account details
            client_type: clientDetails.client_type === 'NON DEMAT' ? 'P' : 'D',
            pms: clientDetails.pms === 'NO' ? 'N' : 'Y',
            default_dp: clientDetails.default_dp,
            cdsl_dpid: clientDetails.cdsl_dpid?.trim() || '',
            cdslcltid: clientDetails.cdslcltid?.trim() || '',
            cmbp_id: clientDetails.cmbp_id?.trim() || '',
            nsdldpid: clientDetails.nsdldpid?.trim() || '',
            nsdlcltid: clientDetails.nsdlcltid?.trim() || '',

            // Bank account details (up to 5 accounts)
            account_type_1: clientDetails.account_type_1?.trim() || '',
            account_no_1: clientDetails.account_no_1?.trim() || '',
            micr_no_1: clientDetails.micr_no_1?.trim() || '',
            ifsc_code_1: clientDetails.ifsc_code_1?.trim() || '',
            default_bank_flag_1: clientDetails.default_bank_flag_1?.toUpperCase() === 'Y' ? 'Y' : 'N',

            account_type_2: clientDetails.account_type_2?.trim() || '',
            account_no_2: clientDetails.account_no_2?.trim() || '',
            micr_no_2: clientDetails.micr_no_2?.trim() || '',
            ifsc_code_2: clientDetails.ifsc_code_2?.trim() || '',
            default_bank_flag_2: clientDetails.default_bank_flag_2?.toUpperCase() === 'Y' ? 'Y' : 'N',

            // Add remaining bank accounts 3-5 similarly

            // Contact and address details
            cheque_name: clientDetails.cheque_name?.trim() || '',
            div_pay_mode: clientDetails.div_pay_mode?.trim() || '',
            address_1: clientDetails.address_1?.trim() || '',
            address_2: clientDetails.address_2?.trim() || '',
            address_3: clientDetails.address_3?.trim() || '',
            city: clientDetails.city?.trim() || '',
            state: clientDetails.state?.trim() || '',
            pincode: clientDetails.pincode?.trim() || '',
            country: clientDetails.country?.trim() || '',
            resi_phone: clientDetails.resi_phone?.trim() || '',
            resi_fax: clientDetails.resi_fax?.trim() || '',
            office_phone: clientDetails.office_phone?.trim() || '',
            office_fax: clientDetails.office_fax?.trim() || '',
            email: clientDetails.email?.trim() || '',
            communication_mode: clientDetails.communication_mode === 'ELECTRONIC' ? 'E' : 'P',

            // Foreign address details
            foreign_address_1: clientDetails.foreign_address_1?.trim() || '',
            foreign_address_2: clientDetails.foreign_address_2?.trim() || '',
            foreign_address_3: clientDetails.foreign_address_3?.trim() || '',
            foreign_address_city: clientDetails.foreign_address_city?.trim() || '',
            foreign_address_pincode: clientDetails.foreign_address_pincode?.trim() || '',
            foreign_address_state: clientDetails.foreign_address_state?.trim() || '',
            foreign_address_country: clientDetails.foreign_address_country?.trim() || '',

            // KYC details
            indian_mobile_no: clientDetails.indian_mobile_no?.trim() || '',
            primary_holder_kyc_type: clientDetails.primary_holder_kyc_type === 'CKYC COMPLIANT' ? 'C' : 'K',
            primary_holder_ckyc_number: clientDetails.primary_holder_ckyc_number?.trim() || '',

            // Additional details
            aadhaar_updated: clientDetails.aadhaar_updated === 'YES' ? 'Y' : 'N',
            mapin_id: clientDetails.mapin_id?.trim() || '',
            paperless_flag: clientDetails.paperless_flag === 'Paper' ? 'P' : 'E',

            // Nomination details
            nomination_opt: clientDetails.nomination_opt?.trim() || '',
            nomination_authentication: clientDetails.nomination_authentication === 'OTP' ? 'O' : 'W',

            // Nominee 1 details
            nominee_1_name: '',
            nominee_1_relationship: '',
            nominee_1_applicable: '',
            nominee_1_minor_flag: '',
            nominee_1_dob: '',
            nominee_1_guardian: '',
            nominee_1_guardian_pan: '',
            nominee_1_identity_type: '',
            nominee_1_identity_number: '',

            // Add remaining nominee details similarly for nominee 2 and 3

            // Declaration flags
            mobile_declaration_flag: clientDetails.mobile_declaration_flag === 'Self' ? 'SE' : '',
            email_declaration_flag: clientDetails.email_declaration_flag === 'Self' ? 'SE' : '',

            // Registration details
            reg_id: clientDetails.reg_id?.trim() || '',
            reg_status: clientDetails.reg_status?.trim() || '',
            reg_remark: clientDetails.reg_remark?.trim() || ''
        }]
    };
};

// Main function to test the UCC Registration API
const testUccRegistration = async () => {
    try {
        // Generate encrypted password
        const encryptedPassword = generateEncryptedPassword();
        console.log('Encrypted Password:', encryptedPassword);

        // Create basic auth string
        const basicAuth = Buffer.from(`${config.loginUserId}:${encryptedPassword}`).toString('base64');
        console.log('Basic Auth:', basicAuth);

        // Create headers for NSE API
        const headers = {
            'Content-Type': 'application/json',
            'memberId': config.memberCode,
            'Authorization': `BASIC ${basicAuth}`,
            'Accept-Language': 'en-US',
            'Referer': 'www.google.com',
            'Connection': 'keep-alive',
            'User-Agent': 'NSE-API-Client/1.0'
        };

        // Sample client details (using the 183 column format)
        const sampleClient = {
            client_code: "H3034",
            primary_holder_first_name: "PRIYANKA",
            primary_holder_middle_name: "R",
            primary_holder_last_name: "TOPIWALA",
            tax_status: "INDIVIDUAL",
            gender: "MALE",
            primary_holder_dob_incorporation: "04/11/1994",
            occupation_code: "BUSINESS",
            holding_nature: "SINGLE",
            primary_holder_pan: "AAAPL1234P",
            primary_holder_pan_exempt: "NO",
            client_type: "D",                // D for Demat
            default_dp: "CDSL",             // Setting CDSL as the depository
            cdsl_dpid: "12345600",          // Adding CDSL DP ID
            cdslcltid: "1234567890123456",  // Adding CDSL Client ID
            pms: "N",
            // Bank Account Details
            account_type_1: "SB",           // SB for Savings Bank
            account_no_1: "12345678901",    // Bank Account Number
            micr_no_1: "400002000",         // MICR Number
            ifsc_code_1: "SBIN0000001",     // IFSC Code
            default_bank_flag_1: "Y",       // Must be uppercase 'Y' for default bank account
            // Second bank account (if needed)
            account_type_2: "",             // Leave empty if not needed
            account_no_2: "",
            micr_no_2: "",
            ifsc_code_2: "",
            default_bank_flag_2: "N",       // Must be 'N' for non-default
            // Other required fields
            address_1: "123 Main Street",
            city: "MUMBAI",
            state: "MP",
            pincode: "400001",
            country: "INDIA",
            email: "priyanka.t@example.com",
            indian_mobile_no: "9876543210",
            communication_mode: "ELECTRONIC",
            paperless_flag: "Paper",
            cheque_name: "PRIYANKA R TOPIWALA",  // Name as per bank records
            div_pay_mode: "03"                   // 03 = ECS (Electronic Clearing Service)
        };

        // Generate payload
        const uccPayload = generateUccPayload(sampleClient);
        console.log('UCC Payload:', JSON.stringify(uccPayload, null, 2));

        // Create axios instance with TLS options
        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
            })
        });

        // Make the UCC Registration API request
        const registrationResponse = await instance.post(
            `${config.url}/registration/CLIENTCOMMON`,
            uccPayload,
            { headers }
        );

        console.log('Registration API Response Status:', registrationResponse.status);
        console.log('Registration API Response Data:', JSON.stringify(registrationResponse.data, null, 2));

    } catch (error) {
        console.error('UCC Registration Failed!');
        console.error('=========================');
        if (error.response) {
            console.error('Status Code:', error.response.status);
            console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Full Error Details:', error.response.data?.message || error.response.data);
        } else if (error.request) {
            console.error('No response received from server');
            console.error('Request details:', error.request);
        } else {
            console.error('Error setting up the request:', error.message);
        }
        console.error('=========================');
        throw new Error('UCC registration failed. Check console for details.');
    }
};

// Export functions for use in other modules
module.exports = {
    generateUccPayload,
    testUccRegistration
};

// Run the test if this file is run directly
if (require.main === module) {
    testUccRegistration().catch(console.error);
} 