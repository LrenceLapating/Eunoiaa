/**
 * Test script to simulate iOS authentication behavior
 * This tests the iOS-specific cookie handling fix
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.TEST_PORT || 3002;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Simulate iOS User-Agent strings
const iosUserAgents = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
];

const androidUserAgent = 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';

// Test the iOS cookie logic
function testCookieLogic(userAgent) {
  const isIOS = userAgent && (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod'));
  
  let cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  };

  // iOS Safari requires specific cookie settings for proper handling
  if (isIOS) {
    cookieOptions.secure = true; // Always secure for iOS
    cookieOptions.sameSite = 'none'; // Required for iOS cross-origin
  }

  return { isIOS, cookieOptions };
}

// Test endpoint
app.get('/test-cookie-logic', (req, res) => {
  console.log('\n=== Cookie Logic Test ===');
  
  // Test iOS devices
  iosUserAgents.forEach((ua, index) => {
    const result = testCookieLogic(ua);
    console.log(`iOS Device ${index + 1}:`);
    console.log(`  User-Agent: ${ua.substring(0, 50)}...`);
    console.log(`  Detected as iOS: ${result.isIOS}`);
    console.log(`  Cookie Options:`, result.cookieOptions);
    console.log('');
  });

  // Test Android device
  const androidResult = testCookieLogic(androidUserAgent);
  console.log('Android Device:');
  console.log(`  User-Agent: ${androidUserAgent.substring(0, 50)}...`);
  console.log(`  Detected as iOS: ${androidResult.isIOS}`);
  console.log(`  Cookie Options:`, androidResult.cookieOptions);
  console.log('');

  res.json({
    message: 'Cookie logic test completed',
    results: {
      ios: iosUserAgents.map(ua => ({
        userAgent: ua.substring(0, 50) + '...',
        ...testCookieLogic(ua)
      })),
      android: {
        userAgent: androidUserAgent.substring(0, 50) + '...',
        ...androidResult
      }
    }
  });
});

// Test session cookie setting
app.post('/test-login', (req, res) => {
  const userAgent = req.get('User-Agent');
  const { username } = req.body;

  console.log(`\n=== Login Test for ${username} ===`);
  console.log(`User-Agent: ${userAgent}`);

  // Apply the same logic as in auth.js
  const isIOS = userAgent && (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod'));
  
  let cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  };

  // iOS Safari requires specific cookie settings for proper handling
  if (isIOS) {
    cookieOptions.secure = true; // Always secure for iOS
    cookieOptions.sameSite = 'none'; // Required for iOS cross-origin
  }

  console.log(`Detected as iOS: ${isIOS}`);
  console.log('Cookie Options:', cookieOptions);

  // Set test session cookie
  res.cookie('testSessionToken', 'test-token-123', cookieOptions);

  res.json({
    message: 'Test login successful',
    isIOS,
    cookieOptions,
    userAgent: userAgent ? userAgent.substring(0, 100) + '...' : 'Not provided'
  });
});

// Test cookie reading
app.get('/test-session', (req, res) => {
  const sessionToken = req.cookies?.testSessionToken;
  const userAgent = req.get('User-Agent');
  
  console.log(`\n=== Session Test ===`);
  console.log(`User-Agent: ${userAgent}`);
  console.log(`Session Token: ${sessionToken || 'NOT FOUND'}`);

  res.json({
    hasSessionToken: !!sessionToken,
    sessionToken: sessionToken || null,
    userAgent: userAgent ? userAgent.substring(0, 100) + '...' : 'Not provided'
  });
});

app.listen(PORT, () => {
  console.log(`\n🧪 iOS Authentication Test Server running on port ${PORT}`);
  console.log(`\nTest endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/test-cookie-logic`);
  console.log(`  POST http://localhost:${PORT}/test-login`);
  console.log(`  GET  http://localhost:${PORT}/test-session`);
  console.log(`\nThis server tests the iOS cookie handling fix without affecting the main application.`);
  console.log(`\n=== Running Cookie Logic Test ===`);
  
  // Run initial test
  iosUserAgents.forEach((ua, index) => {
    const result = testCookieLogic(ua);
    console.log(`iOS Device ${index + 1}: Detected=${result.isIOS}, Secure=${result.cookieOptions.secure}, SameSite=${result.cookieOptions.sameSite}`);
  });
  
  const androidResult = testCookieLogic(androidUserAgent);
  console.log(`Android Device: Detected=${androidResult.isIOS}, Secure=${androidResult.cookieOptions.secure}, SameSite=${androidResult.cookieOptions.sameSite}`);
});