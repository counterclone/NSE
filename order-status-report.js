/**
 * NSE Invest API - Order Status Reports Script
 * ------------------------------------------
 * This script handles fetching order status reports from the NSE Invest API
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

// Generate order status report payload
const generateOrderStatusPayload = (params) => {
  return {
    "from_date": params.fromDate,           // Mandatory, Format YYYY-MM-DD
    "to_date": params.toDate,               // Mandatory, Format YYYY-MM-DD
    "trans_type": params.transType || "ALL", // Mandatory, P(Purchase)/R(Redemption)/ALL
    "order_type": params.orderType || "ALL", // Mandatory, ALL/NRM/SIP/XSTP/STP
    "sub_order_type": params.subOrderType || "ALL" // Mandatory, ALL/NRM/SPOR/SWH/STP
  };
};

// Function to validate date range (maximum 7 days)
const validateDateRange = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 7) {
    throw new Error('Date range cannot exceed 7 days');
  }
  return true;
};

// Main function to fetch order status report
const fetchOrderStatusReport = async (reportParams) => {
  try {
    // Validate date range
    validateDateRange(reportParams.fromDate, reportParams.toDate);

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
    const payload = generateOrderStatusPayload(reportParams);
    console.log('\nRequest Payload:');
    console.log('---------------');
    console.log(JSON.stringify(payload, null, 2));
    
    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });
    
    // Make the Order Status Report API request
    console.log('\nMaking Order Status Report API request...');
    console.log('URL:', `${config.url}/reports/ORDER_STATUS`);
    
    const response = await instance.post(
      `${config.url}/reports/ORDER_STATUS`,
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

    // Create a file with the response data
    
    
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

// Export the fetchOrderStatusReport function
module.exports = {
  fetchOrderStatusReport
};

// Example usage with different date ranges and types
const testOrderStatusReport = async () => {
  // Test case 1: All orders
  const reportParams1 = {
    fromDate: "2023-11-10",
    toDate: "2023-11-16",
    transType: "ALL",
    orderType: "ALL",
    subOrderType: "ALL"
  };

  // Test case 2: Only Purchase orders
  const reportParams2 = {
    fromDate: "2023-11-10",
    toDate: "2023-11-16",
    transType: "P",
    orderType: "NRM",
    subOrderType: "NRM"
  };

  // Test case 3: Only Redemption orders
  const reportParams3 = {
    fromDate: "2023-11-10",
    toDate: "2023-11-16",
    transType: "R",
    orderType: "SIP",
    subOrderType: "SPOR"
  };

  try {
    console.log('\nTesting All Orders...');
    await fetchOrderStatusReport(reportParams1);

    console.log('\nTesting Purchase Orders...');
    await fetchOrderStatusReport(reportParams2);

    console.log('\nTesting Redemption Orders...');
    await fetchOrderStatusReport(reportParams3);

    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
};

// Run the test
testOrderStatusReport().catch(console.error); 