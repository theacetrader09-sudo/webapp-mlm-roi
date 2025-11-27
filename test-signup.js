// Quick test script to verify signup API
const testSignup = async () => {
  const testData = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'test123456',
    referralCode: 'TEST1234'
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (!response.ok) {
      console.error('Signup failed:', data.error);
    } else {
      console.log('Signup successful!');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Run test
testSignup();

