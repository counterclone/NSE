/**
 * NSE Invest API - UCC Registration Script
 * ---------------------------------------
 * This script handles UCC (Unified Client Code) registration with the NSE Invest API
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

// Sample UCC registration payload generator
const generateUccPayload = (clientDetails) => {
  return {
    reg_details: [{
      client_code: clientDetails.clientCode,                    // Mandatory, 10 chars
      primary_holder_first_name: clientDetails.firstName,       // Mandatory, 70 chars
      primary_holder_middle_name: clientDetails.middleName,     // Mandatory
      primary_holder_last_name: clientDetails.lastName,         // Mandatory
      tax_status: clientDetails.taxStatus,                      // Mandatory, 2 chars
      gender: clientDetails.gender,                             // Conditional Mandatory for Individual
      primary_holder_dob_incorporation: clientDetails.dob,      // Mandatory, DD/MM/YYYY
      occupation_code: clientDetails.occupationCode,            // Mandatory, 2 chars
      holding_nature: clientDetails.holdingNature,              // Mandatory, 2 chars (SI/JO/AS)
      primary_holder_pan_exempt: "N",
      primary_holder_pan: "DUXPG1609H",
      client_type: "D",
      pms: "Y",
      default_dp: "CDSL",
      cdsl_dpid: "",
      cdslcltid: "",
      account_type_1: "SB",
      account_no_1: "1234567890123456",
      ifsc_code_1: "SBIN0000300",
      default_bank_flag_1: "Y",
      cheque_name: "John Doe",
      div_pay_mode: "03",
      communication_mode: "P",
      email: clientDetails.email,                               // Mandatory, 50 chars
      mobile_declaration_flag: "SE",
      email_declaration_flag: "SE",                             // Optional
      address_1: clientDetails.address1,                        // Conditional Mandatory
      city: clientDetails.city,                                 // Mandatory, 35 chars
      state: clientDetails.state.toUpperCase(),                 // Mandatory, 2 chars state code
      pincode: clientDetails.pincode,                          // Mandatory, 6 chars
      country: clientDetails.country,                          // Mandatory, 35 chars
      resi_phone: clientDetails.phone,                         // Optional, 15 chars
      indian_mobile_no: clientDetails.mobileNo,                // Conditional Mandatory for Indian
      paperless_flag: "Z",                                     // Mandatory (P=Paper/E=Paperless)
      nomination_opt: clientDetails.nominationOpt || "N",      // Optional Y/N
      primary_holder_kyc_type: "K",                           // Mandatory, 1 char
      primary_holder_ckyc_number: clientDetails.ckycNumber,   // Conditional Mandatory if KYC type C
      aadhaar_updated: "Y"                                   // Optional Y/N
    }]
  };
};

// Main function to test the UCC Registration API
const testUccRegistration = async () => {
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

    // Sample client details
    const sampleClient = {
      clientCode: "F12345",
      firstName: "Rahul",
      middleName: "kumar",
      lastName: "Sharma",
      taxStatus: "01",
      gender: "M",
      dob: "01/01/1990",
      occupationCode: "01",
      holdingNature: "SI",
      email: "rahul.sharma@example.com",
      address1: "123 Main Street",
      city: "Mumbai",
      state: "MA",
      pincode: "400001",
      country: "India",
      phone: "0221234567",
      mobileNo: "9876543210",
      ckycNumber: "12345678901234"
    };

    // Generate payload
    const uccPayload = generateUccPayload(sampleClient);

    console.log('Making UCC Registration API request...');
    console.log('URL:', `${config.url}/registration/CLIENTCOMMON`);

    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });

    // Make the UCC Registration API request
    const registrationResponse = await instance.post(
      `${config.url}/registration/CLIENTCOMMON`,
      uccPayload,
      { headers }
    );

    console.log('Registration API Response Status:', registrationResponse.status);
    console.log('Registration API Response Data:', JSON.stringify(registrationResponse.data, null, 2));

  } catch (error) {
    console.error('UCC Registration Failed!');
    console.error('=========================');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status Code:', error.response.status);
      console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Full Error Details:', error.response.data?.message || error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error('Request details:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up the request:', error.message);
    }
    console.error('=========================');
    throw new Error('UCC registration failed. Check console for details.');
  }
};

// Run the test
testUccRegistration().catch(console.error); 