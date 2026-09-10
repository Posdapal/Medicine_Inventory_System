Project Tools & Technologies

This document outlines the tools and technologies used throughout the design, development, and deployment of this project.

🎨 Design Tools

Figma — UI/UX Design Draw.io — System Diagrams and ERD

🛠️ Development Tools

Visual Studio Code — Code editor GitHub — Code hosting and collaboration

💻 Frontend Technologies

React.js HTML CSS Tailwind CSS JavaScript

⚙️ Backend Technologies

Node.js Express.js

🗄️ Database

MySQL

🧪 Testing Tools

Postman — API testing Browser Developer Tools — Debugging and inspection

📦 Project Management / Version Control

GitLab — Version control for tracking code changes and hosting the project repository

🚀 Hosting & Deployment

Github — For full-stack deployment, if needed

Getting Started

Add setup instructions here (e.g., cloning the repo, installing dependencies, environment variables, running the dev server).

bash# Clone the repository git clone

Install dependencies
npm install

Run the backend server
npm start

Run the frontend
npm run dev

## Run Backend Unit Tests

From the project root, install the backend dependencies:

```sh
cd backend
npm install --ignore-scripts
```

Run all unit tests:

```sh
npm test -- --runInBand
```

Run all unit tests with coverage:

```sh
npm test -- --runInBand --coverage
```

Open `backend/coverage/index.html` to view the coverage report. Jest requires at least 75% coverage for statements, branches, functions, and lines.

Run a specific test file:

```sh
npm test -- --runInBand src/tests/unit/controllers/stock.controller.test.js
```

Tests mock the database, Telegram API, and mail transport. You do not need to start the backend server or connect to a production database.

See [backend test documentation](backend/src/tests/README.md) for coverage scope and additional details.

## Default Admin Account

Use this account to test the system:

```text
Email: admin@gmail.com
Password: Admin@123
```

The system will ask you to create a new secure password after the first login.

License

Add license information here.
