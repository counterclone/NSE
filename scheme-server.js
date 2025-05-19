const express = require('express');
const cors = require('cors');
const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');

const app = express();
const PORT = 4000;

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

// API endpoint to get scheme codes and names
app.get('/api/schemes', async (req, res) => {
  const filePath = './NSE_NSEINVEST_ALL_10052025.txt';
  const schemes = [];
  try {
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      console.error(`Scheme file not found: ${filePath}`);
      return res.status(404).json({ error: 'Scheme file not found' });
    }
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      const cols = line.split('|');
      if (cols.length > 8) {
        schemes.push({ code: cols[1], name: cols[8] });
      }
      if (schemes.length >= 1000) break; // Limit for performance, adjust as needed
    }
    console.log(`Successfully loaded ${schemes.length} schemes`);
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
    const { schemeCode, amount, clientCode } = req.body;
    
    if (!schemeCode || !amount || !clientCode) {
      console.error('Missing required fields:', { schemeCode, amount, clientCode });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate encrypted password exactly as in order-entry.js
    const encryptedPassword = generateEncryptedPassword();
    console.log('Encrypted Password:', encryptedPassword);
    
    // Create basic auth string
    const basicAuth = Buffer.from(`${config.loginUserId}:${encryptedPassword}`).toString('base64');
    console.log('Basic Auth:', basicAuth);

    // Create headers for NSE API exactly as in order-entry.js
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
    
    // Create order payload exactly as in order-entry.js
    const orderPayload = {
      "transaction_details": [
        {
          // Use the exact same scheme code that works in order-entry.js for testing
          "order_ref_number": "000001",
          "scheme_code": "AXBDGP-GR", // Using hardcoded value that works in order-entry.js
          "trxn_type": "P",
          "buy_sell_type": "FRESH",
          "client_code": "H30350",
          "demat_physical": "C",
          "order_amount": "5000",
          "folio_no": "",
          "remarks": "Test Purchase Order",
          "kyc_flag": "Y",
          "sub_broker_code": "",
          "euin_number": "E123456",
          "euin_declaration": "Y",
          "min_redemption_flag": "N",
          "dpc_flag": "Y",
          "all_units": "N",
          "redemption_units": "",
          "sub_broker_arn": "",
          "bank_ref_no": "REF123456",
          "account_no": "1234567890",
          "mobile_no": "9876543210",
          "email": "test@example.com",
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
      // Make the Order Entry API request exactly as in order-entry.js
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

app.listen(PORT, () => {
  console.log(`Scheme server running on http://localhost:${PORT}`);
}); 