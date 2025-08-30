require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Certificate configuration
const certificatePath = './Certifikat_SokPaVar_A00364_2025-08-28 10-43-58Z.pfx';
const certificatePassword = process.env.SCB_CERT_PASSWORD;

// HTTPS agent with certificate
const httpsAgent = new https.Agent({
    pfx: fs.readFileSync(certificatePath),
    passphrase: certificatePassword,
    rejectUnauthorized: true
});

// Helper function to make API requests
function makeApiRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
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

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get available categories
app.get('/api/categories', async (req, res) => {
    try {
        const response = await makeApiRequest('/api/ae/kategoriermedkodtabeller');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get employee count options
app.get('/api/employee-counts', async (req, res) => {
    try {
        const response = await makeApiRequest('/api/ae/kategoriermedkodtabeller');
        const employeeCounts = response.data.find(cat => cat.Id_Kategori_AE === 'Anställda');
        if (employeeCounts) {
            res.json(employeeCounts.VardeLista);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching employee counts:', error);
        res.status(500).json({ error: 'Failed to fetch employee counts' });
    }
});

// Search for restaurants
app.post('/api/search-restaurants', async (req, res) => {
    try {
        const { region, city, employeeCount, maxResults = 2000 } = req.body;
        
        const searchQuery = {
            Kategorier: [
                {
                    Kategori: "Bransch",
                    Kod: ["56100", "56210", "56291", "56292", "56293", "56294", "56299", "56300"],
                    Branschniva: 3
                },
                {
                    Kategori: "Arbetsställestatus",
                    Kod: ["1"]
                }
            ],
            MaxAntal: maxResults
        };

        // Add region filter if specified
        if (region && region !== 'all') {
            searchQuery.Kategorier.push({
                Kategori: "ARegion",
                Kod: [region]
            });
        }

        // Add city filter if specified
        if (city && city !== 'all') {
            searchQuery.Kategorier.push({
                Kategori: "Kommun",
                Kod: [city]
            });
        }

        // Add employee count filter if specified
        if (employeeCount && employeeCount !== 'all') {
            searchQuery.Kategorier.push({
                Kategori: "Anställda",
                Kod: [employeeCount]
            });
        }

        console.log('Search query:', JSON.stringify(searchQuery, null, 2));
        
        const response = await makeApiRequest('/api/Ae/HamtaArbetsstallen', 'POST', searchQuery);
        
        if (response.statusCode === 200) {
            res.json({
                success: true,
                data: response.data,
                total: response.data.length
            });
        } else {
            res.status(response.statusCode).json({
                success: false,
                error: response.data
            });
        }
    } catch (error) {
        console.error('Error searching restaurants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search restaurants'
        });
    }
});

// Download restaurants to Excel
app.post('/api/download-excel', async (req, res) => {
    try {
        const { region, city, employeeCount, maxResults = 2000 } = req.body;
        
        const searchQuery = {
            Kategorier: [
                {
                    Kategori: "Bransch",
                    Kod: ["56100", "56210", "56291", "56292", "56293", "56294", "56299", "56300"],
                    Branschniva: 3
                },
                {
                    Kategori: "Arbetsställestatus",
                    Kod: ["1"]
                }
            ],
            MaxAntal: maxResults
        };

        // Add region filter if specified
        if (region && region !== 'all') {
            searchQuery.Kategorier.push({
                Kategori: "ARegion",
                Kod: [region]
            });
        }

        // Add city filter if specified
        if (city && city !== 'all') {
            searchQuery.Kategorier.push({
                Kategori: "Kommun",
                Kod: [city]
            });
        }

        // Add employee count filter if specified
        if (employeeCount && employeeCount !== 'all') {
            searchQuery.Kategorier.push({
                Kategori: "Anställda",
                Kod: [employeeCount]
            });
        }

        const response = await makeApiRequest('/api/Ae/HamtaArbetsstallen', 'POST', searchQuery);
        
        if (response.statusCode === 200) {
            const excelData = response.data.map(restaurant => ({
                'Organisationsnummer': restaurant.OrgNr || '',
                'Företagsnamn': restaurant.Företagsnamn || '',
                'Benämning': restaurant.Benämning || '',
                'Besöksadress': restaurant.BesöksAdress || '',
                'Besökspostort': restaurant.BesöksPostOrt || '',
                'Besökspostnummer': restaurant.BesöksPostNr || '',
                'Postadress': restaurant.PostAdress || '',
                'Postort': restaurant.PostOrt || '',
                'Postnummer': restaurant.PostNr || '',
                'Kommun': restaurant.Kommun || '',
                'Län': restaurant.Län || '',
                'Storleksklass': restaurant.Storleksklass || '',
                'Bransch': restaurant.Bransch_1 || '',
                'Branschkod': restaurant['Bransch_1, kod'] || '',
                'Telefon': restaurant.Telefon || '',
                'E-post': restaurant['E-post'] || '',
                'Arbetsställestatus': restaurant.Arbetsställestatus || '',
                'Arbetsställetyp': restaurant.Arbetsställetyp || '',
                'Startdatum': restaurant.Startdatum || '',
                'Juridisk form': restaurant.Juridisk_form || ''
            }));

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            
            // Set column widths
            const columnWidths = [
                { wch: 15 }, // Organisationsnummer
                { wch: 30 }, // Företagsnamn
                { wch: 30 }, // Benämning
                { wch: 30 }, // Besöksadress
                { wch: 20 }, // Besökspostort
                { wch: 10 }, // Besökspostnummer
                { wch: 30 }, // Postadress
                { wch: 20 }, // Postort
                { wch: 10 }, // Postnummer
                { wch: 20 }, // Kommun
                { wch: 20 }, // Län
                { wch: 20 }, // Storleksklass
                { wch: 30 }, // Bransch
                { wch: 10 }, // Branschkod
                { wch: 15 }, // Telefon
                { wch: 25 }, // E-post
                { wch: 20 }, // Arbetsställestatus
                { wch: 20 }, // Arbetsställetyp
                { wch: 15 }, // Startdatum
                { wch: 20 }  // Juridisk form
            ];
            worksheet['!cols'] = columnWidths;

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Restauranger');

            // Generate filename based on filters
            let filename = 'restauranger';
            if (region && region !== 'all') {
                const regionData = await makeApiRequest('/api/ae/kategoriermedkodtabeller');
                const regions = regionData.data.find(cat => cat.Id_Kategori_AE === 'ARegion');
                const regionName = regions?.VardeLista.find(r => r.Varde === region)?.Text || region;
                filename += `_${regionName.replace(/[^a-zA-Z0-9]/g, '')}`;
            }
            if (city && city !== 'all') {
                const cityData = await makeApiRequest('/api/ae/kategoriermedkodtabeller');
                const cities = cityData.data.find(cat => cat.Id_Kategori_AE === 'Kommun');
                const cityName = cities?.VardeLista.find(c => c.Varde === city)?.Text || city;
                filename += `_${cityName.replace(/[^a-zA-Z0-9]/g, '')}`;
            }
            if (employeeCount && employeeCount !== 'all') {
                const employeeData = await makeApiRequest('/api/ae/kategoriermedkodtabeller');
                const employees = employeeData.data.find(cat => cat.Id_Kategori_AE === 'Anställda');
                const employeeName = employees?.VardeLista.find(e => e.Varde === employeeCount)?.Text || employeeCount;
                filename += `_${employeeName.replace(/[^a-zA-Z0-9]/g, '')}`;
            }
            filename += '.xlsx';

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            res.send(buffer);
        } else {
            res.status(response.statusCode).json({
                success: false,
                error: response.data
            });
        }
    } catch (error) {
        console.error('Error downloading Excel:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download Excel file'
        });
    }
});

// Get regions (counties)
app.get('/api/regions', async (req, res) => {
    try {
        const response = await makeApiRequest('/api/ae/kategoriermedkodtabeller');
        const regions = response.data.find(cat => cat.Id_Kategori_AE === 'Län');
        
        if (regions) {
            res.json(regions.VardeLista);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ error: 'Failed to fetch regions' });
    }
});

// Get municipalities
app.get('/api/municipalities', async (req, res) => {
    try {
        const response = await makeApiRequest('/api/ae/kategoriermedkodtabeller');
        const municipalities = response.data.find(cat => cat.Id_Kategori_AE === 'Kommun');
        
        if (municipalities) {
            res.json(municipalities.VardeLista);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching municipalities:', error);
        res.status(500).json({ error: 'Failed to fetch municipalities' });
    }
});

// Get SCB API help documentation
app.get('/api/help', async (req, res) => {
    try {
        const response = await makeApiRequest('/help');
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching help:', error);
        res.status(500).json({ error: 'Failed to fetch help documentation' });
    }
});

// Get SCB API example for workplaces
app.get('/api/help/exampleAe', async (req, res) => {
    try {
        const response = await makeApiRequest('/help/exampleAe');
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching example:', error);
        res.status(500).json({ error: 'Failed to fetch example' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API ID: A00364`);
    console.log(`Certificate: ${certificatePath}`);
});
