# NSE Invest Order Entry Application

This application provides a user interface for selecting mutual fund schemes from NSE Invest and submitting order requests.

## Features

- View and search available mutual fund schemes
- Submit purchase orders for selected schemes
- View API responses from NSE Invest
- Store UCC registrations and order entries in MongoDB
- Query historical UCC registrations and orders

## Project Structure

- `server.js` - Express backend server
- `client/` - React frontend application
- `models/` - MongoDB models and database connection
- `NSE_NSEINVEST_ALL_12052025.txt` - Scheme master data file
- `order-entry.js` - Original order entry script (reference only)
- `ucc-registration.js` - UCC registration script (reference only)

## Prerequisites

- Node.js v12 or higher
- NPM or Yarn
- MongoDB Atlas account (or local MongoDB instance)

## Installation

1. Install server dependencies:

```bash
npm install
```

2. Install client dependencies:

```bash
cd client
npm install
cd ..
```

3. Set up MongoDB:
   - Create a MongoDB Atlas account if you don't have one already
   - Create a new cluster and database
   - Create a user with read/write permissions
   - Get your connection string from MongoDB Atlas
   - Create a `.env` file in the root directory and add your MongoDB connection string:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority
```

## Running the Application

### Development Mode

1. Start the backend server:

```bash
node server.js
```

2. In a separate terminal, start the React development server:

```bash
cd client
npm start
```

3. Access the application at [http://localhost:3000](http://localhost:3000)

### Production Mode

1. Build the React application:

```bash
cd client
npm run build
cd ..
```

2. Set the NODE_ENV environment variable to 'production':

```bash
# Windows
set NODE_ENV=production

# Linux/Mac
export NODE_ENV=production
```

3. Start the server:

```bash
node server.js
```

4. Access the application at [http://localhost:4000](http://localhost:4000)

## API Endpoints

- `GET /api/schemes` - Get list of available schemes
- `POST /api/process-order` - Submit an order request
- `POST /api/register-ucc` - Register a new UCC
- `GET /api/orders` - Query order history from MongoDB
- `GET /api/ucc-registrations` - Query UCC registration history from MongoDB

## MongoDB Integration

The application stores all UCC registrations and order entries in MongoDB:

- UCC Registrations Collection: Stores all client registration details and API responses
- Order Entries Collection: Stores all order transaction details and API responses

The data is stored even for simulated responses during development, allowing testing without connecting to the NSE API.

## Notes

- The application uses NSE Invest UAT environment for testing
- SSL verification is disabled in the test environment
- For production use, proper security measures should be implemented
- The MongoDB connection string should be kept secure and not committed to version control 