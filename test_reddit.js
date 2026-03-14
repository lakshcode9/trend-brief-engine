import { fetchRedditSignals } from './src/trends/redditSignals.js';

async function testReddit() {
  console.log('Starting Reddit test...');
  try {
    const res = await fetchRedditSignals('AI in healthcare', ['digitalhealth', 'healthtech']);
    console.log('Reddit Success. Items:', res.length);
  } catch (err) {
    console.error('Reddit Error:', err);
  }
}
testReddit();
