const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration (replace with your actual credentials or use environment variables)
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

/**
 * Downloads the scheme master from NSE API and saves it to a file
 * @param {boolean} forceDownload - Force download even if file exists
 * @returns {Promise<{fileName: string, filePath: string}>} - File info if successful
 */
const downloadSchemeMaster = async (forceDownload = false) => {
  try {
    // Generate filename with current date
    const now = new Date();
    const fileName = `NSE_NSEINVEST_ALL_${now.getDate().toString().padStart(2, '0')}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getFullYear()}.txt`;
    const filePath = path.join(__dirname, fileName);

    // Check if the file already exists and is recent (same day)
    if (!forceDownload && fs.existsSync(filePath)) {
      console.log(`Using existing scheme master file: ${filePath}`);
      return { fileName, filePath };
    }

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
    const payload = { file_type: 'SCH' };
    const instance = axios.create({
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
    console.log('Requesting Scheme Master & NAV Download API...');
    const response = await instance.post(
      `${config.url}/reports/MASTER_DOWNLOAD`,
      payload,
      { headers, responseType: 'arraybuffer' }
    );
    // The response should be a .txt file (pipe-separated)
    fs.writeFileSync(filePath, response.data);
    console.log(`Scheme master file downloaded and saved as: ${filePath}`);
    return { fileName, filePath };
  } catch (error) {
    console.error('API Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      if (error.response.data) {
        try {
          const errJson = JSON.parse(error.response.data.toString());
          console.error('Data:', errJson);
        } catch {
          console.error('Data:', error.response.data.toString());
        }
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
};

/**
 * Parse the scheme master file into JSON format
 * @param {string} filePath - Path to the scheme master file
 * @param {object} options - Options for parsing
 * @returns {Promise<Array>} - Array of scheme objects
 */
const parseSchemeMasterFile = async (filePath, options = {}) => {
  const { limit = 1000 } = options;
  
  return new Promise((resolve, reject) => {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }
      
      const schemes = [];
      let isFirstLine = true;
      let headers = [];
      let lineCount = 0;
      
      const fileStream = fs.createReadStream(filePath);
      const rl = require('readline').createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        lineCount++;
        
        // If we've hit the limit, stop processing
        if (limit && lineCount > limit + 1) { // +1 for header
          rl.close();
          return;
        }
        
        const cols = line.split('|');
        
        if (isFirstLine) {
          // Save headers
          headers = cols;
          isFirstLine = false;
          return;
        }
        
        // Create object from columns
        const scheme = {};
        cols.forEach((col, index) => {
          if (headers[index]) {
            scheme[headers[index]] = col;
          }
        });
        
        schemes.push(scheme);
      });
      
      rl.on('close', () => {
        console.log(`Parsed ${schemes.length} schemes from file`);
        resolve({
          schemes,
          total: schemes.length,
          limited: limit && lineCount > limit + 1, // +1 for header
          limit
        });
      });
      
      rl.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// If this file is run directly, download the scheme master
if (require.main === module) {
downloadSchemeMaster().catch(console.error); 
}

module.exports = {
  downloadSchemeMaster,
  parseSchemeMasterFile
}; 