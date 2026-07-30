const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\User\\.gemini\\antigravity-cli\\brain\\589fed30-456a-4ca5-9ba5-2fb96d1083a4';
const logoJpg = path.join(brainDir, 'nss_directstay_logo_1785431101341.jpg');
const ogJpg = path.join(brainDir, 'nss_link_preview_1785431146397.jpg');

const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'src', 'app');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

// Copy logo JPG to public and app
const logoTargets = [
  path.join(publicDir, 'logo.jpg'),
  path.join(publicDir, 'logo.png'),
  path.join(publicDir, 'icon.png'),
  path.join(publicDir, 'apple-touch-icon.png'),
  path.join(publicDir, 'apple-touch-icon.jpg'),
  path.join(appDir, 'icon.png'),
  path.join(appDir, 'apple-icon.png'),
  path.join(appDir, 'apple-icon.jpg'),
];

logoTargets.forEach(dest => {
  fs.copyFileSync(logoJpg, dest);
  console.log('Copied logo to:', dest);
});

// Copy OpenGraph banner JPG to public and app
const ogTargets = [
  path.join(publicDir, 'og-image.jpg'),
  path.join(publicDir, 'og-image.png'),
  path.join(appDir, 'opengraph-image.jpg'),
  path.join(appDir, 'opengraph-image.png'),
  path.join(appDir, 'twitter-image.jpg'),
  path.join(appDir, 'twitter-image.png'),
];

ogTargets.forEach(dest => {
  fs.copyFileSync(ogJpg, dest);
  console.log('Copied OG image to:', dest);
});

// Remove old vercel favicon.ico if it exists, replace with logoJpg copy or ICO format
try {
  fs.copyFileSync(logoJpg, path.join(publicDir, 'favicon.ico'));
  fs.copyFileSync(logoJpg, path.join(appDir, 'favicon.ico'));
  console.log('Replaced favicon.ico in public and app');
} catch (e) {
  console.error('Error replacing favicon.ico:', e);
}

// Copy SVG to public as logo.svg and favicon.svg
const svgSource = path.join(publicDir, 'icon.svg');
if (fs.existsSync(svgSource)) {
  fs.copyFileSync(svgSource, path.join(publicDir, 'logo.svg'));
  fs.copyFileSync(svgSource, path.join(publicDir, 'favicon.svg'));
  console.log('Copied SVG to logo.svg and favicon.svg');
}
