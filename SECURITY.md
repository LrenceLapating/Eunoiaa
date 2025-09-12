# Security Guidelines for EUNOIA

## 🔐 API Key Management

### ❌ NEVER DO THIS:
```javascript
// DON'T hardcode API keys in source code
const API_KEY = 'sk-or-v1-your-api-key-here-never-do-this';
```

### ✅ ALWAYS DO THIS:
```javascript
// Use environment variables
const API_KEY = process.env.OPENROUTER_API_KEY;
```

## 🛡️ Environment Variables

### Required Environment Variables

#### Development & Production
```bash
# AI Service Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL_NAME=mistralai/mistral-7b-instruct
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1500

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security
JWT_SECRET=your_jwt_secret_key_here
```

## 🔄 API Key Rotation Process

### When API Keys Are Compromised:

1. **Immediately disable the compromised key** at the provider
2. **Generate a new API key** from the provider dashboard
3. **Update environment variables** in all environments
4. **Restart applications** to use the new key
5. **Verify functionality** with the new key
6. **Update documentation** if needed

### For OpenRouter API Keys:
1. Go to https://openrouter.ai/keys
2. Disable the compromised key
3. Generate a new key
4. Update `OPENROUTER_API_KEY` in your environment

## 📋 Security Checklist

### Before Committing Code:
- [ ] No API keys in source code
- [ ] No passwords in source code
- [ ] No database URLs with credentials
- [ ] All secrets in environment variables
- [ ] .env files in .gitignore
- [ ] .env.example updated (without real values)

### Before Deploying:
- [ ] Environment variables set in production
- [ ] API keys are valid and active
- [ ] Database connections secured
- [ ] HTTPS enabled in production
- [ ] CORS properly configured

## 🚨 Incident Response

### If API Keys Are Exposed:
1. **Immediate Action**: Disable the exposed key
2. **Assessment**: Check logs for unauthorized usage
3. **Rotation**: Generate and deploy new keys
4. **Prevention**: Review and improve security practices
5. **Documentation**: Update security procedures

## 🔍 Security Monitoring

### Regular Security Checks:
- Review commit history for exposed secrets
- Audit environment variable usage
- Monitor API key usage patterns
- Check for unauthorized access attempts
- Update dependencies regularly

## 📚 Resources

- [OpenRouter API Keys](https://openrouter.ai/keys)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Git Secrets Prevention](https://git-secret.io/)

## 🆘 Emergency Contacts

If you discover a security vulnerability:
1. **DO NOT** commit the fix to a public repository
2. Contact the development team immediately
3. Follow the incident response procedure
4. Document the incident for future prevention