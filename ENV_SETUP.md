# Environment Setup Guide

## 🚀 Quick Start

### 1. Copy Environment Template
```bash
cd backend
cp .env.example .env
```

### 2. Get Your OpenRouter API Key
1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Create a new API key
3. Copy the key (it starts with `sk-or-v1-...`)

### 3. Update Your .env File
```bash
# Edit the .env file and replace the placeholder values
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-jwt-secret-key
```

### 4. Validate Environment
```bash
npm run validate-env
```

### 5. Start the Application
```bash
npm run dev
```

## 🔐 Security Notes

### ⚠️ IMPORTANT: Never commit API keys to version control!

- ✅ Use environment variables
- ✅ Keep .env files in .gitignore
- ✅ Use .env.example for documentation
- ❌ Never hardcode keys in source code
- ❌ Never commit .env files

### API Key Security
- Rotate keys regularly
- Use different keys for different environments
- Monitor key usage for suspicious activity
- Disable compromised keys immediately

## 🛠️ Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI services | `sk-or-v1-...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `AI_MODEL_NAME` | AI model to use | `mistralai/mistral-7b-instruct` |
| `AI_TEMPERATURE` | AI response creativity | `0.7` |
| `AI_MAX_TOKENS` | Max AI response length | `1500` |

## 🔧 Troubleshooting

### Common Issues

#### "OpenRouter API key is required but not configured"
- Make sure `OPENROUTER_API_KEY` is set in your .env file
- Verify the key is valid and not disabled
- Run `npm run validate-env` to check

#### "Missing required environment variables"
- Copy .env.example to .env
- Fill in all required values
- Run `npm run validate-env` to verify

#### AI Service Not Working
- Check if your OpenRouter API key is valid
- Verify you have credits in your OpenRouter account
- Check the logs for specific error messages

### Getting Help
1. Run `npm run validate-env` to check your setup
2. Check the application logs for error messages
3. Verify your API keys are active and have sufficient credits
4. Consult the SECURITY.md file for best practices