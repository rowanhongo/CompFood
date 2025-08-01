
// search for food prices
function searchFoodPrices() {
    const searchTerm = document.getElementById('foodSearch').value.toLowerCase().trim();
    const continentFilter = document.getElementById('continentFilter').value;
    const currencyFilter = document.getElementById('currencyFilter').value;
    
    if (!searchTerm) {
        showError('pls enter a food item');
        return;
    }

    showLoading();
    
    // Call the World Bank API function
    searchWithWorldBankAPI(searchTerm, continentFilter, currencyFilter);
}


// World Bank API function - free food price data
async function searchWithWorldBankAPI(searchTerm, continentFilter, currencyFilter) {
    const foodPrices = await getWorldBankFoodData(searchTerm);
    
    // apply filters
    let filteredResults = foodPrices;
    if (continentFilter) {
        filteredResults = filteredResults.filter(item => item.continent === continentFilter);
    }
    if (currencyFilter) {
        filteredResults = filteredResults.filter(item => item.currency === currencyFilter);
    }
    
    if (filteredResults.length === 0) {
        showError(`No food prices found for "${searchTerm}" in the selected regions.`);
    } else {
        displayResults(filteredResults, searchTerm);
    }
}

// get food data from World Bank API + FAO
async function getWorldBankFoodData(searchTerm) {
    const countries = [
        // north america
        { code: 'US', name: 'United States', currency: 'USD', continent: 'north-america' },
        { code: 'CA', name: 'Canada', currency: 'CAD', continent: 'north-america' },
        
        // europe
        { code: 'GB', name: 'United Kingdom', currency: 'GBP', continent: 'europe' },
        { code: 'FR', name: 'France', currency: 'EUR', continent: 'europe' },
        { code: 'DE', name: 'Germany', currency: 'EUR', continent: 'europe' },
        
        // asia
        { code: 'JP', name: 'Japan', currency: 'JPY', continent: 'asia' },
        { code: 'SG', name: 'Singapore', currency: 'SGD', continent: 'asia' },
        { code: 'IN', name: 'India', currency: 'INR', continent: 'asia' },
        
        // africa
        { code: 'ZA', name: 'South Africa', currency: 'ZAR', continent: 'africa' },
        { code: 'NG', name: 'Nigeria', currency: 'NGN', continent: 'africa' },
        { code: 'EG', name: 'Egypt', currency: 'EGP', continent: 'africa' },
        { code: 'KE', name: 'Kenya', currency: 'KES', continent: 'africa' },
        { code: 'GH', name: 'Ghana', currency: 'GHS', continent: 'africa' },
        { code: 'ET', name: 'Ethiopia', currency: 'ETB', continent: 'africa' },
        
        // oceania
        { code: 'AU', name: 'Australia', currency: 'AUD', continent: 'oceania' }
    ];
    
    const results = [];
    
    for (const country of countries) {
        try {
            let price = null;
            let source = '';
            
            //  FAO first for african countries
            if (country.continent === 'africa') {
                try {
                    const faoData = await getFAOFoodData(country.code, searchTerm);
                    if (faoData) {
                        price = faoData.price;
                        source = 'FAO';
                    }
                } catch (error) {
                    console.log(`FAO failed for ${country.name}:`, error);
                }
            }
            
            // fallback to World Bank if FAO failed or not african
            if (!price) {
                const indicator = 'FP.CPI.TOTL'; // Consumer Price Index
                const url = `${API_CONFIG.WORLD_BANK_API}/${country.code}/indicator/${indicator}?format=json&per_page=1`;
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data[1] && data[1][0] && data[1][0].value) {
                        const priceIndex = data[1][0].value;
                        // convert index to realistic price
                        const basePrice = getBasePrice(searchTerm);
                        price = (basePrice * priceIndex / 100).toFixed(2);
                        source = 'World Bank';
                    }
                }
            }
            
            if (price) {
                results.push({
                    country: country.name,
                    price: price,
                    currency: country.currency,
                    continent: country.continent,
                    item: `${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)}`,
                    source: source
                });
            }
        } catch (error) {
            console.log(`failed to get data for ${country.name}:`, error);
        }
    }
    
    return results;
}




// get FAO food data for african countries
async function getFAOFoodData(countryCode, searchTerm) {
    try {
        // FAO API endpoint for food prices
        const url = `${API_CONFIG.FAO_API}/prices?country=${countryCode}&commodity=${searchTerm}&format=json`;
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            
            // extract price from FAO data
            if (data.data && data.data.length > 0) {
                const latestPrice = data.data[0];
                return {
                    price: latestPrice.price,
                    currency: latestPrice.currency || 'USD'
                };
            }
        }
    } catch (error) {
        console.log('FAO API error:', error);
    }
    
   
}

function showLoading() {
    document.getElementById('resultsContainer').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Searching for food prices worldwide...</p>
        </div>
    `;
}

function showError(message) {
    document.getElementById('resultsContainer').innerHTML = `
        <div class="error">
            <strong>Error:</strong> ${message}
        </div>
    `;
}

function displayResults(data, searchTerm) {
    if (!data || data.length === 0) {
        document.getElementById('resultsContainer').innerHTML = `
            <div class="error">
                <strong>No results found</strong> for "${searchTerm}". Try a different food item or adjust your filters.
            </div>
        `;
        return;
    }

    const tableHTML = `
        <h3>Global Prices for "${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)}" (${data.length} countries)</h3>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Country</th>
                    <th>Price</th>
                    <th>Currency</th>
                    <th>Continent</th>
                    <th>Source</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(item => `
                    <tr>
                        <td><strong>${item.country}</strong></td>
                        <td>${item.price}</td>
                        <td>${item.currency}</td>
                        <td style="text-transform: capitalize;">${item.continent.replace('-', ' ')}</td>
                        <td><small>${item.source || 'N/A'}</small></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('resultsContainer').innerHTML = tableHTML;
}

// chat function
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Add loading message
    const loadingId = 'loading-' + Date.now();
    addMessage('Thinking...', 'ai', loadingId);
    
    try {
        // Use real Gemini API
        const response = await callGeminiAPI(message);
        
        // Remove loading message and add actual response
        document.getElementById(loadingId).remove();
        addMessage(response, 'ai');
    } catch (error) {
        console.error('Chat error:', error);
        document.getElementById(loadingId).remove();
        const fallbackResponse = getIntelligentResponse(message);
        addMessage(fallbackResponse, 'ai');
    }
}
  
    // Default responses for general questions
    const generalResponses = [
        "That's an interesting food question! I'm not sure I can answer that, but I can help you find food prices in different countries."
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];


// gemini api call
async function callGeminiAPI(message) {
    try {
        const apiKey = await getApiKey('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('gemini key missing');
        }
        
        const apiUrl = `${API_CONFIG.GEMINI_API_URL}?key=${apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: `You are a helpful food assistant. Answer questions about food, nutrition, cooking, and food prices. Keep responses concise and friendly. User question: ${message}`
                }]
            }]
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
        
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error; // Let the calling function handle the fallback
    }
}

function addMessage(message, sender, id = null) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (id) {
        messageDiv.id = id;
    }
    
    messageDiv.innerHTML = `<strong>${sender === 'user' ? 'You' : 'AI'}:</strong> ${message}`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// get api keys from server
async function getApiKey(keyName) {
    try {
        const response = await fetch(`/api/config/${keyName}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.value || '';
    } catch (error) {
        console.error(`Failed to get API key ${keyName}:`, error);
        return '';
    }
}

// check if dev mode
function isDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}


// API config 
const API_CONFIG = {
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    WORLD_BANK_API: 'https://api.worldbank.org/v2/country',
    FAO_API: 'https://api.fao.org/food-prices/v1',
    FOOD_PRICES_API_URL: 'https://world-food-prices-api.rapidapi.com/search' // backup
};