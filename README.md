# 🏪 TPV App - Modern Point of Sale System

A comprehensive Point of Sale (POS) system built with modern web technologies, designed to help businesses manage their sales, inventory, and billing processes efficiently.

## ✨ Features

- 🔐 Secure user authentication
- 💰 Sales management and TPV interface
- 📦 Inventory tracking
- 📊 Sales dashboard and analytics
- 📄 Invoice management and analysis
- ⚙️ Configuration and user profiles
- 🛡️ Secure data isolation
- 💁‍♂️ Customer support section

## 🛠️ Tech Stack

- **Frontend:**
  - React
  - Vite
  - Tailwind CSS
  - Context API for state management

- **Backend:**
  - Node.js
  - Express
  - Firebase Authentication
  - Firebase Firestore
  - Firebase Storage

## 🏗️ Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Context providers
│   │   ├── hooks/        # Custom hooks
│   │   └── assets/       # Static assets
│
└── server/                # Backend Node.js application
    ├── routes/           # API routes
    └── firebase/         # Firebase configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/miguelangelccdg00/tpv-app.git
cd tpv-app
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Configure Firebase:
- Create a Firebase project
- Update Firebase configuration in `client/src/firebase.js`
- Set up Firebase credentials in `server/firebase/firebase-config.json`

4. Start the development servers:
```bash
# Start the backend server
cd server
npm start

# In a new terminal, start the frontend
cd client
npm run dev
```

## 🔑 Key Features

### 📱 TPV Interface
- Intuitive point of sale interface
- Quick product search and selection
- Real-time inventory updates

### 📊 Dashboard
- Sales analytics and reports
- Daily, weekly, and monthly statistics
- Performance metrics

### 📦 Inventory Management
- Product tracking
- Stock alerts
- Category management

### 📄 Invoice Analysis
- Automated invoice processing
- Data extraction
- Digital invoice management

## 🔒 Security

- Secure data isolation
- Firebase Authentication
- Role-based access control
- Secure API endpoints

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

Miguel Ángel - [GitHub](https://github.com/miguelangelccdg00)

---

Made with ❤️ by Miguel Ángel
