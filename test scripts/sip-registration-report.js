/**
 * NSE SIP Registration Report API Implementation
 * ------------------------------------------
 * This script demonstrates how to use the SIP Registration Report API
 * using modern JavaScript standards and practices.
 */

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
    const salt = crypto.randomBytes(16).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');
    const separator = '|';
    const randomNumber = Math.floor((Math.random() * 10000000000) + 1);
    const plainText = config.apiSecretUser + separator + randomNumber;
    const key = crypto.pbkdf2Sync(config.apiKeyMember, Buffer.from(salt, 'hex'), 1000, 16, 'sha1');
    const cipher = crypto.createCipheriv('aes-128-cbc', key, Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const encryptedPassword = Buffer.from(`${iv}::${salt}::${encrypted}`).toString('base64');
    return encryptedPassword;
};

// Validate SIP Registration IDs (can be multiple, comma-separated)
const validateSipRegIds = (sipRegIdString) => {
    if (!sipRegIdString) return;
    const sipRegIds = sipRegIdString.split(',');
    if (sipRegIds.length > 50) {
        throw new Error('Maximum 50 SIP Registration IDs allowed');
    }
    // Additional validation can be added here if needed
};

// Validate client codes (can be multiple, comma-separated)
const validateClientCodes = (codeString) => {
    if (!codeString) return;
    const codes = codeString.split(',');
    if (codes.length > 50) {
        throw new Error('Maximum 50 client codes allowed');
    }
    // Additional validation can be added here if needed
};

// Validate dates and their range
const validateDates = (fromDate, toDate) => {
    if (!fromDate || !toDate) return;

    // Parse dates
    const from = new Date(fromDate.split('-').reverse().join('-'));
    const to = new Date(toDate.split('-').reverse().join('-'));

    // Calculate difference in days
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 31) {
        throw new Error('Date range cannot exceed 31 days');
    }

    if (from > to) {
        throw new Error('From date cannot be greater than to date');
    }
};

// Sample payload for SIP Registration Report API
const getSipReportPayload = () => {
    const payload = {
        "sip_reg_id": "202506071000007",
        "client_code": "H34567",
        "from_date": "06-06-2025",
        "to_date": "07-06-2025"
    };

    // Validate inputs
    validateSipRegIds(payload.sip_reg_id);
    validateClientCodes(payload.client_code);

    // Only validate dates if both sip_reg_id and client_code are not provided
    if (!payload.sip_reg_id && !payload.client_code) {
        if (!payload.from_date || !payload.to_date) {
            throw new Error('From date and to date are mandatory when neither SIP Registration ID nor Client Code is provided');
        }
        validateDates(payload.from_date, payload.to_date);
    }

    return payload;
};

// Main function to test the SIP Registration Report API
const testSipReportApi = async () => {
    try {
        const encryptedPassword = generateEncryptedPassword();
        const basicAuth = Buffer.from(`${config.loginUserId}:${encryptedPassword}`).toString('base64');
        const headers = {
            'Content-Type': 'application/json',
            'memberId': config.memberCode,
            'Authorization': `BASIC ${basicAuth}`,
            'Accept-Language': 'en-US',
            'Referer': 'www.google.com',
            'Connection': 'keep-alive',
            'User-Agent': 'NSE-API-Client/1.0'
        };

        const reportPayload = getSipReportPayload();
        console.log('Making SIP Registration Report API request...');
        console.log('URL:', `${config.url}/reports/SIP_REG_REPORT`);
        console.log('Payload:', JSON.stringify(reportPayload, null, 2));

        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        const response = await instance.post(
            `${config.url}/reports/SIP_REG_REPORT`,
            reportPayload,
            { headers }
        );

        console.log('SIP Registration Report API Response Status:', response.status);
        console.log('SIP Registration Report API Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.message.includes('Maximum') || error.message.includes('Date') || error.message.includes('mandatory')) {
            console.error('Validation Error:', error.message);
        } else {
            console.error('API Error:');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Headers:', error.response.headers);
                console.error('Data:', error.response.data);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error:', error.message);
            }
        }
    }
};

testSipReportApi().catch(console.error); 