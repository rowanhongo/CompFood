// server.js - Node.js backend to handle API calls and avoid CORS issues
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3005;
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// API Routes (must come before static file serving)
app.get('/api/config/:key', (req, res) => {
    const key = req.params.key;
    const value = process.env[key] || '';
    res.json({ value });
});

// World Bank API proxy
app.get('/api/world-bank/:countryCode/indicator/:indicator', async (req, res) => {
    try {
        const { countryCode, indicator } = req.params;
        const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=1`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`World Bank API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data[1] && data[1][0] ? data[1][0] : {});
    } catch (error) {
        console.error('World Bank API error:', error);
        res.status(500).json({ error: 'Failed to fetch World Bank data' });
    }
});

// FAO API proxy
app.get('/api/fao-prices', async (req, res) => {
    try {
        const { country, commodity } = req.query;
        const url = `https://api.fao.org/food-prices/v1/prices?country=${encodeURIComponent(country)}&commodity=${encodeURIComponent(commodity)}&format=json`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`FAO API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        res.json(data.data && data.data.length > 0 ? data.data[0] : {});
    } catch (error) {
        console.error('FAO API error:', error);
        res.status(500).json({ error: 'Failed to fetch FAO data' });
    }
});

// Food prices API proxy (using World Bank and FAO)
app.get('/api/food-prices/:item', async (req, res) => {
    try {
        const { item } = req.params;
        const { continent, currency } = req.query;
        
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
                
                // FAO first for African countries
                if (country.continent === 'africa') {
                    try {
                        const faoUrl = `https://api.fao.org/food-prices/v1/prices?country=${encodeURIComponent(country.code)}&commodity=${encodeURIComponent(item)}&format=json`;
                        const faoResponse = await fetch(faoUrl);
                        if (faoResponse.ok) {
                            const faoData = await faoResponse.json();
                            if (faoData.data && faoData.data.length > 0) {
                                price = faoData.data[0].price;
                                source = 'FAO';
                            }
                        }
                    } catch (error) {
                        console.log(`FAO failed for ${country.name}:`, error);
                    }
                }
                
                // Fallback to World Bank if FAO failed or not African
                if (!price) {
                    const indicator = 'FP.CPI.TOTL'; // Consumer Price Index
                    const wbUrl = `https://api.worldbank.org/v2/country/${country.code}/indicator/${indicator}?format=json&per_page=1`;
                    
                    const wbResponse = await fetch(wbUrl);
                    if (wbResponse.ok) {
                        const wbData = await wbResponse.json();
                        
                        if (wbData[1] && wbData[1][0] && wbData[1][0].value) {
                            const priceIndex = wbData[1][0].value;
                            const basePrice = getBasePrice(item); // Server-side base price function
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
                        item: `${item.charAt(0).toUpperCase() + item.slice(1)}`,
                        source: source
                    });
                }
            } catch (error) {
                console.log(`Failed to get data for ${country.name}:`, error);
            }
        }
        
        // Apply filters
        let filteredResults = results;
        if (continent) {
            filteredResults = filteredResults.filter(item => item.continent === continent);
        }
        if (currency) {
            filteredResults = filteredResults.filter(item => item.currency === currency);
        }
        
        res.json(filteredResults);
        
    } catch (error) {
        console.error('Food prices API error:', error);
        res.status(500).json({ error: 'Failed to fetch food prices' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle favicon requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

// Chat API route
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
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
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        res.json({ response: aiResponse });
        
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({ 
            error: 'Failed to get AI response',
            fallback: getIntelligentFallback(req.body.message)
        });
    }
});

// Helper function for intelligent fallback responses
function getIntelligentFallback(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('protein')) {
        return "Great sources of protein include chicken, fish, eggs, beans, lentils, tofu, and Greek yogurt. Aim for about 0.8g per kg of body weight daily.";
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap')) {
        return "Budget-friendly foods: rice, beans, lentils, eggs, seasonal vegetables, and buying in bulk. Plan your meals and cook at home to save money!";
    }
    
    return "That's an interesting food question! I can help with nutrition, cooking tips, and food budgeting advice. What would you like to know more about?";
}

// Helper function for base price
function getBasePrice(item) {
    // Simple mapping for base prices (same as client-side, adjust as needed)
    const basePrices = {
        milk: 1.0,
        rice: 0.8,
        bread: 1.2
        // Add more items as needed
    };
    return basePrices[item.toLowerCase()] || 1.0; // Default base price
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to use the app`);
});