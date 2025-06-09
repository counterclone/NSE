/**
 * NSE FATCA Upload API Implementation
 * ---------------------------------
 * This script demonstrates how to use the FATCA Upload API for non-individual entities
 * using modern JavaScript standards and practices.
 */

// Use modern require statements for dependencies
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration (using environment variables)
const config = {
    url: 'https://nseinvestuat.nseindia.com/nsemfdesk/api/v2',
    loginUserId: process.env.LOGIN_USER_ID,
    apiKeyMember: process.env.API_KEY_MEMBER,
    apiSecretUser: process.env.API_SECRET_USER,
    memberCode: process.env.MEMBER_CODE
};

// Validate required environment variables
if (!config.loginUserId || !config.apiKeyMember || !config.apiSecretUser || !config.memberCode) {
    throw new Error('Missing required environment variables. Please check your .env.local file.');
}

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

// Sample FATCA payload for non-individual entity
const getFatcaPayload = () => {
    return {
        "reg_details": [
            {
                "pan_rp": "AAHCR1690M",
                "pekrn": "",
                "inv_name": "Devansh Technologies Pvt Ltd",
                "dob": "19/02/2019",
                "fr_name": "",
                "sp_name": "",
                "tax_status": "04", //check nse team
                "data_src": "P", //include both in form (form element) (have default value)
                "addr_type": "3", //all types in form (form element)
                "po_bir_inc": "Mumbai",
                "co_bir_inc": "IN",
                "tax_res1": "IN",
                "tpin1": "AAHCR1690M", //
                "id1_type": "C",
                "tax_res2": "",
                "tpin2": "",
                "id2_type": "",
                "tax_res3": "",
                "tpin3": "",
                "id3_type": "",
                "tax_res4": "",
                "tpin4": "",
                "id4_type": "",
                "srce_wealt": "02",
                "corp_servs": "01",
                "inc_slab": "32",
                "net_worth": "12345678",
                "nw_date": "01/01/2019",
                "pep_flag": "N",
                "occ_code": "01",
                "occ_type": "B",
                "exemp_code": "M",
                "ffi_drnfe": "FFI",
                "giin_no": "12345",
                "spr_entity": "ABC",
                "giin_na": "NO",
                "giin_exemc": "1",
                "nffe_catg": "A",
                "act_nfe_sc": "07",
                "nature_bus": "Technology Services",
                "rel_listed": "TATA",
                "exch_name": "O",
                "ubo_appl": "Y",
                "ubo_count": "1",
                "sdf_flag": "Y",
                "ubo_df": "Y",
                "aadhaar_rp": "",
                "new_change": "",
                "log_name": "Devansh Admin",
                "ubo_exch": "B",
                "ubo_isin": "INE123456789",
                "ubo_rel_li": "",
                "npo_form": "N",
                "npo_dcl": "",
                "npo_rgno": "",
                "ubo_details": [
                    {
                        "ubo_name": "MAHESH KUMAR",
                        "ubo_pan": "UQOPA1188A",
                        "ubo_nation": "IN",
                        "ubo_add1": "123 Business District",
                        "ubo_add2": "Bandra Kurla Complex",
                        "ubo_add3": "Mumbai",
                        "ubo_city": "Mumbai",
                        "ubo_pin": "400051",
                        "ubo_state": "MH",
                        "ubo_cntry": "IN",
                        "ubo_add_ty": "2",
                        "ubo_ctr": "IN",
                        "ubo_tin": "UQOPA1188A",
                        "ubo_id_ty": "C",
                        "ubo_cob": "IN",
                        "ubo_dob": "15/06/1975",
                        "ubo_gender": "M",
                        "ubo_fr_nam": "RAJ KUMAR",
                        "ubo_occ": "01",
                        "ubo_occ_ty": "B",
                        "ubo_tel": "9925899707",
                        "ubo_mobile": "9033692510",
                        "ubo_code": "C01",
                        "ubo_hol_pc": "60",
                        "ubo_categ": "UBO",
                        "ubo_pep_fl": "N",
                        "ubo_email": "mahesh@example.com",
                        "ubo_smo_de": "Director"
                    },
                    {
                        "ubo_name": "SURESH PATEL",
                        "ubo_pan": "UROPA1188A",
                        "ubo_nation": "IN",
                        "ubo_add1": "456 Corporate Park",
                        "ubo_add2": "Powai",
                        "ubo_add3": "Mumbai",
                        "ubo_city": "Mumbai",
                        "ubo_pin": "400076",
                        "ubo_state": "MH",
                        "ubo_cntry": "IN",
                        "ubo_add_ty": "2",
                        "ubo_ctr": "IN",
                        "ubo_tin": "UROPA1188A",
                        "ubo_id_ty": "C",
                        "ubo_cob": "IN",
                        "ubo_dob": "22-08-1978",
                        "ubo_gender": "M",
                        "ubo_fr_nam": "RAMESH PATEL",
                        "ubo_occ": "01",
                        "ubo_occ_ty": "B",
                        "ubo_tel": "9925899707",
                        "ubo_mobile": "9033692510",
                        "ubo_code": "C01",
                        "ubo_hol_pc": "40",
                        "ubo_categ": "UBO",
                        "ubo_pep_fl": "N",
                        "ubo_email": "suresh@example.com",
                        "ubo_smo_de": "Director"
                    }
                ]
            }
        ]
    };
};

// Main function to test the FATCA Upload API
const testFatcaApi = async () => {
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

        console.log('Headers:', JSON.stringify(headers, null, 2));

        // Get the FATCA payload
        const fatcaPayload = getFatcaPayload();

        console.log('Making FATCA Upload API request...');
        console.log('URL:', `${config.url}/registration/FATCA_COMMON`);

        // Create axios instance with TLS options
        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
            })
        });

        // Make the FATCA Upload API request
        const fatcaResponse = await instance.post(
            `${config.url}/registration/FATCA_COMMON`,
            fatcaPayload,
            { headers }
        );

        console.log('FATCA API Response Status:', fatcaResponse.status);
        console.log('FATCA API Response Data:', JSON.stringify(fatcaResponse.data, null, 2));

    } catch (error) {
        console.error('API Error:');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error:', error.message);
        }
    }
};

// Run the test
testFatcaApi().catch(console.error); 