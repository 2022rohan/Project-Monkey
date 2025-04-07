# ChattrBox - Meet, Talk, Connect

A web-based platform for random video and text chats with real-time communication features.

## Features

- Anonymous or Google-authenticated user access
- One-on-one random video chat
- Real-time side-by-side text messaging
- Friend request functionality
- User profile management
- Responsive UI for both mobile and desktop

## Project Structure

```
chattrbox/
├── frontend/          # React frontend application
└── backend/           # Node.js backend server
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google OAuth credentials

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory and configure the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chattrbox
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Development

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 