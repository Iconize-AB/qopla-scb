// Global variables
let cities = [];
let employeeCounts = [];
let branchCodes = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadCities();
    loadEmployeeCounts();
    loadBranchCodes();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', handleSearch);
    
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    downloadExcelBtn.addEventListener('click', handleExcelDownload);
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

// Load branch codes from API
async function loadBranchCodes() {
    try {
        const response = await fetch('/api/branch-codes');
        if (!response.ok) throw new Error('Failed to load branch codes');
        
        branchCodes = await response.json();
        populateBranchCodesSelect(branchCodes);
    } catch (error) {
        console.error('Error loading branch codes:', error);
        showError('Failed to load branch codes. Please refresh the page.');
    }
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

// Populate branch codes select dropdown
function populateBranchCodesSelect(branchCodes) {
    const branchCodesSelect = document.getElementById('branchCodes');
    branchCodesSelect.innerHTML = '<option value="all" selected>All Branch Codes</option>';
    
    branchCodes.forEach(code => {
        const option = document.createElement('option');
        option.value = code.Varde;
        option.textContent = `${code.Varde} - ${code.Text}`;
        branchCodesSelect.appendChild(option);
    });
}

// Handle search form submission
async function handleSearch(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Get selected branch codes
    const branchCodesSelect = document.getElementById('branchCodes');
    const selectedBranchCodes = Array.from(branchCodesSelect.selectedOptions)
        .map(option => option.value)
        .filter(value => value !== 'all');
    
    const searchData = {
        city: formData.get('city'),
        employeeCount: formData.get('employeeCount'),
        branchCodes: selectedBranchCodes,
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
    window.currentSearchData = searchData;
    
    // Update stats
    document.getElementById('totalResults').textContent = restaurants.length;
    document.getElementById('selectedCity').textContent = 
        searchData.city === 'all' ? 'All' : 
        cities.find(c => c.Varde === searchData.city)?.Text || searchData.city;
    document.getElementById('selectedSize').textContent = 
        searchData.employeeCount === 'all' ? 'All' : 
        employeeCounts.find(e => e.Varde === searchData.employeeCount)?.Text || searchData.employeeCount;
    
    // Update branch codes display
    if (searchData.branchCodes && searchData.branchCodes.length > 0) {
        const branchCodeTexts = searchData.branchCodes.map(code => {
            const branchCode = branchCodes.find(b => b.Varde === code);
            return branchCode ? `${code} - ${branchCode.Text}` : code;
        });
        document.getElementById('selectedBranchCodes').textContent = branchCodeTexts.join(', ');
    } else {
        document.getElementById('selectedBranchCodes').textContent = 'All';
    }
    
    // Clear previous results
    resultsList.innerHTML = '';
    
    if (restaurants.length === 0) {
        resultsList.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-info-circle" style="font-size: 3rem; color: var(--qopla-light-gray); margin-bottom: 1rem;"></i>
                <h4 style="color: var(--qopla-dark-gray);">No restaurants found</h4>
                <p style="color: var(--qopla-light-gray);">No restaurants found matching your criteria.</p>
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
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    
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
    
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-3">
            <h4 class="restaurant-title">
                <i class="fas fa-utensils me-2"></i>${name}
            </h4>
            <span class="badge">${employeeText}</span>
        </div>
        
        ${businessName ? `
            <div class="mb-3">
                <div class="detail-item">
                    <div class="detail-label">Business Name</div>
                    <div class="detail-value">${businessName}</div>
                </div>
            </div>
        ` : ''}
        
        <div class="restaurant-details">
            <div class="detail-item">
                <div class="detail-label">Address</div>
                <div class="detail-value">${address}<br>${postalCode} ${city}</div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">Location</div>
                <div class="detail-value">${municipality}</div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">Business Code</div>
                <div class="detail-value">${businessCode} (${businessCodeValue})</div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">${status}</div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">${phone || 'Not available'}</div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${email || 'Not available'}</div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">Organization Number</div>
                <div class="detail-value">${orgNumber}</div>
            </div>
        </div>
        
        <div class="mt-3">
            <button class="btn btn-primary btn-sm" onclick="showRestaurantDetails('${orgNumber}')">
                <i class="fas fa-info-circle me-1"></i>View Details
            </button>
        </div>
    `;
    
    return card;
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

        // Get selected branch codes
        const branchCodesSelect = document.getElementById('branchCodes');
        const selectedBranchCodes = Array.from(branchCodesSelect.selectedOptions)
            .map(option => option.value)
            .filter(value => value !== 'all');
        
        // Prepare download data
        const downloadData = {
            city: window.currentSearchData.city,
            employeeCount: window.currentSearchData.employeeCount,
            branchCodes: selectedBranchCodes,
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
