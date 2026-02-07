<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Brand Mosaic

> "Brand identity without the noise."

A minimalist AI-powered brand identity generator that helps you create comprehensive brand kits through thoughtful questions and intelligent analysis.

## ✨ Features

### 🎨 Comprehensive Brand Kits
- AI-generated brand essence and positioning
- Color palette recommendations
- Typography suggestions
- Brand archetype analysis
- Tone of voice guidelines
- Logo generation with AI

### 💰 Flexible Monetization
- **Free Trial**: 1 generation with limited features
- **Pay-Per-Use**: $5 for 2 full generations
- **Local Mode**: Use your own Gemini API key for unlimited access

### 🔒 Cloud Sync & Authentication
- Supabase-powered authentication
- Project persistence across devices
- Secure credit management
- Real-time usage tracking

### 🚀 Key Capabilities
- Beautiful typewriter-inspired UI
- PDF export functionality
- Shareable brand kit links
- Logo generation (paid feature)
- Comprehensive error handling
- Mobile-responsive design

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini API
- **Payments**: Paystack (with Stripe support planned)
- **Styling**: Custom CSS with minimalist aesthetic

## 🚀 Quick Start

### Local Development

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and configure:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_PAYSTACK_PUBLIC_KEY=your_paystack_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run migrations:**
   Execute SQL files in `supabase/migrations/` in order

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Visit:** `http://localhost:5173`

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Local development setup
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [API Documentation](supabase/migrations/) - Database schema and functions

## 🏗 Project Structure

```
Brand-Mosaic/
├── components/          # React components
├── lib/                # Services and utilities
├── hooks/              # Custom React hooks
├── supabase/           # Database and Edge Functions
├── types.ts            # TypeScript definitions
└── App.tsx             # Main application
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Authentication (sign up/in)
- [ ] Local mode with API key
- [ ] Free trial generation
- [ ] Payment flow (test mode)
- [ ] Credit tracking
- [ ] Logo generation
- [ ] Project saving/loading
- [ ] Share functionality

### Test Cards (Paystack)
- Success: `4084084084084081`
- Decline: `4084080000000408`

## 🚢 Deployment

### Prerequisites
- Supabase account and project
- Paystack account (test/live)
- Gemini API key
- Hosting platform (Vercel/Netlify recommended)

### Steps
1. Set up Supabase project and run migrations
2. Deploy Edge Functions to Supabase
3. Configure Paystack webhook
4. Set environment variables on hosting platform
5. Build and deploy frontend

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

## 🔐 Security

- Environment variables never committed
- Row Level Security (RLS) enabled on all tables
- API keys encrypted when stored
- Webhook signature verification
- Rate limiting on generation endpoints

## 🗺 Roadmap

- [ ] Stripe payment integration
- [ ] Crypto payment support
- [ ] Real Google Imagen API integration
- [ ] Team collaboration features
- [ ] Brand kit templates
- [ ] Advanced analytics
- [ ] Mobile app

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

## 💬 Support

For issues or questions:
- Check [SETUP_GUIDE.md](SETUP_GUIDE.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- Review Supabase and Paystack logs
- Open an issue on GitHub

---

Built with ❤️ using Google Gemini AI
