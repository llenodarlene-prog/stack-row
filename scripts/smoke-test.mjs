const siteUrl = String(process.env.SITE_URL || '').replace(/\/$/, '');
if (!/^https:\/\//.test(siteUrl)) throw new Error('SITE_URL must be an HTTPS URL');

const paths = ['/', '/robots.txt', '/sitemap.xml'];
for (const pathname of paths) {
  let response;
  for (let attempt = 1; attempt <= 4; attempt++) {
    response = await fetch(`${siteUrl}${pathname}`, { headers: { 'user-agent': 'StackRowDeploymentCheck/1.0' } });
    if (response.ok) break;
    if (attempt < 4) await new Promise(resolve => setTimeout(resolve, attempt * 3000));
  }
  if (!response?.ok) throw new Error(`${pathname} returned ${response?.status}`);
}
const home = await (await fetch(`${siteUrl}/`)).text();
if (!home.includes('Stack Row')) throw new Error('homepage does not contain Stack Row');
console.log(`Smoke test passed for ${siteUrl}`);
