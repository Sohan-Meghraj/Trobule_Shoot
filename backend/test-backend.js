import fetch from 'node-fetch';

async function testBackend() {
  try {
    console.log('🧪 Testing backend...');
    
    // Test health endpoint
    const health = await fetch('http://localhost:4000/api/health');
    console.log('✅ Health check:', await health.json());
    
    // Test query
    const response = await fetch('http://localhost:4000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'WiFi not working' })
    });
    
    const data = await response.json();
    console.log('✅ Query response:', data);
    
  } catch (error) {
    console.error('❌ Backend test failed:', error);
  }
}

testBackend();