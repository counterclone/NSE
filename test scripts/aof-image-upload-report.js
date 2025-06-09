/**
 * NSE AOF Image Upload Report API Implementation
 * --------------------------------------------
 * This script demonstrates how to use the AOF Image Upload Report API
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
const validateDates = (fromDate, toDate, clientCode) => {
    // Parse dates
    const from = new Date(fromDate.split('-').reverse().join('-'));
    const to = new Date(toDate.split('-').reverse().join('-'));

    // Calculate difference in days
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If client code is not provided, dates are mandatory and must be within 31 days
    if (!clientCode && diffDays > 31) {
        throw new Error('Date range cannot exceed 31 days when client code is not provided');
    }

    if (from > to) {
        throw new Error('From date cannot be greater than to date');
    }
};

// Validate client codes
const validateClientCodes = (clientCode) => {
    if (clientCode) {
        const codes = clientCode.split(',');
        if (codes.length > 50) {
            throw new Error('Maximum 50 client codes are allowed');
        }
        // Additional validation can be added here if needed
    }
};

// Sample payload for AOF Image Upload Report API
const getAofReportPayload = () => {
    const fromDate = ""// "06-06-2025";
    const toDate = "" //"07-06-2025";
    const clientCode = "H34567"; // Optional, can handle up to 50 comma-separated codes

    // Validate inputs
    validateDates(fromDate, toDate, clientCode);
    validateClientCodes(clientCode);

    return {
        "client_code": clientCode,
        "from_date": fromDate,
        "to_date": toDate
    };
};

// Main function to test the AOF Image Upload Report API
const testAofReportApi = async () => {
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

        const reportPayload = getAofReportPayload();
        console.log('Making AOF Image Upload Report API request...');
        console.log('URL:', `${config.url}/reports/AOF_IMAGE_UPLODA_REPORT`);
        console.log('Payload:', JSON.stringify(reportPayload, null, 2));

        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        const response = await instance.post(
            `${config.url}/reports/AOF_IMAGE_UPLOAD_REPORT`,
            reportPayload,
            { headers }
        );

        console.log('AOF Report API Response Status:', response.status);
        console.log('AOF Report API Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.message.includes('Date') || error.message.includes('client')) {
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

testAofReportApi().catch(console.error); 