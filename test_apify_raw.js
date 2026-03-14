import { ApifyClient } from 'apify-client';
import { APIFY_API_KEY } from './src/utils/config.js';

async function test() {
  const client = new ApifyClient({ token: APIFY_API_KEY });
  try {
    const run = await client.actor('apify/google-trends-scraper').call({
      searchTerms: ['AI in healthcare'],
      timeRange: '',
      geo: '',
      isMultiple: false,
      isPublic: false,
      category: '',
      extendOutputFunction: ''
    }, { waitSecs: 120, memory: 512 });
    console.log('Success!', run);
  } catch (err) {
    console.error('RAW ERROR MESSAGE:');
    console.error(err.message);
  }
}
test();
