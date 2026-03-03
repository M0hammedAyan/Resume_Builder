# ProMind - AI Resume Builder

> A modern, AI-powered resume builder with conversational interface and professional templates.

![ProMind Banner](./screenshots/banner.png)

## 🌟 Overview

ProMind is an intelligent resume builder that uses AI to help you create professional, ATS-friendly resumes. Chat with the AI assistant to add experiences, projects, and skills, then export your resume in multiple formats with customizable templates.

## ✨ Features

### 🤖 AI-Powered
- **Conversational Interface**: Chat naturally to build your resume
- **Smart Suggestions**: AI detects and categorizes your updates
- **Content Improvement**: Enhance bullet points with action verbs and metrics
- **ATS Scoring**: Real-time analysis of resume compatibility

### 📝 Resume Management
- **Multiple Templates**: Classic, Modern, and Minimal designs
- **Drag & Drop**: Reorder sections and entries easily
- **Real-time Preview**: See changes instantly
- **PDF Export**: High-quality, multi-page PDF generation

### 🎨 Modern UI
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished user experience
- **Professional Styling**: SaaS-style design with Tailwind CSS

### 🔐 Secure
- **JWT Authentication**: Secure user sessions
- **Password Hashing**: bcrypt encryption
- **Protected Routes**: API endpoint security
- **Data Privacy**: User-specific resume storage

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **react-beautiful-dnd** - Drag and drop
- **html2canvas + jsPDF** - PDF generation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- npm or yarn

### Frontend Setup

```bash
# Clone repository
git clone https://github.com/yourusername/promind.git
cd promind

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your API URL
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your values:
# - MONGO_URI
# - JWT_SECRET
# - PORT

# Start server
npm run dev
```

Backend runs on `http://localhost:5000`

## 🚀 Quick Start

1. **Register an account**
   ```bash
   POST /api/auth/register
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Start chatting**
   - Type your professional updates
   - AI detects and categorizes them
   - Review and approve suggestions

3. **Build your resume**
   - Drag to reorder entries
   - Choose a template
   - Add personal information

4. **Export**
   - Download as PDF
   - Print directly
   - Share with employers

## 📚 API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
Body: { email, password }

# Login
POST /api/auth/login
Body: { email, password }

# Get current user
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### Resumes

```bash
# Create resume
POST /api/resumes
Headers: { Authorization: "Bearer <token>" }
Body: { title, content }

# Get all resumes
GET /api/resumes
Headers: { Authorization: "Bearer <token>" }

# Get single resume
GET /api/resumes/:id
Headers: { Authorization: "Bearer <token>" }

# Update resume
PUT /api/resumes/:id
Headers: { Authorization: "Bearer <token>" }
Body: { title, content }

# Delete resume
DELETE /api/resumes/:id
Headers: { Authorization: "Bearer <token>" }
```

### AI Features

```bash
# Improve bullet points
POST /api/ai/improve-bullets
Headers: { Authorization: "Bearer <token>" }
Body: { bullets: ["..."], section: "experience" }

# Score resume for ATS
POST /api/ai/score-resume
Headers: { Authorization: "Bearer <token>" }
Body: { content: {...} }
```

See [API_DOCS.md](./API_DOCS.md) for complete documentation.

## 📁 Project Structure

```
promind/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   ├── utils/             # Utilities
│   └── schemas/           # Validation schemas
│
├── backend/               # Backend source
│   ├── controllers/       # Request handlers
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── middleware/       # Custom middleware
│   └── config/           # Configuration
│
├── public/               # Static assets
└── docs/                 # Documentation
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed structure guide.

## 🎨 Screenshots

### Chat Interface
![Chat Interface](./screenshots/chat.png)

### Resume Preview
![Resume Preview](./screenshots/preview.png)

### Template Selection
![Templates](./screenshots/templates.png)

### Dark Mode
![Dark Mode](./screenshots/dark-mode.png)

## 🧪 Testing

```bash
# Frontend tests
npm run test

# Backend tests
cd backend
npm run test

# E2E tests
npm run test:e2e
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

### Quick Deploy

**Frontend (Vercel):**
```bash
vercel --prod
```

**Backend (Render):**
```bash
# Push to GitHub
# Connect repository in Render dashboard
# Add environment variables
# Deploy
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🔮 Future Improvements

- [ ] LinkedIn integration
- [ ] Cover letter generator
- [ ] Resume analytics dashboard
- [ ] Collaborative editing
- [ ] Version history
- [ ] Custom template builder
- [ ] Job matching suggestions
- [ ] Interview preparation tips
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## 🐛 Known Issues

- PDF generation may have formatting issues on very long resumes
- Dark mode needs refinement in some components
- File upload limited to 10MB

## 💬 Support

- **Email**: support@promind.com
- **Issues**: [GitHub Issues](https://github.com/yourusername/promind/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/promind/discussions)

## 🙏 Acknowledgments

- OpenAI for AI inspiration
- Tailwind CSS for styling framework
- React community for amazing tools
- All contributors and users

---

**Built with ❤️ by [Your Name](https://github.com/yourusername)**

⭐ Star this repo if you find it helpful!
