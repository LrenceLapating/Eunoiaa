# 🔑 API Key Setup Instructions

## Immediate Action Required

Your OpenRouter API key was exposed and has been disabled. Follow these steps to fix it:

## Step 1: Get a New API Key

1. **Go to OpenRouter**: https://openrouter.ai/keys
2. **Login** to your account
3. **Create a new API key**:
   - Click "Create Key"
   - Give it a name like "EUNOIA Production" or "EUNOIA Development"
   - Copy the key (starts with `sk-or-v1-...`)

## Step 2: Update Your Environment

1. **Navigate to your backend directory**:
   ```bash
   cd backend
   ```

2. **Create/update your .env file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit the .env file** and add your new API key:
   ```bash
   # Replace with your actual new API key
   OPENROUTER_API_KEY=sk-or-v1-your-new-key-here
   
   # Also make sure these are set:
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret
   ```

## Step 3: Validate Your Setup

```bash
# Install dependencies if needed
npm install

# Validate your environment
npm run validate-env
```

You should see:
```
✅ OPENROUTER_API_KEY: sk-or-v1-...7614
✅ Environment validation passed!
```

## Step 4: Test the Application

```bash
# Start the development server
npm run dev
```

The AI intervention service should now work properly.

## Step 5: Update Production (if applicable)

If you're running this in production:

1. **Update your production environment variables**
2. **Restart your production server**
3. **Test the AI functionality**

## ✅ Verification Checklist

- [ ] New API key obtained from OpenRouter
- [ ] .env file updated with new key
- [ ] `npm run validate-env` passes
- [ ] Application starts without errors
- [ ] AI interventions are working
- [ ] Old API key is disabled/deleted

## 🔐 Security Reminders

- ✅ API key is now in environment variables (not hardcoded)
- ✅ .env files are in .gitignore
- ✅ Never commit API keys to version control again
- ✅ Use different keys for development and production
- ✅ Rotate keys regularly

## 🆘 Need Help?

If you encounter issues:

1. **Check the logs** for specific error messages
2. **Verify your API key** is active at https://openrouter.ai/keys
3. **Check your account credits** at OpenRouter
4. **Run the validation script**: `npm run validate-env`

## 📚 Additional Resources

- [SECURITY.md](SECURITY.md) - Complete security guidelines
- [ENV_SETUP.md](ENV_SETUP.md) - Detailed environment setup
- [OpenRouter Documentation](https://openrouter.ai/docs)