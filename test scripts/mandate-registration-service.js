/**
 * NSE Mandate Registration API Implementation
 * -----------------------------------------
 * This script handles mandate registration with proper validations
 * and error handling for all required fields.
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

// Validation functions
const validations = {
    validateClientCode: (code) => {
        if (!code || code.length > 10) {
            throw new Error('Client code must be provided and not exceed 10 characters');
        }
    },

    validateAmount: (amount) => {
        if (amount) {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Amount must be a positive number');
            }
            // Check decimal places (15,2 format)
            const [whole, decimal] = amount.toString().split('.');
            if (whole.length > 13 || (decimal && decimal.length > 2)) {
                throw new Error('Amount must be in format (15,2) - maximum 13 digits before decimal and 2 after');
            }
        }
    },

    validateMandateType: (type) => {
        if (!['X', 'P', 'E'].includes(type)) {
            throw new Error('Mandate type must be X (Physical/Scan), P (Physical) or E (eNACH)');
        }
    },

    validateAccountNumber: (accNo) => {
        if (!accNo || accNo.length > 40) {
            throw new Error('Bank account number must be provided and not exceed 40 characters');
        }
    },

    validateAccountType: (type) => {
        if (!['SB', 'CB', 'NE', 'NO'].includes(type)) {
            throw new Error('Account type must be SB (Savings), CB (Current), NE (NRE) or NO (NRO)');
        }
    },

    validateIFSCCode: (code) => {
        if (!code || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) {
            throw new Error('Invalid IFSC code format. Must be 11 characters: 4 letters + 0 + 6 alphanumeric');
        }
    },

    validateMICR: (micr) => {
        if (micr && !/^\d{9}$/.test(micr)) {
            throw new Error('MICR code must be exactly 9 digits');
        }
    },

    validateDate: (date, fieldName) => {
        if (!date) return;

        // Check DD/MM/YYYY format
        const dateRegex = /^(0[1-9]|[12][0-9]|3[01])[/](0[1-9]|1[012])[/](20)\d\d$/;
        if (!dateRegex.test(date)) {
            throw new Error(`Invalid date format for ${fieldName}. Must be DD/MM/YYYY`);
        }

        // Parse the date parts
        const [day, month, year] = date.split('/').map(Number);

        // Create date object (month - 1 because JavaScript months are 0-based)
        const inputDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validate if it's a valid date (handles cases like 31/04/2025)
        if (inputDate.getDate() !== day || inputDate.getMonth() !== month - 1 || inputDate.getFullYear() !== year) {
            throw new Error(`Invalid date: ${date}. Please check the day for the given month.`);
        }

        // Check if date is in the past
        if (inputDate < today) {
            throw new Error('Past dates are not allowed');
        }

        // Optional: Add minimum days ahead validation
        const minDaysAhead = 7;
        const minFutureDate = new Date();
        minFutureDate.setDate(minFutureDate.getDate() + minDaysAhead);
        minFutureDate.setHours(0, 0, 0, 0);

        if (inputDate < minFutureDate) {
            throw new Error(`Start date must be at least ${minDaysAhead} days in the future`);
        }
    }
};

// Sample payload for Mandate Registration API
const getMandateRegistrationPayload = () => {
    const mandateData = {
        "client_code": "H34567",
        "amount": "100000",
        "mandate_type": "X",
        "account_no": "123456789",
        "ac_type": "SB",
        "ifsc_code": "SBIN0000018",
        "micr_code": "",
        "start_date": "15/06/2025",
        "end_date": "15/09/2025",
        "member_mandate_no": "112233"
    };

    // Validate all fields
    validations.validateClientCode(mandateData.client_code);
    validations.validateAmount(mandateData.amount);
    validations.validateMandateType(mandateData.mandate_type);
    validations.validateAccountNumber(mandateData.account_no);
    validations.validateAccountType(mandateData.ac_type);
    validations.validateIFSCCode(mandateData.ifsc_code);
    validations.validateMICR(mandateData.micr_code);
    validations.validateDate(mandateData.start_date, 'start_date');
    validations.validateDate(mandateData.end_date, 'end_date');

    return {
        "reg_data": [mandateData]
    };
};

// Main function to test the Mandate Registration API
const testMandateRegistrationApi = async () => {
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

        const registrationPayload = getMandateRegistrationPayload();
        console.log('Making Mandate Registration API request...');
        console.log('URL:', `${config.url}/registration/product/MANDATE`);
        console.log('Payload:', JSON.stringify(registrationPayload, null, 2));

        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        const response = await instance.post(
            `${config.url}/registration/product/MANDATE`,
            registrationPayload,
            { headers }
        );

        console.log('Mandate Registration API Response Status:', response.status);
        console.log('Mandate Registration API Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('must')) {
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

testMandateRegistrationApi().catch(console.error); 