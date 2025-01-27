const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const dotenv = require('dotenv');
const mongoose = require('mongoose');


dotenv.config();

const mongoURL = process.env.MONGODB_URL;

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));
  
 
class KiteApp {
  constructor(apiKey, userId, enctoken) {
    this.apiKey = apiKey;
    this.userId = userId;
    this.enctoken = enctoken;
    this.root = "https://kite.zerodha.com/oms";
    this.headers = {
      "X-Kite-Version": "3",
      'Authorization': `enctoken ${this.enctoken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this._routes = {
      place_order: '/orders/amo',
    };
  }

  async _request(route, method, params = null) {
    const uri = this._routes[route];
    if (!uri) throw new Error('Route not found');

    let url = this.root + uri;
    const options = {
      method,
      headers: this.headers,
    };

    if (method === 'POST' || method === 'PUT') {
      options.body = new URLSearchParams(params).toString();
    } else if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += '?' + queryString;
    }

    console.log('Request headers:', this.headers);
    console.log(`Request: ${method} ${url}`);
    console.log('Request body:', options.body);

    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response:', data);
        if (data.status === 'error') throw new Error(data.message);
        return data.data;
      } else {
        const text = await response.text();
        console.log('Response:', text);
        throw new Error(`Unexpected response: ${text}`);
      }
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  async placeOrder(params) {
    return this._request('place_order', 'POST', params);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const KITE_API_KEY = process.env.KITE_API_KEY; 
let kiteApp;

// Login with credentials function
async function loginWithCredentials(userId, password, twofa) {
  try {
    let response = await fetch('https://kite.zerodha.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ user_id: userId, password })
    });

    if (!response.ok) throw new Error("Login failed. Check your credentials.");

    const loginData = await response.json();
    response = await fetch('https://kite.zerodha.com/api/twofa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        request_id: loginData.data.request_id,
        twofa_value: twofa,
        user_id: loginData.data.user_id
      })
    });
    // Fetching the raw cookies from the response headers
    const cookies = response.headers.raw()['set-cookie'];

    // Finding the enctoken from the cookies
    const tokenValue = cookies.find(cookie => cookie.startsWith('enctoken='));

    // Check if enctoken exists, then split and extract its value
    if (tokenValue) {
        enctoken = tokenValue.replace('enctoken=', '').split(';')[0]
        console.log(enctoken); 
    } else {
        console.error('enctoken not found in cookies');
    }


    await fs.mkdir('utils', { recursive: true });
    await fs.writeFile('utils/enctoken.txt', enctoken);

    return enctoken;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { userId, password, twofa } = req.body;
    const enctoken = await loginWithCredentials(userId, password, twofa);
    kiteApp = new KiteApp(KITE_API_KEY, userId, enctoken);
    res.json({ success: true, message: 'Logged in successfully', enctoken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Place order route
app.post('/api/place-order', async (req, res) => {
  try {
    if (!kiteApp) throw new Error('Not logged in. Please login first.');

    console.log('Order Request Body:', req.body);

    const orderParams = {
      exchange: req.body.exchange,
      tradingsymbol: req.body.symbol,
      transaction_type: req.body.transactionType,
      quantity: req.body.quantity,
      product: 'CNC',
      order_type: req.body.orderType,
      validity: 'DAY',
    };

    if (req.body.orderType === 'LIMIT' && req.body.price) {
      orderParams.price = req.body.price;
    }

    const orderResponse = await kiteApp.placeOrder(orderParams);
    res.json({ success: true, data: orderResponse });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const AuthController = require('./Controllers/AuthController');
app.use('/auth', AuthController);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});