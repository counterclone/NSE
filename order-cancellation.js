/**
 * NSE Invest API - Order Cancellation Script
 * -----------------------------------------
 * This script handles cancellation of orders (Normal/Switch) with the NSE Invest API
 * using modern JavaScript standards and practices.
 */

// Use modern require statements for dependencies
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

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

// Generate order cancellation payload
const generateOrderCancellationPayload = (cancellationDetails) => {
  // Validate number of orders (maximum 50 allowed)
  if (Array.isArray(cancellationDetails) && cancellationDetails.length > 50) {
    throw new Error('Maximum 50 orders allowed in a single cancellation request');
  }

  // Create the correct structure for the API
  return {
    can_data: Array.isArray(cancellationDetails)
      ? cancellationDetails
      : [cancellationDetails]
  };
};

// Main function for order cancellation
const cancelOrders = async (ordersToCancel) => {
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

    console.log('\nRequest Headers:');
    console.log('---------------');
    console.log(JSON.stringify(headers, null, 2));

    // Generate payload
    const payload = generateOrderCancellationPayload(ordersToCancel);
    console.log('\nRequest Payload:');
    console.log('---------------');
    console.log(JSON.stringify(payload, null, 2));

    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });

    // Make the Order Cancellation API request
    console.log('\nMaking Order Cancellation API request...');
    console.log('URL:', `${config.url}/cancellation/ORDER_CAN`);

    const response = await instance.post(
      `${config.url}/cancellation/ORDER_CAN`,
      payload,
      { headers }
    );

    // Log complete raw response
    console.log('\nComplete Raw Response:');
    console.log('--------------------');
    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('\nResponse Headers:');
    console.log(JSON.stringify(response.headers, null, 2));
    console.log('\nResponse Data:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;

  } catch (error) {
    console.error('\nAPI Error:');
    console.error('----------');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('\nResponse Headers:');
      console.error(JSON.stringify(error.response.headers, null, 2));
      console.error('\nResponse Data:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Request details:');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
    throw error;
  }
};

// Export the function
module.exports = {
  cancelOrders
};

// Example usage with test orders
const testOrderCancellation = async () => {
  // Test case 1: Single order cancellation
  const singleOrderCancel = {
    client_code: "TEST12345",     // Mandatory, 10 chars, must exist in system and be active
    order_no: "ORD12345678",      // Mandatory, 12 chars, order number to be cancelled
    remarks: "Cancel due to pricing error"  // Mandatory, 500 chars, cancellation remarks
  };

  // Test case 2: Multiple orders cancellation
  const multipleOrdersCancel = [
    {
      client_code: "TEST12345",
      order_no: "ORD12345678",
      remarks: "Cancel due to pricing error"
    },
    {
      client_code: "TEST12345",
      order_no: "ORD12345679",
      remarks: "Client requested cancellation"
    },
    {
      client_code: "TEST12346",
      order_no: "ORD12345680",
      remarks: "System error correction"
    }
  ];

  try {
    console.log('\nTesting Single Order Cancellation...');
    await cancelOrders(singleOrderCancel);

    console.log('\nTesting Multiple Orders Cancellation...');
    await cancelOrders(multipleOrdersCancel);

    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testOrderCancellation().catch(console.error);
} 