const path = require('path');
const dotenv = require('dotenv');

// Prefer backend/.env so scripts work from either the repo root or backend/.
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();
