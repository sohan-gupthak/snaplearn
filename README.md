# SnapLearn - AI-Powered Educational Video Platform

<!-- ![SnapLearn Logo](src/assets/logo.png) -->

SnapLearn is an innovative educational platform that uses AI to transform video content into interactive learning experiences. Upload educational videos, and SnapLearn will automatically transcribe the content and generate quiz questions to help students test their understanding.

## 🚀 Features

- **Automatic Video Transcription**: Upload videos and get accurate transcriptions powered by OpenAI's Whisper model
- **Multilingual Support**: Transcribe content in multiple languages with automatic language detection
- **AI-Generated Quiz Questions**: Automatically generate multiple-choice questions based on video content
- **Interactive Learning**: Navigate through video segments and answer questions to test understanding
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Processing**: Track processing status with real-time progress updates

## 🛠️ Tech Stack

### Frontend (This Repository)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **UI Components**: Custom components built on Radix UI primitives

### Backend (Separate Repository)
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **API Documentation**: Swagger/OpenAPI
- **File Storage**: Local file system (with cloud storage options available)
- **Authentication**: JWT-based authentication (prepared for implementation)

### AI Service
- **Transcription**: OpenAI Whisper for multilingual speech-to-text
- **Question Generation**: LLM-based question generation using Ollama (with OpenAI fallback)
- **Media Processing**: FFmpeg for video and audio processing

## 📂 Project Structure

### Frontend Structure
```
src/
├── assets/               # Static assets like images, fonts
├── components/           # Reusable UI components
│   ├── ui/               # Base UI components (buttons, cards, etc.)
│   └── ...               # Other shared components
├── lib/                  # Utility functions and helpers
├── pages/                # Page components for each route
│   ├── HomePage.tsx      # Landing page
│   ├── UploadPage.tsx    # Video upload page
│   ├── VideoDetailsPage.tsx # Video details with transcript and questions
│   └── ...               # Other pages
├── services/             # API service layer
│   └── api.ts            # API client and endpoints
├── types/                # TypeScript type definitions
├── App.tsx               # Main application component
├── main.tsx              # Application entry point
└── index.css             # Global styles
```

### Backend Structure
```
src/
├── config/               # Configuration files
├── controllers/          # API controllers (handles HTTP requests/responses)
├── middleware/           # Express middleware
├── models/               # MongoDB schemas and models
│   └── schemas/          # Mongoose schema definitions
├── repositories/         # Data access layer (database interactions)
│   └── mongodb/          # MongoDB repositories
├── routes/               # API route definitions
├── services/             # Business logic layer (core application logic)
├── python-ai-service/    # Python service for AI processing
│   ├── app.py            # Main Python service
│   ├── transcription.py  # Whisper transcription
│   └── question_generation.py # Question generation
└── index.ts              # Application entry point
```

### Frontend Architecture
The frontend follows a clean feature-based architecture with clear separation of concerns:

- **Scalable Architecture**: Feature-based organization that scales with your application
- **Type Safety**: Full TypeScript integration for better developer experience
- **Performance Optimized**: Built with Vite for fast development and optimized production builds
- **State Management**: Redux Toolkit configured with best practices
- **Consistent Styling**: Tailwind CSS with custom utility classes
- **Path Aliases**: Configured with `@/` aliases for cleaner imports

### Backend Architecture
The backend follows a clean microservice architecture with clear separation of concerns:

1. **Controller Layer** - Handles HTTP requests and responses, input validation, and routing
2. **Service Layer** - Contains business logic, orchestrates operations, and interacts with repositories
3. **Repository Layer** - Manages data access operations and database interactions

This architecture provides several benefits:
- Improved maintainability through separation of concerns
- Enhanced testability with clear boundaries between layers
- Better scalability for future development
- Simplified dependency management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB (local)
- Python 3.8+ (for AI service)
- FFmpeg (for video processing)

### Frontend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/sohan-gupthak/snaplearn.git
   cd snaplearn
   ```

2. Install dependencies
   ```bash
   nvm install v18.20.4
   nvm use v18.20.4
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Backend Setup
1. Clone the backend repository
   ```bash
   git clone https://github.com/sohan-gupthak/snaplearn-backend.git
   cd snaplearn-backend
   ```

2. Install dependencies
   ```bash
   nvm install --lts
   nvm use --lts
   npm install
   ```

3. Create a `.env` file based on `.env.example`

4. Start the backend server
   ```bash
   npm run dev
   ```

5. Start the Python AI service
   ```bash
   cd python-ai-service
   pip install -r requirements.txt
   python app.py
   ```

## 🧠 How It Works

1. **Video Upload**: Users upload educational videos through the frontend interface
2. **Transcription**: The backend processes the video and sends it to the Python AI service for transcription using Whisper
3. **Question Generation**: The AI service analyzes the transcript and generates relevant multiple-choice questions
4. **Interactive Learning**: Users can navigate through video segments, view transcripts, and answer questions
5. **Progress Tracking**: The system tracks processing progress and updates the UI in real-time

## 🙏 Acknowledgements

- OpenAI for the Whisper model
- Radix UI for accessible component primitives
- shadcn/ui for the beautiful component library
- FFmpeg for video processing capabilities
├── layouts/ # Layout components
├── pages/ # Page components for routing
├── routes/ # Routing configuration
├── store/ # Redux store setup and root reducer
├── styles/ # Global styles and CSS utilities
└── types/ # TypeScript type definitions

```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

