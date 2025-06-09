const express = require('express');
const cors = require('cors');
const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Import MongoDB connection and models
const connectDB = require('./models/db');
const UccRegistration = require('./models/UccRegistration');
const OrderEntry = require('./models/OrderEntry');

// Import scheme master download functionality
const { downloadSchemeMaster, parseSchemeMasterFile } = require('./scheme-master-download');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS with specific options
app.use(cors({
  origin: 'http://localhost:3000', // Allow only the frontend application
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

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

// Helper function to make NSE API requests
const makeNSERequest = async (endpoint, payload) => {
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

  // Create axios instance with TLS options
  const instance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
    })
  });

  // Make the API request
  return await instance.post(
    `${config.url}${endpoint}`,
    payload,
    { headers }
  );
};

// Helper function to handle API errors
const handleAPIError = (error, res) => {
  console.error('API Error:');
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
    res.status(error.response.status).json({
      success: false,
      error: 'NSE API Error',
      data: error.response.data
    });
  } else {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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

// API endpoint to trigger download of latest scheme master
app.post('/api/download-scheme-master', async (req, res) => {
  try {
    console.log('Received request to download scheme master');
    const forceDownload = req.body.forceDownload === true;

    // Download the scheme master
    const result = await downloadSchemeMaster(forceDownload);

    res.json({
      success: true,
      message: forceDownload ? 'Scheme master downloaded successfully' : 'Scheme master processed successfully',
      fileName: result.fileName,
      filePath: result.filePath
    });
  } catch (error) {
    console.error('Error downloading scheme master:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download scheme master',
      details: error.message
    });
  }
});

// API endpoint to get scheme master data in JSON format
app.get('/api/scheme-master-json', async (req, res) => {
  try {
    // Get file path (either from latest file or use the one specified in query)
    let filePath;

    if (req.query.fileName) {
      filePath = path.join(__dirname, req.query.fileName);
    } else {
      // Find the latest scheme master file
      const files = fs.readdirSync(__dirname);
      const schemeFiles = files.filter(file => file.startsWith('NSE_NSEINVEST_ALL_') && file.endsWith('.txt'));

      if (schemeFiles.length === 0) {
        return res.status(404).json({ error: 'No scheme master files found' });
      }

      // Sort by date (newest first, based on filename)
      schemeFiles.sort().reverse();
      filePath = path.join(__dirname, schemeFiles[0]);
    }

    // Parse the limit parameter
    const limit = req.query.limit ? parseInt(req.query.limit) : 1000;

    // Parse the file
    const result = await parseSchemeMasterFile(filePath, { limit });

    res.json({
      success: true,
      fileName: path.basename(filePath),
      data: result.schemes,
      total: result.total,
      limited: result.limited,
      limit: result.limit
    });
  } catch (error) {
    console.error('Error parsing scheme master:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse scheme master',
      details: error.message
    });
  }
});

// API endpoint to get raw scheme master file
app.get('/api/scheme-master-raw', async (req, res) => {
  try {
    // Get file path (either from latest file or use the one specified in query)
    let filePath;

    if (req.query.fileName) {
      filePath = path.join(__dirname, req.query.fileName);
    } else {
      // Find the latest scheme master file
      const files = fs.readdirSync(__dirname);
      const schemeFiles = files.filter(file => file.startsWith('NSE_NSEINVEST_ALL_') && file.endsWith('.txt'));

      if (schemeFiles.length === 0) {
        return res.status(404).json({ error: 'No scheme master files found' });
      }

      // Sort by date (newest first, based on filename)
      schemeFiles.sort().reverse();
      filePath = path.join(__dirname, schemeFiles[0]);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Scheme master file not found' });
    }

    // Return the raw file
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error sending scheme master file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send scheme master file',
      details: error.message
    });
  }
});

// API endpoint to get list of available scheme master files
app.get('/api/scheme-master-files', (req, res) => {
  try {
    // Find all scheme master files
    const files = fs.readdirSync(__dirname);
    const schemeFiles = files
      .filter(file => file.startsWith('NSE_NSEINVEST_ALL_') && file.endsWith('.txt'))
      .map(file => ({
        fileName: file,
        filePath: path.join(__dirname, file),
        size: fs.statSync(path.join(__dirname, file)).size,
        created: fs.statSync(path.join(__dirname, file)).birthtime
      }))
      .sort((a, b) => b.created - a.created); // Sort by date (newest first)

    res.json({
      success: true,
      files: schemeFiles
    });
  } catch (error) {
    console.error('Error getting scheme master files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheme master files',
      details: error.message
    });
  }
});

// API endpoint to get scheme codes and names
app.get('/api/schemes', async (req, res) => {
  try {
    // Find the latest scheme master file
    const files = fs.readdirSync(__dirname);
    const schemeFiles = files.filter(file => file.startsWith('NSE_NSEINVEST_ALL_') && file.endsWith('.txt'));

    if (schemeFiles.length === 0) {
      console.error('No scheme master files found');
      return res.status(404).json({ error: 'No scheme master files found. Please download the scheme master first.' });
    }

    // Sort by date (newest first, based on filename)
    schemeFiles.sort().reverse();
    const filePath = path.join(__dirname, schemeFiles[0]);

    console.log(`Using latest scheme file: ${filePath}`);

    const schemes = [];

    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      console.error(`Scheme file not found: ${filePath}`);
      return res.status(404).json({ error: 'Scheme file not found' });
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isFirstLine = true;
    for await (const line of rl) {
      if (isFirstLine) {
        isFirstLine = false;
        continue; // Skip header line
      }

      const cols = line.split('|');
      if (cols.length > 8) {
        // Only include schemes that allow purchase
        if (cols[9] === 'Y') {
          schemes.push({
            code: cols[1],
            name: cols[8],
            minAmount: cols[11] || '1000' // Get minimum purchase amount if available
          });
        }
      }
    }

    console.log(`Successfully loaded ${schemes.length} purchasable schemes`);
    res.json(schemes);
  } catch (err) {
    console.error('Error reading scheme file:', err);
    res.status(500).json({ error: 'Failed to read scheme file', details: err.message });
  }
});

// API endpoint to process orders
app.post('/api/process-order', async (req, res) => {
  try {
    console.log('Received order request:', req.body);
    const { schemeCode, amount, clientCode, remarks, email, mobileNo } = req.body;

    if (!schemeCode || !amount || !clientCode) {
      console.error('Missing required fields:', { schemeCode, amount, clientCode });
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    // Create order payload using the selected scheme and form data
    const orderPayload = {
      "transaction_details": [
        {
          "order_ref_number": `ORD${Date.now()}`, // Generate unique reference number
          "scheme_code": schemeCode,
          "trxn_type": "P",                      // Purchase
          "buy_sell_type": "FRESH",              // Fresh purchase
          "client_code": clientCode,
          "demat_physical": "C",                 // CDSL Demat
          "order_amount": amount.toString(),
          "folio_no": "",
          "remarks": remarks || "Purchase Order",
          "kyc_flag": "Y",
          "sub_broker_code": "",
          "euin_number": "E123456",
          "euin_declaration": "Y",
          "min_redemption_flag": "N",
          "dpc_flag": "Y",
          "all_units": "N",
          "redemption_units": "",
          "sub_broker_arn": "",
          "bank_ref_no": `REF${Date.now()}`,
          "account_no": "",
          "mobile_no": mobileNo || "9876543210",
          "email": email || "test@example.com",
          "mandate_id": "",
          "filler1": "",
          "trxn_order_id": "",
          "trxn_status": "",
          "trxn_remark": ""
        }
      ]
    };

    console.log('Making Order Entry API request...');
    console.log('URL:', `${config.url}/transaction/NORMAL`);
    console.log('Payload:', JSON.stringify(orderPayload, null, 2));

    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });

    try {
      // Make the Order Entry API request
      const orderResponse = await instance.post(
        `${config.url}/transaction/NORMAL`,
        orderPayload,
        { headers }
      );

      console.log('Order API Response Status:', orderResponse.status);
      console.log('Order API Response Data:', JSON.stringify(orderResponse.data, null, 2));

      // Store the order entry data in MongoDB
      try {
        const orderDetails = orderResponse.data.transaction_details[0];
        const orderEntry = new OrderEntry({
          order_ref_number: orderPayload.transaction_details[0].order_ref_number,
          scheme_code: orderPayload.transaction_details[0].scheme_code,
          trxn_type: orderPayload.transaction_details[0].trxn_type,
          buy_sell_type: orderPayload.transaction_details[0].buy_sell_type,
          client_code: orderPayload.transaction_details[0].client_code,
          demat_physical: orderPayload.transaction_details[0].demat_physical,
          order_amount: orderPayload.transaction_details[0].order_amount,
          folio_no: orderPayload.transaction_details[0].folio_no,
          remarks: orderPayload.transaction_details[0].remarks,
          kyc_flag: orderPayload.transaction_details[0].kyc_flag,
          sub_broker_code: orderPayload.transaction_details[0].sub_broker_code,
          euin_number: orderPayload.transaction_details[0].euin_number,
          euin_declaration: orderPayload.transaction_details[0].euin_declaration,
          min_redemption_flag: orderPayload.transaction_details[0].min_redemption_flag,
          dpc_flag: orderPayload.transaction_details[0].dpc_flag,
          all_units: orderPayload.transaction_details[0].all_units,
          redemption_units: orderPayload.transaction_details[0].redemption_units,
          sub_broker_arn: orderPayload.transaction_details[0].sub_broker_arn,
          bank_ref_no: orderPayload.transaction_details[0].bank_ref_no,
          account_no: orderPayload.transaction_details[0].account_no,
          mobile_no: orderPayload.transaction_details[0].mobile_no,
          email: orderPayload.transaction_details[0].email,
          mandate_id: orderPayload.transaction_details[0].mandate_id,
          send_2fa: orderPayload.transaction_details[0].send_2fa,
          send_comm: orderPayload.transaction_details[0].send_comm,
          trxn_order_id: orderResponse.data.transaction_details[0]?.trxn_order_id || '',
          trxn_status: orderResponse.data.transaction_details[0]?.trxn_status || 'PENDING',
          trxn_remark: orderResponse.data.transaction_details[0]?.trxn_remark || '',
          filler1: orderPayload.transaction_details[0].filler1
        });

        await orderEntry.save();
        console.log('Order Entry saved to MongoDB');
      } catch (dbError) {
        console.error('Failed to save order entry to MongoDB:', dbError.message);
        // Continue with the response even if MongoDB save fails
      }

      // Return the actual API response to the frontend
      res.json({
        success: true,
        data: orderResponse.data
      });
    } catch (apiError) {
      console.error('API Error:');

      if (apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Status:', apiError.response.status);
        console.error('Headers:', apiError.response.headers);
        console.error('Data:', apiError.response.data);

        res.status(apiError.response.status).json({
          success: false,
          error: 'NSE API Error',
          status: apiError.response.status,
          data: apiError.response.data
        });
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error('No response received:', apiError.request);

        // For development/testing - simulate a successful response if API is unreachable
        console.log('Sending simulated response for development (API unreachable)');

        // Create simulated response
        const simulatedResponse = {
          message: "Order processed successfully (simulated)",
          order_id: `ORD${Date.now()}`,
          scheme_code: schemeCode,
          amount: amount,
          client_code: clientCode,
          status: "PENDING",
          timestamp: new Date().toISOString()
        };

        // Store the simulated order in MongoDB
        try {
          const orderEntry = new OrderEntry({
            requestPayload: orderPayload,
            responseData: simulatedResponse,
            orderRefNumber: orderPayload.transaction_details[0].order_ref_number,
            clientCode: clientCode,
            schemeCode: schemeCode,
            amount: parseFloat(amount),
            status: 'SIMULATED'
          });

          await orderEntry.save();
          console.log('Simulated Order Entry saved to MongoDB');
        } catch (dbError) {
          console.error('Failed to save simulated order entry to MongoDB:', dbError.message);
          // Continue with the response even if MongoDB save fails
        }

        res.json({
          success: true,
          simulated: true,
          data: simulatedResponse
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', apiError.message);

        res.status(500).json({
          success: false,
          error: apiError.message
        });
      }
    }
  } catch (error) {
    console.error('Server Error:', error);

    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your order',
      details: error.message
    });
  }
});

// API endpoint to process UCC registration
app.post('/api/register-ucc', async (req, res) => {
  try {
    console.log('Received UCC registration request:', req.body);
    const clientDetails = req.body;

    // Validate required fields
    const requiredFields = [
      'clientCode', 'firstName', 'lastName', 'taxStatus', 'gender',
      'dob', 'occupationCode', 'holdingNature', 'email', 'city',
      'state', 'pincode', 'country', 'account_no_1', 'ifsc_code_1',
      'cheque_name', 'primary_holder_pan'
    ];

    const missingFields = requiredFields.filter(field => !clientDetails[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

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

    // Generate UCC registration payload
    const uccPayload = {
      reg_details: [{
        client_code: clientDetails.clientCode,
        primary_holder_first_name: clientDetails.firstName,
        primary_holder_middle_name: clientDetails.middleName || "",
        primary_holder_last_name: clientDetails.lastName,
        tax_status: clientDetails.taxStatus,
        gender: clientDetails.gender,
        primary_holder_dob_incorporation: clientDetails.dob,
        occupation_code: clientDetails.occupationCode,
        holding_nature: clientDetails.holdingNature,
        primary_holder_pan_exempt: clientDetails.primary_holder_pan_exempt || "N",
        primary_holder_pan: clientDetails.primary_holder_pan,
        client_type: clientDetails.clientType || "P",
        default_dp: clientDetails.default_dp || "CDSL",
        cdsl_dpid: clientDetails.cdsl_dpid || "",
        cdslcltid: clientDetails.cdslcltid || "",
        account_type_1: clientDetails.account_type_1 || "SB",
        account_no_1: clientDetails.account_no_1,
        ifsc_code_1: clientDetails.ifsc_code_1,
        default_bank_flag_1: clientDetails.default_bank_flag_1 || "Y",
        cheque_name: clientDetails.cheque_name,
        div_pay_mode: clientDetails.div_pay_mode || "03",
        communication_mode: clientDetails.communicationMode || "P",
        email: clientDetails.email,
        mobile_declaration_flag: clientDetails.mobile_declaration_flag || "SE",
        email_declaration_flag: clientDetails.email_declaration_flag || "SE",
        address_1: clientDetails.address1 || "",
        city: clientDetails.city,
        state: clientDetails.state,
        pincode: clientDetails.pincode,
        country: clientDetails.country,
        resi_phone: clientDetails.phone || "",
        indian_mobile_no: clientDetails.mobileNo || "",
        paperless_flag: clientDetails.paperlessFlag || "Z",
        nomination_opt: clientDetails.nominationOpt || "N",
        primary_holder_kyc_type: clientDetails.primary_holder_kyc_type || "K",
        primary_holder_ckyc_number: clientDetails.ckycNumber || "",
        aadhaar_updated: clientDetails.aadhaarUpdated || "Y"
      }]
    };

    console.log('Making UCC Registration API request...');
    console.log('URL:', `${config.url}/registration/CLIENTCOMMON`);
    console.log('Payload:', JSON.stringify(uccPayload, null, 2));

    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });

    try {
      // Make the UCC Registration API request
      const registrationResponse = await instance.post(
        `${config.url}/registration/CLIENTCOMMON`,
        uccPayload,
        { headers }
      );

      console.log('Registration API Response Status:', registrationResponse.status);
      console.log('Registration API Response Data:', JSON.stringify(registrationResponse.data, null, 2));

      // Store the registration data in MongoDB
      try {
        const regDetails = uccPayload.reg_details[0];
        const uccRegistration = new UccRegistration({
          client_code: regDetails.client_code,
          primary_holder_first_name: regDetails.primary_holder_first_name,
          primary_holder_middle_name: regDetails.primary_holder_middle_name,
          primary_holder_last_name: regDetails.primary_holder_last_name,
          tax_status: regDetails.tax_status,
          gender: regDetails.gender,
          primary_holder_dob_incorporation: regDetails.primary_holder_dob_incorporation,
          occupation_code: regDetails.occupation_code,
          holding_nature: regDetails.holding_nature,
          second_holder_first_name: regDetails.second_holder_first_name || '',
          second_holder_middle_name: regDetails.second_holder_middle_name || '',
          second_holder_last_name: regDetails.second_holder_last_name || '',
          third_holder_first_name: regDetails.third_holder_first_name || '',
          third_holder_middle_name: regDetails.third_holder_middle_name || '',
          third_holder_last_name: regDetails.third_holder_last_name || '',
          second_holder_dob: regDetails.second_holder_dob || '',
          third_holder_dob: regDetails.third_holder_dob || '',
          guardian_first_name: regDetails.guardian_first_name || '',
          guardian_middle_name: regDetails.guardian_middle_name || '',
          guardian_last_name: regDetails.guardian_last_name || '',
          guardian_dob: regDetails.guardian_dob || '',
          primary_holder_pan_exempt: regDetails.primary_holder_pan_exempt,
          second_holder_pan_exempt: regDetails.second_holder_pan_exempt || '',
          third_holder_pan_exempt: regDetails.third_holder_pan_exempt || '',
          guardian_pan_exempt: regDetails.guardian_pan_exempt || '',
          primary_holder_pan: regDetails.primary_holder_pan,
          second_holder_pan: regDetails.second_holder_pan || '',
          third_holder_pan: regDetails.third_holder_pan || '',
          guardian_pan: regDetails.guardian_pan || '',
          primary_holder_exempt_category: regDetails.primary_holder_exempt_category || '',
          second_holder_exempt_category: regDetails.second_holder_exempt_category || '',
          third_holder_exempt_category: regDetails.third_holder_exempt_category || '',
          guardian_exempt_category: regDetails.guardian_exempt_category || '',
          client_type: regDetails.client_type,
          pms: regDetails.pms || '',
          default_dp: regDetails.default_dp,
          cdsl_dpid: regDetails.cdsl_dpid || '',
          cdslcltid: regDetails.cdslcltid || '',
          cmbp_id: regDetails.cmbp_id || '',
          nsdldpid: regDetails.nsdldpid || '',
          nsdlcltid: regDetails.nsdlcltid || '',
          account_type_1: regDetails.account_type_1,
          account_no_1: regDetails.account_no_1,
          micr_no_1: regDetails.micr_no_1 || '',
          ifsc_code_1: regDetails.ifsc_code_1,
          default_bank_flag_1: regDetails.default_bank_flag_1,
          account_type_2: regDetails.account_type_2 || '',
          account_no_2: regDetails.account_no_2 || '',
          micr_no_2: regDetails.micr_no_2 || '',
          ifsc_code_2: regDetails.ifsc_code_2 || '',
          default_bank_flag_2: regDetails.default_bank_flag_2 || '',
          account_type_3: regDetails.account_type_3 || '',
          account_no_3: regDetails.account_no_3 || '',
          micr_no_3: regDetails.micr_no_3 || '',
          ifsc_code_3: regDetails.ifsc_code_3 || '',
          default_bank_flag_3: regDetails.default_bank_flag_3 || '',
          account_type_4: regDetails.account_type_4 || '',
          account_no_4: regDetails.account_no_4 || '',
          micr_no_4: regDetails.micr_no_4 || '',
          ifsc_code_4: regDetails.ifsc_code_4 || '',
          default_bank_flag_4: regDetails.default_bank_flag_4 || '',
          account_type_5: regDetails.account_type_5 || '',
          account_no_5: regDetails.account_no_5 || '',
          micr_no_5: regDetails.micr_no_5 || '',
          ifsc_code_5: regDetails.ifsc_code_5 || '',
          default_bank_flag_5: regDetails.default_bank_flag_5 || '',
          cheque_name: regDetails.cheque_name,
          div_pay_mode: regDetails.div_pay_mode,
          address_1: regDetails.address_1 || '',
          address_2: regDetails.address_2 || '',
          address_3: regDetails.address_3 || '',
          city: regDetails.city,
          state: regDetails.state,
          pincode: regDetails.pincode,
          country: regDetails.country,
          resi_phone: regDetails.resi_phone || '',
          resi_fax: regDetails.resi_fax || '',
          office_phone: regDetails.office_phone || '',
          office_fax: regDetails.office_fax || '',
          email: regDetails.email,
          communication_mode: regDetails.communication_mode,
          foreign_address_1: regDetails.foreign_address_1 || '',
          foreign_address_2: regDetails.foreign_address_2 || '',
          foreign_address_3: regDetails.foreign_address_3 || '',
          foreign_address_city: regDetails.foreign_address_city || '',
          foreign_address_pincode: regDetails.foreign_address_pincode || '',
          foreign_address_state: regDetails.foreign_address_state || '',
          foreign_address_country: regDetails.foreign_address_country || '',
          foreign_address_resi_phone: regDetails.foreign_address_resi_phone || '',
          foreign_address_fax: regDetails.foreign_address_fax || '',
          foreign_address_off_phone: regDetails.foreign_address_off_phone || '',
          foreign_address_off_fax: regDetails.foreign_address_off_fax || '',
          indian_mobile_no: regDetails.indian_mobile_no || '',
          nominee_1_name: regDetails.nominee_1_name || '',
          nominee_1_relationship: regDetails.nominee_1_relationship || '',
          nominee_1_applicable: regDetails.nominee_1_applicable || '',
          nominee_1_minor_flag: regDetails.nominee_1_minor_flag || '',
          nominee_1_dob: regDetails.nominee_1_dob || '',
          nominee_1_guardian: regDetails.nominee_1_guardian || '',
          nominee_2_name: regDetails.nominee_2_name || '',
          nominee_2_relationship: regDetails.nominee_2_relationship || '',
          nominee_2_applicable: regDetails.nominee_2_applicable || '',
          nominee_2_dob: regDetails.nominee_2_dob || '',
          nominee_2_minor_flag: regDetails.nominee_2_minor_flag || '',
          nominee_2_guardian: regDetails.nominee_2_guardian || '',
          nominee_3_name: regDetails.nominee_3_name || '',
          nominee_3_relationship: regDetails.nominee_3_relationship || '',
          nominee_3_applicable: regDetails.nominee_3_applicable || '',
          nominee_3_dob: regDetails.nominee_3_dob || '',
          nominee_3_minor_flag: regDetails.nominee_3_minor_flag || '',
          nominee_3_guardian: regDetails.nominee_3_guardian || '',
          primary_holder_kyc_type: regDetails.primary_holder_kyc_type,
          primary_holder_ckyc_number: regDetails.primary_holder_ckyc_number || '',
          second_holder_kyc_type: regDetails.second_holder_kyc_type || '',
          second_holder_ckyc_number: regDetails.second_holder_ckyc_number || '',
          third_holder_kyc_type: regDetails.third_holder_kyc_type || '',
          third_holder_ckyc_number: regDetails.third_holder_ckyc_number || '',
          guardian_kyc_type: regDetails.guardian_kyc_type || '',
          guardian_ckyc_number: regDetails.guardian_ckyc_number || '',
          primary_holder_kra_exempt_ref_no: regDetails.primary_holder_kra_exempt_ref_no || '',
          second_holder_kra_exempt_ref_no: regDetails.second_holder_kra_exempt_ref_no || '',
          third_holder_kra_exempt_ref_no: regDetails.third_holder_kra_exempt_ref_no || '',
          guardian_exempt_ref_no: regDetails.guardian_exempt_ref_no || '',
          aadhaar_updated: regDetails.aadhaar_updated,
          mapin_id: regDetails.mapin_id || '',
          paperless_flag: regDetails.paperless_flag,
          lei_no: regDetails.lei_no || '',
          lei_validity: regDetails.lei_validity || '',
          mobile_declaration_flag: regDetails.mobile_declaration_flag,
          email_declaration_flag: regDetails.email_declaration_flag,
          nomination_opt: regDetails.nomination_opt,
          nomination_authentication: regDetails.nomination_authentication || '',
          nominee_1_pan: regDetails.nominee_1_pan || '',
          nominee_1_guardian_pan: regDetails.nominee_1_guardian_pan || '',
          nominee_2_pan: regDetails.nominee_2_pan || '',
          nominee_2_guardian_pan: regDetails.nominee_2_guardian_pan || '',
          nominee_3_pan: regDetails.nominee_3_pan || '',
          nominee_3_guardian_pan: regDetails.nominee_3_guardian_pan || '',
          second_holder_email: regDetails.second_holder_email || '',
          second_holder_email_declaration: regDetails.second_holder_email_declaration || '',
          second_holder_mobile: regDetails.second_holder_mobile || '',
          second_holder_mobile_declaration: regDetails.second_holder_mobile_declaration || '',
          third_holder_email: regDetails.third_holder_email || '',
          third_holder_email_declaration: regDetails.third_holder_email_declaration || '',
          third_holder_mobile: regDetails.third_holder_mobile || '',
          third_holder_mobile_declaration: regDetails.third_holder_mobile_declaration || '',
          guardian_relation: regDetails.guardian_relation || '',
          filler1: regDetails.filler1 || '',
          filler2: regDetails.filler2 || '',
          filler3: regDetails.filler3 || '',
          consent_flag: regDetails.consent_flag || '',
          reg_id: registrationResponse.data.reg_details[0]?.reg_id || '',
          reg_status: registrationResponse.data.reg_details[0]?.reg_status || 'REG_PENDING',
          reg_remark: registrationResponse.data.reg_details[0]?.reg_remark || ''
        });

        await uccRegistration.save();
        console.log('UCC Registration saved to MongoDB');
      } catch (dbError) {
        console.error('Failed to save UCC registration to MongoDB:', dbError.message);
        // Continue with the response even if MongoDB save fails
      }

      // Return the actual API response to the frontend
      res.json({
        success: true,
        data: registrationResponse.data
      });
    } catch (apiError) {
      console.error('API Error:');

      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Headers:', apiError.response.headers);
        console.error('Data:', apiError.response.data);

        res.status(apiError.response.status).json({
          success: false,
          error: 'NSE API Error',
          status: apiError.response.status,
          data: apiError.response.data
        });
      } else if (apiError.request) {
        console.error('No response received:', apiError.request);

        // For development/testing - simulate a successful response if API is unreachable
        console.log('Sending simulated response for development (API unreachable)');

        // Create simulated response
        const simulatedResponse = {
          message: "UCC Registration processed successfully (simulated)",
          reg_details: [{
            client_code: clientDetails.client_code,
            reg_id: `REG${Date.now()}`,
            reg_status: "REG_SUCCESS",
            reg_remark: "Simulated registration successful"
          }],
          response_status: 'S'
        };

        // Store the simulated registration in MongoDB
        try {
          const uccRegistration = new UccRegistration({
            client_code: clientDetails.client_code,
            primary_holder_first_name: clientDetails.firstName,
            primary_holder_middle_name: clientDetails.middleName || '',
            primary_holder_last_name: clientDetails.lastName,
            tax_status: clientDetails.taxStatus,
            gender: clientDetails.gender,
            primary_holder_dob_incorporation: clientDetails.dob,
            occupation_code: clientDetails.occupationCode,
            holding_nature: clientDetails.holdingNature,
            primary_holder_pan_exempt: clientDetails.primary_holder_pan_exempt || 'N',
            primary_holder_pan: clientDetails.primary_holder_pan,
            client_type: clientDetails.clientType || 'P',
            default_dp: clientDetails.default_dp || 'CDSL',
            account_type_1: clientDetails.account_type_1 || 'SB',
            account_no_1: clientDetails.account_no_1,
            ifsc_code_1: clientDetails.ifsc_code_1,
            default_bank_flag_1: clientDetails.default_bank_flag_1 || 'Y',
            cheque_name: clientDetails.cheque_name,
            div_pay_mode: clientDetails.div_pay_mode || '03',
            communication_mode: clientDetails.communicationMode || 'P',
            email: clientDetails.email,
            address_1: clientDetails.address1 || '',
            city: clientDetails.city,
            state: clientDetails.state,
            pincode: clientDetails.pincode,
            country: clientDetails.country,
            indian_mobile_no: clientDetails.mobileNo || '',
            paperless_flag: clientDetails.paperlessFlag || 'Z',
            nomination_opt: clientDetails.nominationOpt || 'N',
            primary_holder_kyc_type: clientDetails.primary_holder_kyc_type || 'K',
            aadhaar_updated: clientDetails.aadhaarUpdated || 'Y',
            mobile_declaration_flag: clientDetails.mobile_declaration_flag || 'SE',
            email_declaration_flag: clientDetails.email_declaration_flag || 'SE',
            reg_id: simulatedResponse.reg_details[0].reg_id,
            reg_status: simulatedResponse.reg_details[0].reg_status,
            reg_remark: simulatedResponse.reg_details[0].reg_remark
          });

          await uccRegistration.save();
          console.log('Simulated UCC Registration saved to MongoDB');
        } catch (dbError) {
          console.error('Failed to save simulated UCC registration to MongoDB:', dbError.message);
          // Continue with the response even if MongoDB save fails
        }

        res.json({
          success: true,
          simulated: true,
          data: simulatedResponse
        });
      } else {
        console.error('Error:', apiError.message);

        res.status(500).json({
          success: false,
          error: apiError.message
        });
      }
    }
  } catch (error) {
    console.error('Server Error:', error);

    res.status(500).json({
      success: false,
      error: 'An error occurred while processing UCC registration',
      details: error.message
    });
  }
});

// API endpoint to process UCC registration 183
app.post('/api/register-ucc-183', async (req, res) => {
  try {
    console.log('Received UCC registration 183 request:', req.body);
    const clientDetails = req.body;

    // Validate required fields
    const requiredFields = [
      'client_code',
      'primary_holder_first_name',
      'primary_holder_last_name',
      'tax_status',
      'gender',
      'primary_holder_dob_incorporation',
      'occupation_code',
      'holding_nature',
      'primary_holder_pan',
      'email',
      'address_1',
      'city',
      'state',
      'pincode',
      'country'
    ];

    const missingFields = requiredFields.filter(field => !clientDetails[field]);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ error: 'Missing required fields', fields: missingFields });
    }

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

    // Create registration payload using the 183 column format
    const registrationPayload = {
      reg_details: [clientDetails]
    };

    console.log('Making UCC Registration 183 API request...');
    console.log('URL:', `${config.url}/registration/CLIENTCOMMON`);
    console.log('Payload:', JSON.stringify(registrationPayload, null, 2));

    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });

    try {
      // Make the UCC Registration API request
      const registrationResponse = await instance.post(
        `${config.url}/registration/CLIENTCOMMON`,
        registrationPayload,
        { headers }
      );

      console.log('Registration API Response Status:', registrationResponse.status);
      console.log('Registration API Response Data:', JSON.stringify(registrationResponse.data, null, 2));

      // Store the registration data in MongoDB
      try {
        const uccRegistration = new UccRegistration({
          ...clientDetails,
          registrationDate: new Date(),
          status: registrationResponse.data.reg_details?.[0]?.reg_status || 'PENDING',
          remarks: registrationResponse.data.reg_details?.[0]?.reg_remark || ''
        });

        await uccRegistration.save();
        console.log('UCC Registration 183 saved to MongoDB');
      } catch (dbError) {
        console.error('Failed to save UCC registration 183 to MongoDB:', dbError.message);
        // Continue with the response even if MongoDB save fails
      }

      // Return the actual API response to the frontend
      res.json({
        success: true,
        data: registrationResponse.data
      });
    } catch (apiError) {
      console.error('API Error:');

      if (apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Status:', apiError.response.status);
        console.error('Headers:', apiError.response.headers);
        console.error('Data:', apiError.response.data);

        res.status(apiError.response.status).json({
          success: false,
          error: 'NSE API Error',
          status: apiError.response.status,
          data: apiError.response.data
        });
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error('No response received:', apiError.request);

        // For development/testing - simulate a successful response if API is unreachable
        console.log('Sending simulated response for development (API unreachable)');

        // Create simulated response
        const simulatedResponse = {
          message: "UCC Registration processed successfully (simulated)",
          client_code: clientDetails.client_code,
          status: "PENDING",
          timestamp: new Date().toISOString()
        };

        // Store the simulated registration in MongoDB
        try {
          const uccRegistration = new UccRegistration({
            ...clientDetails,
            registrationDate: new Date(),
            status: 'SIMULATED',
            remarks: 'Simulated registration - API unreachable'
          });

          await uccRegistration.save();
          console.log('Simulated UCC Registration 183 saved to MongoDB');
        } catch (dbError) {
          console.error('Failed to save simulated UCC registration 183 to MongoDB:', dbError.message);
          // Continue with the response even if MongoDB save fails
        }

        res.json({
          success: true,
          simulated: true,
          data: simulatedResponse
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', apiError.message);

        res.status(500).json({
          success: false,
          error: apiError.message
        });
      }
    }
  } catch (error) {
    console.error('Server Error:', error);

    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your registration',
      details: error.message
    });
  }
});

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

// API endpoint to get order status report
app.post('/api/order-status', async (req, res) => {
  try {
    console.log('Received order status request:', req.body);
    const reportParams = req.body;

    // Validate required fields
    if (!reportParams.fromDate || !reportParams.toDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fromDate and toDate are required'
      });
    }

    // Validate date range
    try {
      validateDateRange(reportParams.fromDate, reportParams.toDate);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

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

    // Generate payload
    const payload = {
      "from_date": reportParams.fromDate,
      "to_date": reportParams.toDate,
      "trans_type": reportParams.transType || "ALL",
      "order_type": reportParams.orderType || "ALL",
      "sub_order_type": reportParams.subOrderType || "ALL"
    };

    console.log('Making Order Status Report API request...');
    console.log('URL:', `${config.url}/reports/ORDER_STATUS`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });

    try {
      // Make the Order Status Report API request
      const orderStatusResponse = await instance.post(
        `${config.url}/reports/ORDER_STATUS`,
        payload,
        { headers }
      );

      console.log('Order Status API Response Status:', orderStatusResponse.status);
      console.log('Order Status API Response Data:', JSON.stringify(orderStatusResponse.data, null, 2));

      // Return the actual API response to the frontend
      res.json({
        success: true,
        data: orderStatusResponse.data
      });
    } catch (apiError) {
      console.error('API Error:');

      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Headers:', apiError.response.headers);
        console.error('Data:', apiError.response.data);

        res.status(apiError.response.status).json({
          success: false,
          error: 'NSE API Error',
          status: apiError.response.status,
          data: apiError.response.data
        });
      } else if (apiError.request) {
        console.error('No response received:', apiError.request);

        // For development/testing - simulate a successful response if API is unreachable
        console.log('Sending simulated response for development (API unreachable)');
        res.json({
          success: true,
          simulated: true,
          data: {
            response_status: 'S',
            report_data_total: 2,
            report_data: [
              {
                order_id: `ORD${Date.now()}1`,
                scheme_code: 'EXAMPLE1',
                transaction_type: reportParams.transType || 'P',
                amount: 5000,
                status: 'SUCCESS',
                timestamp: new Date().toISOString()
              },
              {
                order_id: `ORD${Date.now()}2`,
                scheme_code: 'EXAMPLE2',
                transaction_type: reportParams.transType || 'P',
                amount: 10000,
                status: 'PENDING',
                timestamp: new Date().toISOString()
              }
            ]
          }
        });
      } else {
        console.error('Error:', apiError.message);

        res.status(500).json({
          success: false,
          error: apiError.message
        });
      }
    }
  } catch (error) {
    console.error('Server Error:', error);

    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching order status report',
      details: error.message
    });
  }
});

// Import the order status report functionality
const { fetchOrderStatusReport } = require('./order-status-report');

// API endpoint for order status report
app.post('/api/order-status-report', async (req, res) => {
  try {
    console.log('Received order status report request:', req.body);

    // Validate required fields
    const { fromDate, toDate } = req.body;
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required fields: fromDate and toDate' });
    }

    // Call the fetchOrderStatusReport function
    const reportData = await fetchOrderStatusReport(req.body);

    // For development/testing - simulate a successful response if API is unreachable
    if (!reportData) {
      console.log('Sending simulated response for development');
      return res.json({
        success: true,
        simulated: true,
        data: {
          report_data: [
            {
              order_id: 'ORD123456',
              trans_type: req.body.transType || 'ALL',
              order_type: req.body.orderType || 'ALL',
              scheme_code: 'SCHEME001',
              amount: '10000',
              status: 'COMPLETED',
              order_date: '2024-03-20'
            }
          ],
          report_data_total: 1,
          from_date: fromDate,
          to_date: toDate
        }
      });
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Order Status Report Error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch order status report',
      details: error.message
    });
  }
});

// Import the order cancellation functionality
const { cancelOrders } = require('./order-cancellation');

// API endpoint for order cancellation
app.post('/api/order-cancellation', async (req, res) => {
  try {
    console.log('Received order cancellation request:', req.body);

    // Validate required fields
    const cancellationDetails = req.body;
    const requiredFields = ['client_code', 'order_no', 'remarks'];

    if (!cancellationDetails) {
      return res.status(400).json({ error: 'Missing cancellation details' });
    }

    // Check if we have an array or a single order
    const ordersToCheck = Array.isArray(cancellationDetails) ? cancellationDetails : [cancellationDetails];

    // Validate each order
    for (const order of ordersToCheck) {
      const missingFields = requiredFields.filter(field => !order[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: `Order for client ${order.client_code || 'unknown'} is missing: ${missingFields.join(', ')}`
        });
      }
    }

    // Call the cancelOrders function
    const cancellationResult = await cancelOrders(cancellationDetails);

    // For development/testing - simulate a successful response if API is unreachable
    if (!cancellationResult) {
      console.log('Sending simulated response for development');
      return res.json({
        success: true,
        simulated: true,
        data: {
          can_status: "S",
          can_remarks: "Order cancellation request processed successfully",
          details: ordersToCheck.map(order => ({
            client_code: order.client_code,
            order_no: order.order_no,
            status: "CANCELLED",
            remarks: "Cancellation processed successfully"
          }))
        }
      });
    }

    res.json({
      success: true,
      data: cancellationResult
    });

  } catch (error) {
    console.error('Order Cancellation Error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to process order cancellation',
      details: error.message
    });
  }
});

// API endpoint to get UCC registrations from MongoDB
app.get('/api/ucc-registrations', async (req, res) => {
  try {
    const { clientCode, limit = 20, skip = 0 } = req.query;

    // Check if mongoose is connected before querying
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is not connected',
        message: 'Database functionality is temporarily unavailable'
      });
    }

    // Build query based on parameters
    const query = {};
    if (clientCode) {
      query.client_code = clientCode;
    }

    // Execute the query with pagination
    const uccRegistrations = await UccRegistration.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await UccRegistration.countDocuments(query);

    res.json({
      success: true,
      data: uccRegistrations,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving UCC registrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve UCC registrations',
      details: error.message
    });
  }
});

// API endpoint to get orders from MongoDB
app.get('/api/orders', async (req, res) => {
  try {
    const { clientCode, schemeCode, limit = 20, skip = 0 } = req.query;

    // Check if mongoose is connected before querying
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'MongoDB is not connected',
        message: 'Database functionality is temporarily unavailable'
      });
    }

    // Build query based on parameters
    const query = {};
    if (clientCode) {
      query.client_code = clientCode;
    }
    if (schemeCode) {
      query.scheme_code = schemeCode;
    }

    // Execute the query with pagination
    const orders = await OrderEntry.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await OrderEntry.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders',
      details: error.message
    });
  }
});

// API endpoint to handle AOF image upload
app.post('/api/aof-image-upload', async (req, res) => {
  try {
    console.log('Received AOF image upload request:', req.body);
    const { client_code, file_name, document_type, file_data } = req.body;

    if (!client_code || !file_name || !document_type || !file_data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    console.log('Making AOF Image Upload API request...');
    console.log('URL:', `${config.url}/fileupload/AOFIMG`);

    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });

    try {
      // Make the AOF Image Upload API request
      const uploadResponse = await instance.post(
        `${config.url}/fileupload/AOFIMG`,
        {
          client_code,
          file_name,
          document_type,
          file_data
        },
        { headers }
      );

      console.log('AOF Image Upload API Response Status:', uploadResponse.status);
      console.log('AOF Image Upload API Response Data:', JSON.stringify(uploadResponse.data, null, 2));

      // Return the actual API response to the frontend
      res.json({
        success: true,
        data: uploadResponse.data
      });
    } catch (apiError) {
      console.error('API Error:');
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
        res.status(apiError.response.status).json({
          success: false,
          error: 'NSE API Error',
          data: apiError.response.data
        });
      } else {
        console.error('Error:', apiError.message);
        res.status(500).json({
          success: false,
          error: apiError.message
        });
      }
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      details: error.message
    });
  }
});

// API endpoint to handle AOF image upload report
app.post('/api/aof-image-report', async (req, res) => {
  try {
    console.log('Received AOF image report request:', req.body);
    const { client_code, from_date, to_date } = req.body;

    // Validate dates if client code is not provided
    if (!client_code) {
      if (!from_date || !to_date) {
        return res.status(400).json({ error: 'From date and to date are required when client code is not provided' });
      }

      // Parse dates
      const from = new Date(from_date.split('-').reverse().join('-'));
      const to = new Date(to_date.split('-').reverse().join('-'));
      const diffTime = Math.abs(to - from);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 31) {
        return res.status(400).json({ error: 'Date range cannot exceed 31 days when client code is not provided' });
      }

      if (from > to) {
        return res.status(400).json({ error: 'From date cannot be greater than to date' });
      }
    }

    // Validate client codes
    if (client_code) {
      const codes = client_code.split(',');
      if (codes.length > 50) {
        return res.status(400).json({ error: 'Maximum 50 client codes are allowed' });
      }
    }

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

    console.log('Making AOF Image Upload Report API request...');
    console.log('URL:', `${config.url}/reports/AOF_IMAGE_UPLOAD_REPORT`);

    // Create axios instance with TLS options
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // WARNING: This bypasses SSL verification - only use in controlled test environments
      })
    });

    try {
      // Make the AOF Image Upload Report API request
      const reportResponse = await instance.post(
        `${config.url}/reports/AOF_IMAGE_UPLOAD_REPORT`,
        {
          client_code,
          from_date,
          to_date
        },
        { headers }
      );

      console.log('AOF Report API Response Status:', reportResponse.status);
      console.log('AOF Report API Response Data:', JSON.stringify(reportResponse.data, null, 2));

      // Return the actual API response to the frontend
      res.json({
        success: true,
        data: reportResponse.data
      });
    } catch (apiError) {
      console.error('API Error:');
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
        res.status(apiError.response.status).json({
          success: false,
          error: 'NSE API Error',
          data: apiError.response.data
        });
      } else {
        console.error('Error:', apiError.message);
        res.status(500).json({
          success: false,
          error: apiError.message
        });
      }
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your request',
      details: error.message
    });
  }
});

// FATCA Registration API
app.post('/api/registration/FATCA_COMMON', async (req, res) => {
  try {
    const response = await makeNSERequest('/registration/FATCA_COMMON', req.body);
    res.json(response.data);
  } catch (error) {
    handleAPIError(error, res);
  }
});

// FATCA Report API
app.post('/api/reports/FATCA_REPORT', async (req, res) => {
  try {
    const response = await makeNSERequest('/reports/FATCA_REPORT', req.body);
    res.json(response.data);
  } catch (error) {
    handleAPIError(error, res);
  }
});

// FATCA Image Upload API
app.post('/api/fileupload/FATCAIMG', async (req, res) => {
  try {
    const response = await makeNSERequest('/fileupload/FATCAIMG', req.body);
    res.json(response.data);
  } catch (error) {
    handleAPIError(error, res);
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 