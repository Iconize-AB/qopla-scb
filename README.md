# SCB Restaurant Finder

A web application for finding restaurants in Sweden using the Swedish Central Bureau of Statistics (SCB) General Business Register API.

## Features

- **Web Interface**: Modern, responsive web application for searching restaurants
- **Geographic Filtering**: Search by Swedish counties (Län)
- **Size Filtering**: Filter by employee count ranges
- **Real-time Results**: Live search results with detailed restaurant information
- **Certificate Authentication**: Secure API access using SCB certificate

## Prerequisites

1. **Certificate**: You should have the certificate file `Certifikat_SokPaVar_A00364_2025-08-28 10-43-58Z.pfx` in this directory
2. **Password**: You need the certificate password (sent separately via email)
3. **Node.js**: Version 14 or higher

## Setup

1. **Set the certificate password in the .env file**:
   ```bash
   echo "SCB_CERT_PASSWORD=your_certificate_password_here" > .env
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify the certificate is in place**:
   ```bash
   ls -la Certifikat_SokPaVar_A00364_2025-08-28\ 10-43-58Z.pfx
   ```

## Usage

### Start the web application
```bash
npm start
```

The application will be available at: http://localhost:3000

### Development mode (with auto-reload)
```bash
npm run dev
```

### Run API tests
```bash
npm test
```

## How to Use the Web Interface

1. **Open the application** in your browser at http://localhost:3000

2. **Select search criteria**:
   - **Region**: Choose a specific Swedish county or "All Regions"
   - **Employee Count**: Filter by business size (e.g., "1-4 anställda", "5-9 anställda")
   - **Max Results**: Set the maximum number of results (1-2000)

3. **Click "Search Restaurants"** to find matching restaurants

4. **View results**:
   - Restaurant name and address
   - Employee count
   - Region and legal form
   - Organization number

## API Information

- **API ID**: A00364 (extracted from certificate filename)
- **Base URL**: https://privateapi.scb.se/nv0101/v1/sokpavar
- **Authentication**: Certificate-based (PFX file)
- **Max rows per request**: 2,000

## Restaurant Categories Included

The application searches for businesses with these SNI (Swedish Standard Industrial Classification) codes:
- **5610**: Restaurants and mobile food service activities
- **5621**: Event catering activities
- **5629**: Other food service activities
- **5630**: Beverage serving activities

## Technical Details

### Backend (Node.js/Express)
- `server.js`: Main Express server with API endpoints
- Certificate-based authentication with SCB API
- RESTful API endpoints for searching and data retrieval

### Frontend (HTML/CSS/JavaScript)
- Modern, responsive design with Bootstrap 5
- Real-time search with loading states
- Interactive restaurant cards with detailed information
- Error handling and user feedback

### API Endpoints
- `GET /api/regions`: Get available Swedish counties
- `GET /api/employee-counts`: Get employee count categories
- `POST /api/search-restaurants`: Search for restaurants with filters

## Troubleshooting

### Certificate not found
Make sure the certificate file is in the same directory as the server.js file.

### Password not set
Ensure the `SCB_CERT_PASSWORD` is correctly set in the `.env` file.

### Connection errors
- Check your internet connection
- Verify the certificate is valid and not expired
- Ensure the certificate password is correct

### HTTP 503 errors
This indicates the SCB API service is temporarily unavailable due to maintenance.

## File Structure

```
├── server.js              # Express server
├── scb-api-test.js        # API testing script
├── package.json           # Node.js dependencies
├── .env                   # Environment variables (password)
├── .gitignore            # Git ignore rules
├── public/               # Frontend files
│   ├── index.html        # Main web interface
│   └── app.js           # Frontend JavaScript
└── Certifikat_SokPaVar_*.pfx  # SCB certificate
```

## Next Steps

After successful setup, you can:
1. **Search for restaurants** in specific regions
2. **Filter by business size** to find small or large establishments
3. **Export results** (feature can be added)
4. **Add more filters** (business type, legal form, etc.)
5. **Integrate with other services** (maps, reviews, etc.)

## Alternative tools

- **Postman**: For direct API testing
- **cURL**: Command-line API testing
- **Other HTTP clients**: Any tool that supports client certificate authentication
