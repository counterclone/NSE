/**
 * NSE SIP Registration Service API Implementation
 * -------------------------------------------
 * This script demonstrates how to use the SIP Registration Service API
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

// Validation functions
const validations = {
    validateEmail: (email) => {
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Invalid email format');
        }
    },

    validateMobile: (mobile) => {
        if (mobile && !/^\d{10}$/.test(mobile)) {
            throw new Error('Mobile number must be exactly 10 digits');
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

        // Validate SIP allowed dates (typically between 1st to 28th of the month)
        if (day > 28) {
            throw new Error('SIP date must be between 1st and 28th of the month');
        }

        // Optional: Add minimum days ahead validation (e.g., must be at least 7 days in future)
        const minDaysAhead = 7;
        const minFutureDate = new Date();
        minFutureDate.setDate(minFutureDate.getDate() + minDaysAhead);
        minFutureDate.setHours(0, 0, 0, 0);

        if (inputDate < minFutureDate) {
            throw new Error(`Start date must be at least ${minDaysAhead} days in the future`);
        }
    },

    validateFrequencyType: (frequency) => {
        const validFrequencies = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI-ANNUALLY', 'ANNUALLY', 'DAILY'];
        if (!validFrequencies.includes(frequency)) {
            throw new Error(`Invalid frequency type. Must be one of: ${validFrequencies.join(', ')}`);
        }
    },

    validateDepositoryMode: (mode) => {
        if (!['C', 'N', 'P'].includes(mode)) {
            throw new Error('Invalid depository mode. Must be C (CDSL), N (NSDL), or P (Physical)');
        }
    },

    validateTransactionMode: (mode) => {
        if (!['D', 'P2'].includes(mode)) {
            throw new Error('Invalid transaction mode. Must be D or P2');
        }
    },

    validateEUIN: (euin, declaration) => {
        if (declaration === 'Y' && (!euin || !euin.startsWith('E'))) {
            throw new Error('EUIN must start with E when EUIN declaration is Y');
        }
    }
};

// Sample payload for SIP Registration Service API
const getSipRegistrationPayload = () => {
    const registrationData = {
        "amc_code": "AXISMUTUALFUND_MF",
        "sch_code": "AXIOGP-GR",
        "client_code": "H34567",
        "internal_ref_no": "67129721",
        "trans_mode": "D",
        "dp_txn_mode": "C",
        "start_date": "15/06/2025",
        "frequency_type": "MONTHLY",
        "frequency_allowed": "1",
        "installment_amount": "3000",
        "status": "1",
        "member_code": "1002516",
        "folio_no": "",
        "sip_remarks": "",
        "installment_no": "12",
        "sip_mandate_id": "12",
        "sub_broker_code": "",
        "euin_number": "E399871",
        "euin_declaration": "Y",
        "dpc_flag": "Y",
        "first_order_today": "N",
        "sub_broker_arn": "",
        "end_date": "",
        "primary_holder_mobile": "9574898779",
        "primary_holder_email": "user@gmail.com",
        "filler_1": "",
        "filler_2": "",
        "filler_3": "",
        "filler_4": "",
        "filler_5": ""
    };

    // Validate mandatory fields and business rules
    validations.validateEmail(registrationData.primary_holder_email);
    validations.validateMobile(registrationData.primary_holder_mobile);
    validations.validateDate(registrationData.start_date, 'start_date');
    validations.validateFrequencyType(registrationData.frequency_type);
    validations.validateDepositoryMode(registrationData.dp_txn_mode);
    validations.validateTransactionMode(registrationData.trans_mode);
    validations.validateEUIN(registrationData.euin_number, registrationData.euin_declaration);

    return {
        "reg_data": [registrationData]
    };
};

// Main function to test the SIP Registration Service API
const testSipRegistrationApi = async () => {
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

        const registrationPayload = getSipRegistrationPayload();
        console.log('Making SIP Registration Service API request...');
        console.log('URL:', `${config.url}/registration/product/SIP`);
        console.log('Payload:', JSON.stringify(registrationPayload, null, 2));

        const instance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        const response = await instance.post(
            `${config.url}/registration/product/SIP`,
            registrationPayload,
            { headers }
        );

        console.log('SIP Registration Service API Response Status:', response.status);
        console.log('SIP Registration Service API Response Data:', JSON.stringify(response.data, null, 2));

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

testSipRegistrationApi().catch(console.error); 