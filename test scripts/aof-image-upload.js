/**
 * NSE AOF Image Upload API Implementation
 * --------------------------------------
 * This script demonstrates how to use the AOF Image Upload API
 * using modern JavaScript standards and practices.
 */

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

// Read and encode image file to base64
const getBase64Image = (filePath) => {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
};

// Sample payload for AOF Image Upload API
const getAofImagePayload = () => {
    return {
        "client_code": "H34567",
        "file_name": "aof_test.jpg",
        "document_type": "NRM",
        "file_data": getBase64Image('aof_test.jpg') // Ensure this file exists in your directory
    };
};

// Main function to test the AOF Image Upload API
const testAofImageUploadApi = async () => {
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
        const aofPayload = getAofImagePayload();
        console.log('Making AOF Image Upload API request...');
        console.log('URL:', `${config.url}/fileupload/AOFIMG`);
        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });
        const response = await instance.post(
            `${config.url}/fileupload/AOFIMG`,
            aofPayload,
            { headers }
        );
        console.log('AOF Image Upload API Response Status:', response.status);
        console.log('AOF Image Upload API Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
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
};

testAofImageUploadApi().catch(console.error); 