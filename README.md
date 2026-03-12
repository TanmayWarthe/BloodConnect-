# 🩸 BloodConnect – AI-Powered Blood Donation & Request Management System

BloodConnect is a full-stack platform designed to make **blood donation and emergency blood requests easier and faster**.

The system connects **blood donors, hospitals, and patients** through a centralized platform where users can request blood, find available donors, and track donation activity.

The platform also includes **AI-based insights** that help predict blood demand and improve coordination between hospitals and donors.

---

# 📋 Table of Contents

1. Overview  
2. Key Features  
3. Tech Stack  
4. Prerequisites  
5. Installation & Setup  
6. Running the Application  
7. Project Structure  
8. API Documentation  
9. Database Schema  
10. Deployment  
11. Contributing  
12. License  

---

# 🌟 Overview

In many emergency situations, **finding blood donors quickly becomes difficult**. BloodConnect aims to simplify this process by providing a system where hospitals and patients can easily locate available donors.

The platform allows:

- **Donors** to register and mark their availability for blood donation  
- **Patients** to request blood and track their request status  
- **Hospitals** to manage blood inventory and handle emergency requests  
- **Administrators** to monitor system activity and manage users  

An additional **AI service analyzes request data and donor activity** to provide insights such as demand prediction and donor matching.

---

# ✨ Key Features

## AI-Based Insights
- Predict possible **blood shortages**
- Smart matching between **donors and hospitals**
- Identify potential **blood wastage risks**
- Provide insights for better **resource planning**

## Hospital Management
- Create and manage blood requests
- Monitor blood inventory
- Broadcast emergency blood requests
- View AI predictions for demand

## Donor Portal
- Register as a blood donor
- View nearby blood requests
- Update donation availability
- Track donation history

## Patient Features
- Request blood for treatment
- Track request progress
- View matched donors and hospitals

## Admin Dashboard
- Manage users and hospitals
- Monitor blood requests and donations
- View overall system analytics

## Performance Features
- Real-time updates for requests and notifications  
- Responsive UI built with modern frontend tools  
- Secure authentication with role-based access  

---

# 🛠 Tech Stack

## Frontend
- React.js  
- Vite  
- Tailwind CSS  
- React Router  
- Axios  

## Backend
- Spring Boot  
- Java  
- REST APIs  
- Maven  

## Database
- PostgreSQL  

## AI Service
- Python  
- Flask  
- Google Gemini API  

## Tools
- Git  
- GitHub  
- Supabase (Database Hosting)

---

# ✅ Prerequisites

Before running the project, make sure the following tools are installed:

| Tool | Version |
|-----|-----|
| Node.js | 18+ |
| npm | 9+ |
| Java | 17+ |
| Maven | 3.8+ |
| Python | 3.9+ |
| Git | Latest |

You will also need:

- Google Maps API key (for location features)
- Gemini API key (for AI service)

---

# 📥 Installation & Setup

## Clone the Repository

```bash
git clone https://github.com/your-username/BloodConnect.git
cd BloodConnect
```

---

## Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs at:

```
http://localhost:8086
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

AI service runs at:

```
http://localhost:5000
```

---

# 🚀 Running the Application

Start the three services:

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm run dev
```

### AI Service

```bash
cd ai-service
python app.py
```

Then open:

```
http://localhost:3000
```

Register a user and explore the dashboard.

---

# 📁 Project Structure

```
BloodConnect
│
├── frontend/        # React frontend
│
├── backend/         # Spring Boot backend
│
├── ai-service/      # Python AI microservice
│
├── database/        # SQL schema files
│
└── docs/            # Documentation
```

---

# 📡 API Documentation

### Authentication

```
POST /api/auth/register
POST /api/auth/login
```

### Donors

```
GET /api/donors
GET /api/donors/{id}
POST /api/donors/{id}/availability
```

### Blood Requests

```
GET /api/blood/requests
POST /api/blood/requests
PUT /api/blood/requests/{id}/status
```

### AI Services

```
POST /ai/predict-demand
POST /ai/donor-fatigue-score
POST /ai/wastage-prediction
```

---

# 🗄 Database Schema

Main tables used in the system:

- users  
- donor_profiles  
- hospital_profiles  
- blood_inventory  
- blood_requests  
- donations  
- appointments  
- notifications  
- ai_predictions  

---

# 🚢 Deployment

### Frontend
- Vercel
- Netlify
- Firebase Hosting

### Backend
- Railway
- Render
- AWS EC2

### Database
- Supabase
- Neon PostgreSQL

### AI Service
- Render
- Google Cloud Run

---

# 🤝 Contributing

Contributions are welcome.

Steps to contribute:

1. Fork the repository  
2. Create a new branch  

```
git checkout -b feature/new-feature
```

3. Commit your changes  

```
git commit -m "Added new feature"
```

4. Push to your branch  

```
git push origin feature/new-feature
```

5. Create a Pull Request.

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👥 Team

Developed as part of the **BloodConnect project** to improve accessibility and management of blood donation systems.

---

# ❤️ Acknowledgments

- Google Gemini API  
- React Community  
- Spring Boot Community  
- Open Source Contributors  

---

**Built to help save lives using technology 🩸**