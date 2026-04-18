const axios = require('axios');
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5000';

async function getRealTravelOptions(source, destination, budget = 'medium') {
  try {
    const response = await axios.post(`${NLP_SERVICE_URL}/travel-options`, {
      source,
      destination,
      budget
    }, { timeout: 15000 }); // 15s timeout
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching real travel options: ${error.message}`);
    // Fallback to mock data if API fails
    return null;
  }
}

module.exports = { getRealTravelOptions };
