# Comp Food - Global Food Price Comparison App

A web application for comparing food prices globally, perfect for students studying abroad. Built with Node.js, Express, and free APIs.

## Features

**Global Food Price Comparison** - Compare food prices across different countries
**AI Food Assistant** - Chat with AI about nutrition, cooking, and food tips
**Real Data Sources** - Uses World Bank and FAO APIs for accurate prices
**Student-Focused** - Designed for students planning study abroad budgets
 **Free APIs** - No paid subscriptions required

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

## Installation

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd CompFood
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Create .env file
touch .env
```

Add your API keys to the `.env` file:

```env
# API Keys for Comp Food App

# Get your Gemini API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Get your RapidAPI key from: https://rapidapi.com/
# (Optional - app works without this using free World Bank API)
RAPIDAPI_KEY=your_rapidapi_key_here
```

### Step 4: Get Your API Keys

#### Gemini AI API (Required for Chat Feature)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Paste it in your `.env` file as `GEMINI_API_KEY`

#### RapidAPI (Optional - Backup Food Prices)
1. Go to [RapidAPI](https://rapidapi.com/)
2. Sign up for a free account
3. Subscribe to any food prices API (e.g., "World Food Prices API")
4. Copy your API key
5. Paste it in your `.env` file as `RAPIDAPI_KEY`

**Note:** The app works perfectly with just the Gemini API key. The RapidAPI is only used as a backup if the free World Bank API is slow.

### Step 5: Start the Server

```bash
npm start
```

Or run directly with Node:
```bash
node server.js
```

### Step 6: Access the Application

Open your browser and go to:
```
http://localhost:3001
```

## How It Works

### Free APIs Used

1. **World Bank Data API** (FREE - No API key needed)
   - Provides Consumer Price Index data for food prices
   - Covers 15+ countries including African nations
   - 1000 requests per hour limit

2. **FAO (Food and Agriculture Organization)** (FREE - No API key needed)
   - UN organization data for developing countries
   - Specialized in African and developing nation food prices
   - Real data from local markets

3. **Google Gemini AI** (FREE tier available)
   - Powers the chat assistant
   - Provides nutrition and cooking advice
   - Free tier includes generous usage limits

### Supported Countries

- **North America:** United States, Canada
- **Europe:** United Kingdom, France, Germany
- **Asia:** Japan, Singapore, India
- **Africa:** South Africa, Nigeria, Egypt, Kenya, Ghana, Ethiopia
- **Oceania:** Australia

## Usage

1. **Search Food Prices:**
   - Enter a food item (e.g., "milk", "rice", "bread")
   - Click "Search Prices"
   - View prices across different countries
   - Filter by continent or currency

2. **Chat with AI Assistant:**
   - Ask questions about nutrition, cooking, or food
   - Get personalized advice and tips
   - Perfect for meal planning and budgeting

3. **Filter Results:**
   - Use continent filter to focus on specific regions
   - Use currency filter to compare in your preferred currency

## File Structure

```
CompFood/
├── .env                    # Your API keys (create this)
├── server.js              # Node.js backend server
├── index.html             # Main HTML file
├── script.js              # Frontend JavaScript
├── styles.css             # CSS styles
├── config.js              # Frontend configuration
├── package.json           # Node.js dependencies
└── node_modules/          # Installed packages
```

## Troubleshooting

### Port Already in Use
If you get "address already in use" error:
```bash
# Change port in server.js
const PORT = process.env.PORT || 3002;  # Change 3001 to 3002
```

### API Key Issues
- Make sure your `.env` file is in the project root
- Check that API keys are correct (no extra spaces)
- Verify Gemini API key is active in Google AI Studio

### No Food Prices Showing
- The app uses free APIs that may be slow
- Try different food items (milk, bread, rice work best)
- Check browser console for error messages

## Technologies Used

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **APIs:** World Bank Data API, FAO API, Google Gemini AI
- **Styling:** Custom CSS (student-friendly design)

## Contributing

This is a student project. Feel free to:
- Add more countries
- Improve the UI/UX
- Add new food price APIs
- Enhance the AI chat functionality

## License

MIT License - Feel free to use this project for educational purposes.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your API keys are correct
3. Make sure all dependencies are installed
4. Check that Node.js version is 14 or higher

---

**Built for students, by students! 