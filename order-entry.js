/**
 * NSE Invest API Test Script
 * --------------------------
 * This script demonstrates how to properly authenticate with the NSE Invest API
 * using modern JavaScript standards and practices.
 */

// Use modern require statements for dependencies
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

// Main function to test the API
const testNseApi = async () => {
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
    
    // Sample payload for Order Entry (Purchase) Service API
    const orderPayload = {
      "transaction_details": [
        {
          "order_ref_number": "000001",              // Optional, unique reference number
          "scheme_code": "ZLIQ-GR",               // Mandatory, scheme code must exist in system
          "trxn_type": "P",                         // Mandatory, P = Purchase
          "buy_sell_type": "FRESH",                 // Mandatory, FRESH for new purchase
          "client_code": "H34567",                  // Mandatory, must be present in system
          "demat_physical": "C",                    // Mandatory, C = CDSL Demat
          "order_amount": "5000",                   // Conditional, mandatory for purchase
          "folio_no": "",                          // Conditional, required if PHYSICAL
          "remarks": "Test Purchase Order",         // Optional
          "kyc_flag": "Y",                         // Mandatory
          "sub_broker_code": "",                   // Optional
          "euin_number": "E123456",                // Conditional, required if euin_declaration is Y
          "euin_declaration": "Y",                 // Mandatory
          "min_redemption_flag": "N",              // Mandatory
          "dpc_flag": "Y",                         // Mandatory
          "all_units": "N",                        // Mandatory
          "redemption_units": "",                  // Conditional, blank for purchase
          "sub_broker_arn": "",                    // Optional
          "bank_ref_no": "REF123456",             // Optional
          "account_no": "",             // Conditional, required for redemption
          "mobile_no": "9876543210",              // Optional
          "email": "test@example.com",            // Optional
          "mandate_id": "",                       // Optional
          "filler1": "",                          // Optional
          "trxn_order_id": "",                    // Optional, should be blank
          "trxn_status": "",                      // Optional, should be blank
          "trxn_remark": ""                       // Optional, should be blank
        }
      ]
    };

    console.log('Making Order Entry API request...');
    console.log('URL:', `${config.url}/transaction/NORMAL`);
    
    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });
    
    // Make the Order Entry API request
    const orderResponse = await instance.post(
      `${config.url}/transaction/NORMAL`,
      orderPayload,
      { headers }
    );
    
    console.log('Order API Response Status:', orderResponse.status);
    console.log('Order API Response Data:', JSON.stringify(orderResponse.data, null, 2));
    
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
testNseApi().catch(console.error); 