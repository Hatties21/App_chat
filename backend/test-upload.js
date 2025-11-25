// Quick test script for upload endpoint
import fetch from 'node-fetch';

const testUploadEndpoint = async () => {
  try {
    // Test if route exists
    const response = await fetch('http://localhost:5001/api/upload/test');
    const data = await response.json();
    console.log('✅ Upload route test:', data);
  } catch (error) {
    console.error('❌ Upload route error:', error.message);
  }
};

testUploadEndpoint();
