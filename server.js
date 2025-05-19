const express = require('express');
const cors = require('cors');
const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');
const path = require('path');

// Import scheme master download functionality
const { downloadSchemeMaster, parseSchemeMasterFile } = require('./scheme-master-download');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS with specific options
app.use(cors({
  origin: 'http://localhost:3000', // Allow only the frontend application
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

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
        res.json({
          success: true,
          simulated: true,
          data: {
            message: "Order processed successfully (simulated)",
            order_id: `ORD${Date.now()}`,
            scheme_code: schemeCode,
            amount: amount,
            client_code: clientCode,
            status: "PENDING",
            timestamp: new Date().toISOString()
          }
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
      
      // Return the actual API response to the frontend
      res.json({
        success: true,
        data: registrationResponse.data
      });
      // Save client code
      const { clientCode, firstName, lastName, email } = clientDetails;
      const clients = readClients();
      if (!clients.find(c => c.clientCode === clientCode)) {
        clients.push({ clientCode, firstName, lastName, email });
        writeClients(clients);
      }
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
            message: "UCC Registration processed successfully (simulated)",
            client_code: clientDetails.clientCode,
            status: "PENDING",
            timestamp: new Date().toISOString()
          }
        });
        // Save client code (simulated)
        const { clientCode, firstName, lastName, email } = clientDetails;
        const clients = readClients();
        if (!clients.find(c => c.clientCode === clientCode)) {
          clients.push({ clientCode, firstName, lastName, email });
          writeClients(clients);
        }
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

const CLIENTS_FILE = path.join(__dirname, 'clients.json');

// Helper to read clients from file
function readClients() {
  try {
    if (!fs.existsSync(CLIENTS_FILE)) return [];
    const data = fs.readFileSync(CLIENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading clients.json:', e);
    return [];
  }
}

// Helper to write clients to file
function writeClients(clients) {
  try {
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing clients.json:', e);
  }
}

// API endpoint to get all registered clients
app.get('/api/clients', (req, res) => {
  const clients = readClients();
  res.json({ success: true, clients });
});

// API endpoint to add a client (used internally)
app.post('/api/clients', (req, res) => {
  const { clientCode, firstName, lastName, email } = req.body;
  if (!clientCode) return res.status(400).json({ success: false, error: 'clientCode is required' });
  const clients = readClients();
  if (!clients.find(c => c.clientCode === clientCode)) {
    clients.push({ clientCode, firstName, lastName, email });
    writeClients(clients);
  }
  res.json({ success: true });
}); 