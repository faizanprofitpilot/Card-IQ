# CardIQ - AI-Powered Flashcard Generator

CardIQ is a full-stack SaaS web application that instantly converts your notes and PDFs into AI-generated study flashcards. Built with Next.js 15, Supabase, and OpenAI, it provides an intuitive interface for creating, studying, and managing flashcards.

## ✨ Features

- **🤖 AI-Powered Generation**: Convert notes and PDFs into flashcards using OpenAI
- **📚 Deck Management**: Organize flashcards into custom decks
- **🧠 Smart Study Mode**: Interactive study sessions with progress tracking
- **📤 Export Options**: Download flashcards as CSV or TXT files
- **💳 Stripe Integration**: Free and Pro subscription plans
- **🌙 Dark/Light Mode**: Beautiful UI with theme switching
- **🔐 Secure Authentication**: Supabase Auth with Google sign-in
- **📊 Analytics**: Track usage and study progress

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Supabase (Database, Auth, Storage)
- **AI**: OpenAI GPT-3.5-turbo
- **Payments**: Stripe
- **Styling**: TailwindCSS with custom design system

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- A Supabase account
- An OpenAI API key
- A Stripe account (for payments)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CardIQ
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase Database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Enable Google OAuth in Supabase Auth settings

5. **Set up OpenAI**
   - Get an API key from [OpenAI](https://platform.openai.com/api-keys)
   - Add it to your environment variables

6. **Set up Stripe** (Optional for payments)
   - Create a Stripe account
   - Get your API keys from the Stripe dashboard
   - Add them to your environment variables

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses the following main tables:

- **profiles**: User account information and subscription status
- **decks**: Flashcard deck collections
- **flashcards**: Individual flashcard questions and answers
- **study_sessions**: Study progress tracking
- **events**: Analytics and usage tracking

All tables have Row Level Security (RLS) enabled to ensure users only access their own data.

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Enable Google OAuth in Authentication > Providers
4. Set up your site URL in Authentication > URL Configuration

### OpenAI Setup

1. Create an account at [OpenAI](https://platform.openai.com)
2. Generate an API key
3. Add the key to your environment variables

### Stripe Setup (Optional)

1. Create a Stripe account
2. Get your publishable and secret keys
3. Set up webhooks for subscription events
4. Add keys to your environment variables

## 📱 Usage

### For Users

1. **Sign Up**: Create an account or sign in with Google
2. **Create Decks**: Organize your flashcards into themed decks
3. **Generate Cards**: Use AI to convert notes into flashcards
4. **Study**: Use the interactive study mode to review cards
5. **Export**: Download your flashcards for offline use

### For Developers

The codebase is organized into the following structure:

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
│   ├── ui/             # shadcn/ui components
│   ├── auth/           # Authentication components
│   └── ...             # Feature components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── ...
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security

- Row Level Security (RLS) enabled on all database tables
- Secure authentication with Supabase Auth
- Environment variables for sensitive data
- CSRF protection with Next.js

## 📊 Analytics

The app includes basic analytics tracking:
- User registration events
- Deck creation events
- Flashcard generation events
- Study session events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@cardiqiq.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] PDF text extraction
- [ ] Advanced study algorithms (spaced repetition)
- [ ] Mobile app
- [ ] Collaborative decks
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations

---

Built with ❤️ using Next.js, Supabase, and OpenAI