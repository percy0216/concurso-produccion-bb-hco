const fs = require('fs');
let content = fs.readFileSync('app/components/charts/AnalyticsCharts.tsx', 'utf8');

// The issue is that > in JSX text must be escaped as >
// Fix all occurrences of >8 min in text content
content = content.replace(/>8 min/g, '>8 min');

// Also fix any other > in text content that might cause issues
content = content.replace(/No cumplen \(>8 min\)/g, 'No cumplen (>8 min)');
content = content.replace(/Cumplen \(&le;8 min\)/g, 'Cumplen (&le;8 min)');
content = content.replace(/Meta \(&le;8 min\)/g, 'Meta (&le;8 min)');

// Also ensure no bare > in text content
content = content.replace(/>([0-9]+\s*min)/g, '>$1');

fs.writeFileSync('app/components/charts/AnalyticsCharts.tsx', content);
console.log('Fixed > escaping');