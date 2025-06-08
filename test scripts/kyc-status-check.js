/**
 * NSE KYC Status Check API Implementation
 * -------------------------------------
 * This script demonstrates how to use the KYC Status Check API
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

// Validate PAN
const validatePAN = (pan) => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        throw new Error('Invalid PAN format. Must be 5 letters + 4 numbers + 1 letter');
    }
};

// Sample payload for KYC Status Check API
const getKycStatusCheckPayload = () => {
    const payload = {
        "pan_no": "AAACX1234A"
    };

    // Validate payload
    validatePAN(payload.pan_no);

    return payload;
};

// Main function to test the KYC Status Check API
const testKycStatusCheckApi = async () => {
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

        const kycPayload = getKycStatusCheckPayload();
        console.log('Making KYC Status Check API request...');
        console.log('URL:', `${config.url}/utility/KYC_CHECK`);
        console.log('Payload:', JSON.stringify(kycPayload, null, 2));

        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        const response = await instance.post(
            `${config.url}/utility/KYC_CHECK`,
            kycPayload,
            { headers }
        );

        console.log('KYC Status Check API Response Status:', response.status);
        console.log('KYC Status Check API Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.message.includes('Invalid')) {
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

testKycStatusCheckApi().catch(console.error); 