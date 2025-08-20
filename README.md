# 🧞‍♂️ Genie: AI-Powered English Tutor for Kids

An interactive, voice-enabled English learning application that helps children practice English through real-time conversations with an AI tutor. Built with modern web technologies and OpenAI's advanced AI models.

## ✨ Features

### 🎤 Voice-First Learning Experience
- **Speech-to-Text**: Real-time audio transcription using OpenAI Whisper
- **AI Chatbot**: Intelligent responses powered by GPT-4o-mini
- **Text-to-Speech**: Natural voice synthesis with OpenAI TTS
- **Multi-language Support**: Responses in English, Hindi, Marathi, Gujarati, Tamil, and Spanish

### 🎭 Interactive Learning Modes
- **Conversational Learning**: Natural dialogue-based English practice
- **Roleplay Scenarios**: Practice real-life conversations in different contexts
  - 🏫 At School
  - 🛒 At the Store  
  - 🏠 At Home
- **Adaptive Responses**: AI adjusts complexity based on student level

### 🎨 Kid-Friendly Interface
- **Colorful Design**: Bright gradients and playful visual elements
- **Intuitive Controls**: Simple recording buttons and clear feedback
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Accessibility**: Clear visual indicators and error messages

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.0** - React framework with App Router
- **React 19.1.0** - Modern React with hooks and functional components
- **TypeScript 5** - Type-safe JavaScript development
- **Tailwind CSS 4** - Utility-first CSS framework
- **PostCSS** - CSS processing and optimization

### Backend & APIs
- **Next.js API Routes** - Serverless API endpoints
- **OpenAI API** - AI models for chat, speech recognition, and synthesis
  - GPT-4o-mini for intelligent responses
  - Whisper for speech-to-text
  - TTS-1 for text-to-speech

### Audio Processing
- **Web Audio API** - Browser-based audio recording
- **MediaRecorder API** - Audio capture and encoding
- **Blob API** - Audio data handling and transmission

### Development Tools
- **ESLint 9** - Code quality and consistency
- **Next.js ESLint Config** - Framework-specific linting rules
- **TypeScript Compiler** - Static type checking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- OpenAI API key with access to GPT-4o-mini, Whisper, and TTS models

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd genie-tutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the project root:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Get OpenAI API Key**
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Ensure your account has billing enabled
   - Verify access to required models (GPT-4o-mini, Whisper, TTS-1)

### Running the Application

#### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production Build
```bash
npm run build
npm start
```

## 📱 How to Use

### Basic Conversation
1. **Select Language**: Choose your preferred response language
2. **Choose Scenario**: Pick a roleplay mode (optional)
3. **Start Recording**: Click "🎤 Start Talking!" and speak clearly
4. **Stop Recording**: Click "⏹ Stop Recording" when done
5. **Listen & Learn**: Genie will respond with both text and voice

### Tips for Best Results
- **Microphone Setup**: Ensure proper microphone permissions and device selection
- **Clear Speech**: Speak clearly and at a normal pace
- **Quiet Environment**: Minimize background noise for better transcription
- **Browser Compatibility**: Use Chrome, Edge, or Firefox on HTTPS/localhost

## 🔧 API Endpoints

### `/api/chat`
- **Method**: POST
- **Purpose**: Generate AI responses using GPT-4o-mini
- **Input**: `{ message, scenario, language }`
- **Output**: `{ reply }`

### `/api/stt` (Speech-to-Text)
- **Method**: POST
- **Purpose**: Convert audio to text using OpenAI Whisper
- **Input**: FormData with audio blob
- **Output**: `{ text }`

### `/api/tts` (Text-to-Speech)
- **Method**: POST
- **Purpose**: Convert text to speech using OpenAI TTS
- **Input**: `{ text }`
- **Output**: Audio file (MP3)

## 🌐 Browser Support

- **Chrome 90+** ✅ (Recommended)
- **Edge 90+** ✅
- **Firefox 88+** ✅
- **Safari 14+** ⚠️ (Limited MediaRecorder support)

**Note**: HTTPS or localhost required for microphone access.

## 🎯 Use Cases

### Educational Institutions
- **ESL Classes**: Interactive English practice for non-native speakers
- **Homework Help**: Personalized tutoring sessions
- **Speaking Practice**: Improve pronunciation and fluency

### Home Learning
- **Parent-Child Activities**: Fun English learning at home
- **Independent Study**: Self-paced learning with AI guidance
- **Language Immersion**: Regular conversation practice

### Special Needs
- **Speech Therapy**: Practice speaking and listening skills
- **Learning Disabilities**: Patient, non-judgmental AI tutor
- **Confidence Building**: Safe environment for language practice

## 🔒 Privacy & Security

- **No Data Storage**: Audio and conversations are not stored
- **API Security**: All API calls use secure HTTPS
- **Local Processing**: Audio processing happens in the browser
- **OpenAI Compliance**: Follows OpenAI's data usage policies

## 🚧 Troubleshooting

### Common Issues

**"No speech detected"**
- Check microphone permissions
- Ensure browser supports MediaRecorder
- Try different microphone device
- Speak clearly and for 2-3 seconds

**"401 Invalid API Key"**
- Verify OPENAI_API_KEY in .env.local
- Check API key is active and has credits
- Ensure access to required models

**Microphone not working**
- Grant microphone permissions
- Use HTTPS or localhost
- Check OS microphone settings
- Try different browser

### Performance Tips
- Use wired headphones with microphone
- Close other audio applications
- Ensure stable internet connection
- Use supported browser versions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the AI models and APIs
- **Next.js Team** for the excellent React framework
- **Tailwind CSS** for the utility-first CSS approach
- **Web Audio API** contributors for browser audio capabilities
