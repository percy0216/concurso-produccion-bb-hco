const fs = require('fs');
let content = fs.readFileSync('app/components/charts/AnalyticsCharts.tsx', 'utf8');

// Fix the >8 min issue - escape > as > in JSX text content
content = content.replace(
  '<p className="text-xs text-red-700">✗ No cumplen (>8 min)</p>',
  '<p className="text-xs text-red-700">✗ No cumplen (>8 min)</p>'
);

content = content.replace(
  '<p className="text-xs text-green-700">✓ Cumplen (&le;8 min)</p>',
  '<p className="text-xs text-green-700">✓ Cumplen (&le;8 min)</p>'
);

// Also fix any other > in text content
content = content.replace(/Cumplimiento de Meta \(&le;8 min\)/g, 'Cumplimiento de Meta (&le;8 min)');

fs.writeFileSync('app/components/charts/AnalyticsCharts.tsx', content);
console.log('Fixed > escaping');