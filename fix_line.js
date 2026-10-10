const fs = require('fs');
let content = fs.readFileSync('app/components/charts/AnalyticsCharts.tsx', 'utf8');

const oldLine = '              <p className="text-xs text-red-700">✗ No cumplen (>8 min)</p>';
const newLine = '              <p className="text-xs text-red-700">✗ No cumplen (>8 min)</p>';

if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync('app/components/charts/AnalyticsCharts.tsx', content);
  console.log('Replaced specific line');
} else {
  console.log('Old line not found');
  const idx = content.indexOf('No cumplen');
  if (idx !== -1) {
    console.log('Found at:', idx);
    console.log('Context:', content.substring(idx, idx + 50));
  }
}