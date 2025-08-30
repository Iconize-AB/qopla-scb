require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

// Certificate configuration
const certificatePath = './Certifikat_SokPaVar_A00364_2025-08-28 10-43-58Z.pfx';
const certificatePassword = process.env.SCB_CERT_PASSWORD; // Loaded from .env file

// API configuration
const API_ID = 'A00364';
const BASE_URL = 'https://privateapi.scb.se/nv0101/v1/sokpavar';

// Check if certificate exists
if (!fs.existsSync(certificatePath)) {
    console.error('Certificate file not found:', certificatePath);
    process.exit(1);
}

// Check if password is provided
if (!certificatePassword) {
    console.error('Please set the SCB_CERT_PASSWORD environment variable');
    console.error('Example: export SCB_CERT_PASSWORD="your_password_here"');
    process.exit(1);
}

// HTTPS agent with certificate
const httpsAgent = new https.Agent({
    pfx: fs.readFileSync(certificatePath),
    passphrase: certificatePassword,
    rejectUnauthorized: true
});

// Helper function to make API requests
function makeApiRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${endpoint}`;
        
        const options = {
            hostname: 'privateapi.scb.se',
            port: 443,
            path: `/nv0101/v1/sokpavar${endpoint}`,
            method: method,
            agent: httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test functions
async function testCategories() {
    console.log('Testing categories endpoint...');
    try {
        const response = await makeApiRequest('/api/ae/kategoriermedkodtabeller');
        console.log('Status:', response.statusCode);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return response;
    } catch (error) {
        console.error('Error testing categories:', error.message);
        throw error;
    }
}

async function testHelp() {
    console.log('Testing help endpoint...');
    try {
        const response = await makeApiRequest('/help');
        console.log('Status:', response.statusCode);
        console.log('Response preview:', response.data.substring(0, 500) + '...');
        return response;
    } catch (error) {
        console.error('Error testing help:', error.message);
        throw error;
    }
}

// Main execution
async function main() {
    console.log('SCB API Test Script');
    console.log('API ID:', API_ID);
    console.log('Certificate:', certificatePath);
    console.log('Base URL:', BASE_URL);
    console.log('---');

    try {
        // Test help endpoint first
        await testHelp();
        console.log('\n---\n');
        
        // Test categories endpoint
        await testCategories();
        
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    main();
}

module.exports = {
    makeApiRequest,
    testCategories,
    testHelp
};
