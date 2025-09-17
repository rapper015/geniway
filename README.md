# GeniWay - AI-Powered Learning Platform

GeniWay is a modern, AI-powered learning platform designed to help students solve their doubts in English, Hindi, or Hinglish. The platform provides instant, step-by-step solutions with a beautiful, responsive user interface.

## Features

- 🔐 **User Authentication**: Secure login and registration system
- 🌐 **Multi-language Support**: Ask questions in English, Hindi, or Hinglish
- 🎤 **Voice Input**: Speak your questions naturally
- 📷 **Photo Upload**: Upload images of your questions
- 💬 **Text Chat**: Type your doubts and get instant help
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 📱 **Mobile-First**: Optimized for all devices
- 🔒 **Secure**: JWT-based authentication with MongoDB

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
- **Authentication**: JWT tokens with bcrypt password hashing
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with custom gradients and animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd geniway
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── dashboard/         # Dashboard page
│   ├── layout.js          # Root layout
│   └── page.js            # Home page
├── components/
│   ├── auth/              # Authentication components
│   ├── Header.js          # Navigation header
│   ├── Hero.js            # Hero section
│   ├── Features.js        # Features section
│   ├── HowItWorks.js      # How it works section
│   ├── Testimonials.js    # Testimonials section
│   ├── FAQ.js             # FAQ section
│   └── Footer.js          # Footer component
├── contexts/
│   └── AuthContext.js     # Authentication context
├── lib/
│   └── mongodb.js         # MongoDB connection
└── models/
    └── User.js            # User model
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Request/Response Examples

#### Register
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "grade": "Class 10",
  "school": "ABC School"
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

## User Roles

- **Student**: Can ask questions and access learning materials
- **Parent**: Can monitor child's progress and set limits
- **Teacher**: Can create content and track student progress

## Features in Detail

### Authentication System
- Secure JWT-based authentication
- Password hashing with bcrypt
- User roles and permissions
- Protected routes

### Modern UI Components
- Responsive design
- Smooth animations and transitions
- Gradient backgrounds and modern styling
- Mobile-first approach

### Database Schema
- User collection with role-based fields
- Secure password storage
- Timestamps for user activity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@geniway.com or create an issue in the repository.

---

Built with ❤️ for students across India