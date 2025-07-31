// server.js - Node.js backend to handle API calls and avoid CORS issues
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes (must come before static file serving)
app.get('/api/config/:key', (req, res) => {
    const key = req.params.key;
    const value = process.env[key] || '';
    res.json({ value });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle favicon requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

// Serve static files from current directory (after API routes)
app.use(express.static('.'));

// API Routes
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

app.get('/api/food-prices/:item', async (req, res) => {
    try {
        const { item } = req.params;
        const { continent, currency } = req.query;
        
        // Replace this with actual RapidAPI call
        const response = await fetch('https://world-food-prices-api.rapidapi.com/search', {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'world-food-prices-api.rapidapi.com'
            }
        });
        
        if (!response.ok) {
            throw new Error('Food prices API request failed');
        }
        
        let data = await response.json();
        
        // Apply filters
        if (continent) {
            data = data.filter(item => item.continent === continent);
        }
        
        if (currency) {
            data = data.filter(item => item.currency === currency);
        }
        
        res.json(data);
        
    } catch (error) {
        console.error('Food prices API error:', error);
        
        // Return sample data as fallback
        const sampleData = getSampleFoodData(req.params.item);
        res.json(sampleData);
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

// Helper function for sample food data
function getSampleFoodData(item) {
    const sampleData = {
        milk: [
            { country: "United States", price: 3.50, currency: "USD", continent: "north-america" },
            { country: "Germany", price: 1.20, currency: "EUR", continent: "europe" },
            { country: "Japan", price: 200, currency: "JPY", continent: "asia" },
        ],
        rice: [
            { country: "Thailand", price: 1.20, currency: "USD", continent: "asia" },
            { country: "India", price: 0.80, currency: "USD", continent: "asia" },
            { country: "United States", price: 2.50, currency: "USD", continent: "north-america" },
        ]
    };
    
    return sampleData[item] || [
        { country: "Sample Country", price: 5.00, currency: "USD", continent: "north-america" }
    ];
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to use the app`);
});