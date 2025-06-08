/**
 * NSE Client KYC Status Report API Implementation
 * --------------------------------------------
 * This script demonstrates how to use the Client KYC Status Report API
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

// Validate PAN numbers (can be multiple, comma-separated)
const validatePANs = (panString) => {
    if (!panString) return;
    const pans = panString.split(',');
    if (pans.length > 50) {
        throw new Error('Maximum 50 PAN numbers allowed');
    }
    pans.forEach(pan => {
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim())) {
            throw new Error(`Invalid PAN format: ${pan}. Must be 5 letters + 4 numbers + 1 letter`);
        }
    });
};

// Validate client codes (can be multiple, comma-separated)
const validateClientCodes = (codeString) => {
    if (!codeString) return;
    const codes = codeString.split(',');
    if (codes.length > 50) {
        throw new Error('Maximum 50 client codes allowed');
    }
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

    if (diffDays > 7) {
        throw new Error('Date range cannot exceed 7 days');
    }

    if (from > to) {
        throw new Error('From date cannot be greater than to date');
    }
};

// Sample payload for Client KYC Status Report API
const getClientKycReportPayload = () => {
    const payload = {
        "pan_no": "AAACX1234A",
        "client_code": "5100004",
        "from_date": "06/06/2025",
        "to_date": "07/06/2025"
    };

    // Validate inputs
    validatePANs(payload.pan_no);
    validateClientCodes(payload.client_code);

    // Only validate dates if both PAN and client_code are not provided
    if (!payload.pan_no && !payload.client_code) {
        validateDates(payload.from_date, payload.to_date);
    }

    return payload;
};

// Main function to test the Client KYC Status Report API
const testClientKycReportApi = async () => {
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

        const reportPayload = getClientKycReportPayload();
        console.log('Making Client KYC Status Report API request...');
        console.log('URL:', `${config.url}/reports/CLIENT_KYC_REPORT`);
        console.log('Payload:', JSON.stringify(reportPayload, null, 2));

        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        const response = await instance.post(
            `${config.url}/reports/CLIENT_KYC_REPORT`,
            reportPayload,
            { headers }
        );

        console.log('Client KYC Status Report API Response Status:', response.status);
        console.log('Client KYC Status Report API Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('Maximum') || error.message.includes('Date')) {
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

testClientKycReportApi().catch(console.error); 