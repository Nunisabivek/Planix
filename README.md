# Planix - AI-Powered Floor Plan Generator

<div align="center">

![Planix Logo](https://img.shields.io/badge/Planix-AI%20Floor%20Plans-blue?style=for-the-badge)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=flat&logo=react)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.4-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-AI-ff6b6b?style=flat)](https://deepseek.com/)

*Professional architectural design powered by AI*

</div>

## 🏗️ Overview

Planix is a cutting-edge AI-powered floor plan generator that creates professional architectural designs in minutes. Built with React, Next.js, and integrated with DeepSeek AI for advanced engineering knowledge.

### ✨ Key Features

- 🤖 **AI-Powered Generation** - Uses DeepSeek and Gemini AI for professional floor plans
- 📐 **CAD-Quality Rendering** - Professional visualization with proper dimensions
- 🏗️ **Engineering Analysis** - Material estimation, structural analysis, cost calculations
- 👤 **User Management** - Authentication, project management, subscription plans
- 💳 **Payment Integration** - Razorpay payment gateway for premium features
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### For Deployment Platforms (Vibeflow, Vercel, etc.)

This is a **React/Next.js** application. Use these commands:

```bash
# Install dependencies
npm run install:all

# Development
npm run dev              # Starts frontend on port 3000
npm run backend:dev      # Starts backend on port 8080

# Production
npm run build           # Builds frontend
npm run start           # Starts frontend production server
```

### Local Development

#### Prerequisites
- Node.js 18+
- PostgreSQL database
- DeepSeek API key
- Gemini API key (optional)

#### 1. Clone & Install
```bash
git clone https://github.com/Nunisabivek/Planix.git
cd Planix
npm run install:all
```

#### 2. Setup Backend
```bash
cd backend
cp .env.example .env  # Create and configure your .env file
npx prisma db push
npx prisma generate
npm run dev
```

#### 3. Setup Frontend
```bash
cd frontend
npm run dev
```

## 📦 Project Structure

```
Planix/
├── frontend/          # Next.js 14 + React 18 + TypeScript
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   └── utils/     # Utilities & API calls
│   └── package.json
├── backend/           # Express + Prisma + TypeScript
│   ├── src/           # API routes and logic
│   ├── prisma/        # Database schema
│   └── package.json
└── package.json       # Root package.json for monorepo
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@host:5432/db"
JWT_SECRET="your-jwt-secret"
DEEPSEEK_API_KEY="your-deepseek-api-key"
GEMINI_API_KEY="your-gemini-api-key"
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
FRONTEND_URL="http://localhost:3000"
PORT=8080
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your-razorpay-key"
```

## 🚀 Deployment

### Automatic Deployment
- **Frontend**: Deploy to Vercel (auto-detects Next.js)
- **Backend**: Deploy to Railway (auto-detects Express)

### Manual Deployment

#### Vercel (Frontend)
- Root Directory: `frontend`
- Framework: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`

#### Railway (Backend)
- Root Directory: `backend`
- Build Command: `npm run build`
- Start Command: `npm start`
- Install Command: `npm ci`

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Canvas**: Fabric.js for interactive editing

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **AI Integration**: DeepSeek + Google Gemini
- **Authentication**: JWT
- **Payments**: Razorpay

### AI & APIs
- **DeepSeek AI**: Primary AI for floor plan generation
- **Google Gemini**: Fallback AI service
- **Razorpay**: Payment processing
- **Nodemailer**: Email services

## 📄 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset

### Floor Plans
- `POST /api/generate-plan` - Generate AI floor plan
- `POST /api/analyze-plan` - Analyze existing plan

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Bivek Nunisa**
- GitHub: [@Nunisabivek](https://github.com/Nunisabivek)
- Email: nunisaalex456@gmail.com

---

<div align="center">
  <p>Built with ❤️ using AI and modern web technologies</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>


