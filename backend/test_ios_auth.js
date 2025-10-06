const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3001/api';
const iOS_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// Test credentials
const TEST_STUDENT = {
  username: '220000001812',
  password: 'student123'
};

const TEST_COUNSELOR = {
  email: 'testcounselor@eunoia.edu', 
  password: '12345678'
};

class iOSAuthTester {
  constructor() {
    this.cookieJar = new Map();
  }

  // Simulate iOS cookie handling
  extractCookies(response) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(',').map(cookie => cookie.trim());
      cookies.forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          this.cookieJar.set(name.trim(), value.trim());
        }
      });
    }
  }

  // Get cookies for request
  getCookieHeader() {
    const cookies = Array.from(this.cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    return cookies;
  }

  // Make authenticated request with iOS headers
  async makeRequest(endpoint, options = {}) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'User-Agent': iOS_USER_AGENT,
      ...options.headers
    });

    // Add cookies if available
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers.set('Cookie', cookieHeader);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Extract cookies from response
    this.extractCookies(response);

    return response;
  }

  // Test student login flow
  async testStudentLogin() {
    console.log('\n🧪 Testing Student Login Flow (iOS Simulation)');
    console.log('=' .repeat(50));

    try {
      // 1. Login request
      console.log('1. Attempting student login...');
      const loginResponse = await this.makeRequest('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify(TEST_STUDENT)
      });

      const loginData = await loginResponse.json();
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Response:`, loginData);
      console.log(`   Cookies received:`, Array.from(this.cookieJar.entries()));

      if (loginResponse.status !== 200) {
        throw new Error(`Login failed: ${loginData.error || 'Unknown error'}`);
      }

      // 2. Test profile access immediately after login
      console.log('\n2. Testing immediate profile access...');
      const profileResponse = await this.makeRequest('/auth/student/profile');
      const profileData = await profileResponse.json();
      
      console.log(`   Status: ${profileResponse.status}`);
      console.log(`   Response:`, profileData);

      if (profileResponse.status !== 200) {
        throw new Error(`Profile access failed: ${profileData.error || 'Unknown error'}`);
      }

      // 3. Test profile access after delay (simulate navigation)
      console.log('\n3. Testing profile access after delay...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const delayedProfileResponse = await this.makeRequest('/auth/student/profile');
      const delayedProfileData = await delayedProfileResponse.json();
      
      console.log(`   Status: ${delayedProfileResponse.status}`);
      console.log(`   Response:`, delayedProfileData);

      if (delayedProfileResponse.status !== 200) {
        throw new Error(`Delayed profile access failed: ${delayedProfileData.error || 'Unknown error'}`);
      }

      // 4. Test logout
      console.log('\n4. Testing logout...');
      const logoutResponse = await this.makeRequest('/auth/logout', {
        method: 'POST'
      });
      
      const logoutData = await logoutResponse.json();
      console.log(`   Status: ${logoutResponse.status}`);
      console.log(`   Response:`, logoutData);

      console.log('\n✅ Student login flow test PASSED');
      return true;

    } catch (error) {
      console.log(`\n❌ Student login flow test FAILED: ${error.message}`);
      return false;
    }
  }

  // Test counselor login flow
  async testCounselorLogin() {
    console.log('\n🧪 Testing Counselor Login Flow (iOS Simulation)');
    console.log('=' .repeat(50));

    // Clear cookies from previous test
    this.cookieJar.clear();

    try {
      // 1. Login request
      console.log('1. Attempting counselor login...');
      const loginResponse = await this.makeRequest('/auth/counselor/login', {
        method: 'POST',
        body: JSON.stringify(TEST_COUNSELOR)
      });

      const loginData = await loginResponse.json();
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Response:`, loginData);
      console.log(`   Cookies received:`, Array.from(this.cookieJar.entries()));

      if (loginResponse.status !== 200) {
        throw new Error(`Login failed: ${loginData.error || 'Unknown error'}`);
      }

      // 2. Test profile access immediately after login
      console.log('\n2. Testing immediate profile access...');
      const profileResponse = await this.makeRequest('/auth/counselor/profile');
      const profileData = await profileResponse.json();
      
      console.log(`   Status: ${profileResponse.status}`);
      console.log(`   Response:`, profileData);

      if (profileResponse.status !== 200) {
        throw new Error(`Profile access failed: ${profileData.error || 'Unknown error'}`);
      }

      // 3. Test profile access after delay (simulate navigation)
      console.log('\n3. Testing profile access after delay...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const delayedProfileResponse = await this.makeRequest('/auth/counselor/profile');
      const delayedProfileData = await delayedProfileResponse.json();
      
      console.log(`   Status: ${delayedProfileResponse.status}`);
      console.log(`   Response:`, delayedProfileData);

      if (delayedProfileResponse.status !== 200) {
        throw new Error(`Delayed profile access failed: ${delayedProfileData.error || 'Unknown error'}`);
      }

      // 4. Test logout
      console.log('\n4. Testing logout...');
      const logoutResponse = await this.makeRequest('/auth/logout', {
        method: 'POST'
      });
      
      const logoutData = await logoutResponse.json();
      console.log(`   Status: ${logoutResponse.status}`);
      console.log(`   Response:`, logoutData);

      console.log('\n✅ Counselor login flow test PASSED');
      return true;

    } catch (error) {
      console.log(`\n❌ Counselor login flow test FAILED: ${error.message}`);
      return false;
    }
  }

  // Test cookie persistence simulation
  async testCookiePersistence() {
    console.log('\n🧪 Testing Cookie Persistence (iOS Simulation)');
    console.log('=' .repeat(50));

    // Clear cookies
    this.cookieJar.clear();

    try {
      // Login first
      console.log('1. Logging in to establish session...');
      const loginResponse = await this.makeRequest('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify(TEST_STUDENT)
      });

      if (loginResponse.status !== 200) {
        throw new Error('Login failed for cookie persistence test');
      }

      console.log(`   Cookies after login:`, Array.from(this.cookieJar.entries()));

      // Simulate multiple requests with cookie persistence
      console.log('\n2. Testing multiple authenticated requests...');
      for (let i = 1; i <= 5; i++) {
        console.log(`   Request ${i}:`);
        const response = await this.makeRequest('/auth/student/profile');
        console.log(`     Status: ${response.status}`);
        console.log(`     Cookies maintained:`, Array.from(this.cookieJar.entries()));
        
        if (response.status !== 200) {
          throw new Error(`Request ${i} failed - cookie not persisted`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('\n✅ Cookie persistence test PASSED');
      return true;

    } catch (error) {
      console.log(`\n❌ Cookie persistence test FAILED: ${error.message}`);
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting iOS Authentication Flow Tests');
    console.log('=' .repeat(60));

    const results = {
      studentLogin: await this.testStudentLogin(),
      counselorLogin: await this.testCounselorLogin(),
      cookiePersistence: await this.testCookiePersistence()
    };

    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(30));
    console.log(`Student Login:     ${results.studentLogin ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Counselor Login:   ${results.counselorLogin ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Cookie Persistence: ${results.cookiePersistence ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(result => result);
    console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (allPassed) {
      console.log('\n🎉 iOS authentication flow is working correctly!');
      console.log('The implemented fixes should resolve the iOS login issue.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the error messages above.');
    }

    return allPassed;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new iOSAuthTester();
  tester.runAllTests().catch(console.error);
}

module.exports = iOSAuthTester;