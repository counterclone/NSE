/**
 * NSE FATCA Report API Implementation
 * ----------------------------------
 * This script demonstrates how to use the FATCA Report API
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

// Validate date format and range
const validateDates = (fromDate, toDate) => {
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

// Sample payload for FATCA Report API
const getFatcaReportPayload = () => {
    const fromDate = "06-06-2025";
    const toDate = "07-06-2025";

    // Validate dates before creating payload
    validateDates(fromDate, toDate);

    return {
        "pan_pkrn_no": "AAACX1234A", // Using the same PAN as in FATCA Image Upload
        "from_date": fromDate,
        "to_date": toDate
    };
};

// Main function to test the FATCA Report API
const testFatcaReportApi = async () => {
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

        const reportPayload = getFatcaReportPayload();
        console.log('Making FATCA Report API request...');
        console.log('URL:', `${config.url}/reports/FATCA_REPORT`);
        console.log('Payload:', JSON.stringify(reportPayload, null, 2));

        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        const response = await instance.post(
            `${config.url}/reports/FATCA_REPORT`,
            reportPayload,
            { headers }
        );

        console.log('FATCA Report API Response Status:', response.status);
        console.log('FATCA Report API Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.message.includes('Date')) {
            console.error('Date Validation Error:', error.message);
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

testFatcaReportApi().catch(console.error); 