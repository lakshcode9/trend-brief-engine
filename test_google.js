import { fetchGoogleTrends } from './src/trends/googleTrends.js';

async function testGoogle() {
  console.log('Starting Google Trends test...');
  try {
    const res = await fetchGoogleTrends('AI in healthcare');
    console.log('Google Trends Success. Items:', res.length);
  } catch (err) {
    console.error('Google Error:', err);
  }
}
testGoogle();
