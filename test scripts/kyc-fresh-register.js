/**
 * NSE KYC Fresh Register API Implementation
 * ---------------------------------------
 * This script demonstrates how to use the KYC Fresh Register API
 * using modern JavaScript standards and practices.
 */

const crypto = require('crypto');
const axios = require('axios');
const https = require('https');
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

// Validate mobile number
const validateMobile = (mobile) => {
    if (!/^\d{10}$/.test(mobile)) {
        throw new Error('Mobile number must be exactly 10 digits');
    }
};

// Validate email
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
};

// Validate PAN
const validatePAN = (pan) => {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        throw new Error('Invalid PAN format');
    }
};

// Sample payload for KYC Fresh Register API
const getKycRegisterPayload = () => {
    const payload = {
        "amc_code": "AXF",
        "pan_no": "AAACX1234A",
        "mobile": "9748975934",
        "email": "abc@gmail.com",
        "return_flag": "N",
        "client_callback_url": "Member's callback URL"  // Optional
    };

    // Validate payload
    validatePAN(payload.pan_no);
    validateMobile(payload.mobile);
    validateEmail(payload.email);

    return payload;
};

// Main function to test the KYC Fresh Register API
const testKycRegisterApi = async () => {
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

        const kycPayload = getKycRegisterPayload();
        console.log('Making KYC Fresh Register API request...');
        console.log('URL:', `${config.url}/registration/eKYC`);
        console.log('Payload:', JSON.stringify(kycPayload, null, 2));

        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        const response = await instance.post(
            `${config.url}/registration/eKYC`,
            kycPayload,
            { headers }
        );

        console.log('KYC Register API Response Status:', response.status);
        console.log('KYC Register API Response Data:', JSON.stringify(response.data, null, 2));

        // Handle return_flag response
        if (response.data && response.data.ErrorCode) {
            console.log('Error Code:', response.data.ErrorCode);
            console.log('Error Description:', response.data.ErrorDesc);
        }

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

testKycRegisterApi().catch(console.error); 