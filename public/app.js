// Global variables
let regions = [];
let cities = [];
let employeeCounts = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadRegions();
    loadCities();
    loadEmployeeCounts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', handleSearch);
    
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    downloadExcelBtn.addEventListener('click', handleExcelDownload);
}

// Load regions from API
async function loadRegions() {
    try {
        const response = await fetch('/api/regions');
        if (!response.ok) throw new Error('Failed to load regions');
        
        regions = await response.json();
        populateRegionSelect(regions);
    } catch (error) {
        console.error('Error loading regions:', error);
        showError('Failed to load regions. Please refresh the page.');
    }
}

// Load cities from API
async function loadCities() {
    try {
        const response = await fetch('/api/municipalities');
        if (!response.ok) throw new Error('Failed to load cities');
        
        cities = await response.json();
        populateCitySelect(cities);
    } catch (error) {
        console.error('Error loading cities:', error);
        showError('Failed to load cities. Please refresh the page.');
    }
}

// Load employee counts from API
async function loadEmployeeCounts() {
    try {
        const response = await fetch('/api/employee-counts');
        if (!response.ok) throw new Error('Failed to load employee counts');
        
        employeeCounts = await response.json();
        populateEmployeeCountSelect(employeeCounts);
    } catch (error) {
        console.error('Error loading employee counts:', error);
        showError('Failed to load employee counts. Please refresh the page.');
    }
}

// Populate region select dropdown
function populateRegionSelect(regions) {
    const select = document.getElementById('region');
    
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region.Varde;
        option.textContent = region.Text;
        select.appendChild(option);
    });
}

// Populate city select dropdown
function populateCitySelect(cities) {
    const citySelect = document.getElementById('city');
    citySelect.innerHTML = '<option value="all">All Cities</option>';
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.Varde;
        option.textContent = city.Text;
        citySelect.appendChild(option);
    });
}

// Populate employee count select dropdown
function populateEmployeeCountSelect(employeeCounts) {
    const employeeCountSelect = document.getElementById('employeeCount');
    employeeCountSelect.innerHTML = '<option value="all">All Sizes</option>';
    
    employeeCounts.forEach(count => {
        const option = document.createElement('option');
        option.value = count.Varde;
        option.textContent = count.Text;
        employeeCountSelect.appendChild(option);
    });
}

// Handle search form submission
async function handleSearch(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const searchData = {
        region: formData.get('region'),
        city: formData.get('city'),
        employeeCount: formData.get('employeeCount'),
        maxResults: parseInt(formData.get('maxResults')) || 100
    };
    
    // Show loading state
    showLoading(true);
    hideError();
    hideResults();
    
    try {
        const response = await fetch('/api/search-restaurants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayResults(result.data, searchData);
        } else {
            showError(result.error || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('Network error. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display search results
function displayResults(restaurants, searchData) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsList = document.getElementById('resultsList');
    const statsCard = document.getElementById('statsCard');
    
    // Store current restaurants globally for details function
    window.currentRestaurants = restaurants;
    
    // Update stats
    document.getElementById('totalResults').textContent = restaurants.length;
    document.getElementById('selectedRegion').textContent = 
        searchData.region === 'all' ? 'All' : 
        regions.find(r => r.Varde === searchData.region)?.Text || searchData.region;
    document.getElementById('selectedCity').textContent = 
        searchData.city === 'all' ? 'All' : 
        cities.find(c => c.Varde === searchData.city)?.Text || searchData.city;
    document.getElementById('selectedSize').textContent = 
        searchData.employeeCount === 'all' ? 'All' : 
        employeeCounts.find(e => e.Varde === searchData.employeeCount)?.Text || searchData.employeeCount;
    
    // Clear previous results
    resultsList.innerHTML = '';
    
    if (restaurants.length === 0) {
        resultsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    No restaurants found matching your criteria.
                </div>
            </div>
        `;
        // Hide Excel button if no results
        document.getElementById('downloadExcelBtn').style.display = 'none';
    } else {
        // Store current search data for Excel download
        window.currentSearchData = searchData;
        
        // Show Excel download button
        document.getElementById('downloadExcelBtn').style.display = 'inline-block';
        
        // Display restaurants
        restaurants.forEach(restaurant => {
            const restaurantCard = createRestaurantCard(restaurant);
            resultsList.appendChild(restaurantCard);
        });
    }
    
    // Show results
    statsCard.style.display = 'block';
    resultsContainer.style.display = 'block';
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Create restaurant card
function createRestaurantCard(restaurant) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    // Extract restaurant information from SCB API response
    const name = restaurant.Företagsnamn || restaurant.Benämning || 'Unknown Name';
    const businessName = restaurant.Benämning || '';
    const address = restaurant.BesöksAdress || restaurant.PostAdress || 'Address not available';
    const city = restaurant.BesöksPostOrt || restaurant.PostOrt || '';
    const postalCode = restaurant.BesöksPostNr || restaurant.PostNr || '';
    const employees = restaurant.Storleksklass || 'Unknown';
    const region = restaurant.Län || 'Unknown';
    const businessCode = restaurant.Bransch_1 || '';
    const businessCodeValue = restaurant['Bransch_1, kod'] || '';
    const orgNumber = restaurant.OrgNr || 'N/A';
    const phone = restaurant.Telefon || '';
    const email = restaurant['E-post'] || '';
    const status = restaurant.Arbetsställestatus || '';
    const municipality = restaurant.Kommun || '';
    
    // Get employee count text
    const employeeText = employeeCounts.find(e => e.Varde === employees)?.Text || employees;
    
    // Get region text
    const regionText = regions.find(r => r.Varde === region)?.Text || region;
    
    // Create contact info section
    let contactInfo = '';
    if (phone || email) {
        contactInfo = `
            <div class="mb-2">
                <i class="fas fa-phone text-muted me-2"></i>
                <small class="text-muted">${phone || 'No phone'}</small>
            </div>
            <div class="mb-2">
                <i class="fas fa-envelope text-muted me-2"></i>
                <small class="text-muted">${email || 'No email'}</small>
            </div>
        `;
    }
    
    col.innerHTML = `
        <div class="restaurant-card p-3 h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0 text-primary">
                    <i class="fas fa-utensils me-2"></i>${name}
                </h5>
                <span class="badge bg-success">${employeeText}</span>
            </div>
            
            ${businessName ? `
                <div class="mb-2">
                    <i class="fas fa-store text-muted me-2"></i>
                    <small class="text-muted fst-italic">${businessName}</small>
                </div>
            ` : ''}
            
            <div class="card-body p-0">
                <div class="mb-2">
                    <i class="fas fa-map-marker-alt text-muted me-2"></i>
                    <small class="text-muted">
                        ${address}<br>
                        ${postalCode} ${city}
                    </small>
                </div>
                
                <div class="mb-2">
                    <i class="fas fa-building text-muted me-2"></i>
                    <small class="text-muted">${municipality}, ${regionText}</small>
                </div>
                
                <div class="mb-2">
                    <i class="fas fa-tag text-muted me-2"></i>
                    <small class="text-muted">${businessCode} (${businessCodeValue})</small>
                </div>
                
                <div class="mb-2">
                    <i class="fas fa-check-circle text-muted me-2"></i>
                    <small class="text-muted">${status}</small>
                </div>
                
                ${contactInfo}
                
                <hr class="my-2">
                
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="fas fa-id-card me-1"></i>
                        Org: ${orgNumber}
                    </small>
                    <button class="btn btn-sm btn-outline-primary" onclick="showRestaurantDetails('${orgNumber}')">
                        <i class="fas fa-info-circle me-1"></i>Details
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Show restaurant details
function showRestaurantDetails(orgNumber) {
    // Find the restaurant data
    const restaurant = window.currentRestaurants?.find(r => r.OrgNr === orgNumber);
    
    if (!restaurant) {
        alert(`Restaurant details for organization number: ${orgNumber}\n\nThis feature can be expanded to show more detailed information about the restaurant.`);
        return;
    }
    
    // Create detailed information
    const details = `
Restaurant Details

Company Name: ${restaurant.Företagsnamn || 'N/A'}
Business Name: ${restaurant.Benämning || 'N/A'}
Organization Number: ${restaurant.OrgNr || 'N/A'}

Address Information:
- Visit Address: ${restaurant.BesöksAdress || 'N/A'}
- Visit City: ${restaurant.BesöksPostOrt || 'N/A'}
- Visit Postal Code: ${restaurant.BesöksPostNr || 'N/A'}
- Mail Address: ${restaurant.PostAdress || 'N/A'}
- Mail City: ${restaurant.PostOrt || 'N/A'}
- Mail Postal Code: ${restaurant.PostNr || 'N/A'}

Location:
- Municipality: ${restaurant.Kommun || 'N/A'}
- County: ${restaurant.Län || 'N/A'}
- Region: ${restaurant.ARegion || 'N/A'}

Business Information:
- Business Code: ${restaurant['Bransch_1, kod'] || 'N/A'} - ${restaurant.Bransch_1 || 'N/A'}
- Employee Count: ${restaurant.Storleksklass || 'N/A'}
- Status: ${restaurant.Arbetsställestatus || 'N/A'}
- Workplace Type: ${restaurant.Arbetsställetyp || 'N/A'}

Contact Information:
- Phone: ${restaurant.Telefon || 'N/A'}
- Email: ${restaurant['E-post'] || 'N/A'}

Additional Information:
- Start Date: ${restaurant.Startdatum || 'N/A'}
- End Date: ${restaurant.Slutdatum || 'N/A'}
- Advertising: ${restaurant.Reklam || 'N/A'}
- Mail OK: ${restaurant.Utskick || 'N/A'}
    `;
    
    alert(details);
}

// Show loading spinner
function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

// Show error message
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorAlert.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide error message
function hideError() {
    const errorAlert = document.getElementById('errorAlert');
    errorAlert.style.display = 'none';
}

// Hide results
function hideResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const statsCard = document.getElementById('statsCard');
    
    resultsContainer.style.display = 'none';
    statsCard.style.display = 'none';
}

// Handle Excel download
async function handleExcelDownload() {
    try {
        if (!window.currentSearchData) {
            showError('No search data available. Please perform a search first.');
            return;
        }

        // Show loading state for download
        const downloadBtn = document.getElementById('downloadExcelBtn');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Downloading...';
        downloadBtn.disabled = true;

        // Prepare download data
        const downloadData = {
            region: window.currentSearchData.region,
            city: window.currentSearchData.city,
            employeeCount: window.currentSearchData.employeeCount,
            maxResults: 2000 // Get maximum results for Excel
        };

        // Make download request
        const response = await fetch('/api/download-excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(downloadData)
        });

        if (!response.ok) {
            throw new Error('Failed to download Excel file');
        }

        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'restauranger.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Show success message
        showSuccess('Excel file downloaded successfully!');

    } catch (error) {
        console.error('Error downloading Excel:', error);
        showError('Failed to download Excel file. Please try again.');
    } finally {
        // Reset button state
        const downloadBtn = document.getElementById('downloadExcelBtn');
        downloadBtn.innerHTML = '<i class="fas fa-file-excel me-2"></i>Download to Excel';
        downloadBtn.disabled = false;
    }
}

// Show success message
function showSuccess(message) {
    // Create success alert
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success alert-dismissible fade show';
    successAlert.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.main-container');
    container.insertBefore(successAlert, container.firstChild);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (successAlert.parentNode) {
            successAlert.remove();
        }
    }, 3000);
}
