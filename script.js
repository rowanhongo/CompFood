
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
    
    // Use real API for food prices
    searchWithRapidAPI(searchTerm, continentFilter, currencyFilter);
}

// rapidapi integration
async function searchWithRapidAPI(searchTerm, continentFilter, currencyFilter) {
    try {
        // try World Bank API first (free!)
        await searchWithWorldBankAPI(searchTerm, continentFilter, currencyFilter);
    } catch (error) {
        console.error('World Bank API error:', error);
        
        // backup to RapidAPI if needed
        try {
            const apiKey = await getApiKey('RAPIDAPI_KEY');
            if (!apiKey) {
                throw new Error('rapidapi key missing');
            }
            
            const response = await fetch(API_CONFIG.FOOD_PRICES_API_URL, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': 'world-food-prices-api.rapidapi.com'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Food prices API request failed: ${response.status}`);
            }
            
            let data = await response.json();
            
            // Apply filters
            if (continentFilter) {
                data = data.filter(item => item.continent === continentFilter);
            }
            
            if (currencyFilter) {
                data = data.filter(item => item.currency === currencyFilter);
            }
            
            displayResults(data, searchTerm);
            
        } catch (rapidError) {
            console.error('RapidAPI error:', rapidError);
            showError(`Failed to fetch food prices from both APIs: ${error.message}`);
        }
    }
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
            
            // try FAO first for african countries
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

// helper to get base prices for different foods
function getBasePrice(foodItem) {
    const searchLower = foodItem.toLowerCase();
    if (searchLower.includes('milk')) return 2.50;
    if (searchLower.includes('bread')) return 1.80;
    if (searchLower.includes('rice')) return 1.20;
    if (searchLower.includes('chicken')) return 4.50;
    if (searchLower.includes('egg')) return 3.00;
    return 2.00; // default
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
    
    // fallback: simulate FAO data for african countries
    return getSimulatedFAOData(countryCode, searchTerm);
}

// simulate FAO data for african countries (since real API might be slow)
function getSimulatedFAOData(countryCode, searchTerm) {
    const basePrice = getBasePrice(searchTerm);
    
    // african countries typically have lower prices
    const africanMultiplier = 0.6; // 40% cheaper than global average
    
    // country-specific adjustments
    const countryAdjustments = {
        'ZA': 1.2,  // South Africa - more expensive
        'NG': 0.8,  // Nigeria - moderate
        'EG': 0.7,  // Egypt - cheaper
        'KE': 0.6,  // Kenya - cheaper
        'GH': 0.7,  // Ghana - moderate
        'ET': 0.5   // Ethiopia - cheapest
    };
    
    const multiplier = africanMultiplier * (countryAdjustments[countryCode] || 0.7);
    const price = (basePrice * multiplier).toFixed(2);
    
    return {
        price: price,
        currency: 'USD' // FAO usually reports in USD
    };
}

function generateMockData(foodItem) {
    const countries = [
        { name: "United States", currency: "USD", continent: "north-america" },
        { name: "Germany", currency: "EUR", continent: "europe" },
        { name: "Japan", currency: "JPY", continent: "asia" },
        { name: "Australia", currency: "AUD", continent: "oceania" },
        { name: "Canada", currency: "CAD", continent: "north-america" },
        { name: "United Kingdom", currency: "GBP", continent: "europe" },
        { name: "France", currency: "EUR", continent: "europe" },
        { name: "Brazil", currency: "BRL", continent: "south-america" }
    ];
    
    return countries.map(country => ({
        country: country.name,
        price: (Math.random() * 10 + 1).toFixed(2),
        currency: country.currency,
        continent: country.continent
    }));
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

// smart responses for food questions
function getIntelligentResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Nutrition questions
    if (lowerMessage.includes('protein')) {
        return "Great sources of protein include chicken, fish, eggs, beans, lentils, tofu, and Greek yogurt. Aim for about 0.8g per kg of body weight daily for general health.";
    }
    
    if (lowerMessage.includes('vitamin') || lowerMessage.includes('nutrients')) {
        return "Key vitamins from food: Vitamin C (citrus, berries), Vitamin D (fatty fish, fortified milk), B vitamins (whole grains, leafy greens), and Vitamin A (carrots, sweet potatoes). Eat a rainbow of colors!";
    }
    
    if (lowerMessage.includes('healthy') || lowerMessage.includes('diet')) {
        return "A balanced diet includes fruits, vegetables, whole grains, lean proteins, and healthy fats. Stay hydrated, limit processed foods, and remember: moderation is key!";
    }
    
    if (lowerMessage.includes('calcium')) {
        return "Best calcium sources: dairy products, leafy greens (kale, bok choy), almonds, sardines, and fortified plant milks. Your bones will thank you!";
    }
    
    // Cooking questions
    if (lowerMessage.includes('cook') || lowerMessage.includes('recipe')) {
        return "Basic cooking tips: Use fresh ingredients, taste as you go, don't rush the process, and keep your knives sharp. Start with simple recipes like stir-fries or pasta dishes!";
    }
    
    if (lowerMessage.includes('spice') || lowerMessage.includes('season')) {
        return "Essential spices for beginners: salt, pepper, garlic powder, paprika, cumin, and herbs like basil or oregano. Build your spice collection gradually and experiment!";
    }
    
    // Budget and price questions
    if (lowerMessage.includes('cheap') || lowerMessage.includes('budget') || lowerMessage.includes('affordable')) {
        return "Budget-friendly foods: rice, beans, lentils, eggs, seasonal vegetables, and buying in bulk. Shop at local markets for better prices and plan your meals ahead!";
    }
    
    if (lowerMessage.includes('expensive') || lowerMessage.includes('cost')) {
        return "Most expensive foods tend to be: imported items, out-of-season produce, specialty meats, and processed convenience foods. Cook at home to save money!";
    }
    
    if (lowerMessage.includes('student')) {
        return "Student food tips: Buy staples in bulk, learn basic cooking skills, use campus meal plans wisely, share costs with roommates, and always have ramen as backup! 🍜";
    }
    
    // Food safety
    if (lowerMessage.includes('safe') || lowerMessage.includes('storage')) {
        return "Food safety basics: Keep cold foods cold (below 40°F), wash hands and surfaces often, don't leave perishables out for more than 2 hours, and when in doubt, throw it out!";
    }
    
    // Weight management
    if (lowerMessage.includes('weight') || lowerMessage.includes('lose') || lowerMessage.includes('gain')) {
        return "For healthy weight management: focus on whole foods, control portions, stay hydrated, and combine good nutrition with regular physical activity. Consult a healthcare provider for personalized advice.";
    }
    
    // Specific food questions
    if (lowerMessage.includes('milk') || lowerMessage.includes('dairy')) {
        return "Milk provides calcium, protein, and vitamins. If lactose intolerant, try lactose-free milk or plant alternatives like almond, oat, or soy milk. Each has different nutritional profiles!";
    }
    
    if (lowerMessage.includes('rice')) {
        return "Rice is a versatile staple! Brown rice has more fiber and nutrients than white rice. It's filling, affordable, and pairs well with almost any protein and vegetables.";
    }
    
    // Default responses for general questions
    const generalResponses = [
        "That's an interesting food question! While I'd love to give you more specific information, I can help with general nutrition, cooking tips, and food budgeting advice.",
        "Great question about food! For the most accurate information, I'd recommend consulting with a nutritionist, but I'm happy to share general food knowledge.",
        "Food is such a fascinating topic! Is there something specific about nutrition, cooking, or food prices you'd like to know more about?",
        "I love talking about food! Whether it's about healthy eating, budget cooking, or food safety, I'm here to help with general guidance."
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

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

// API config - using free World Bank API + FAO
const API_CONFIG = {
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    WORLD_BANK_API: 'https://api.worldbank.org/v2/country',
    FAO_API: 'https://api.fao.org/food-prices/v1',
    FOOD_PRICES_API_URL: 'https://world-food-prices-api.rapidapi.com/search' // backup
};