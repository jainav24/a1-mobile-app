const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(srcDir, function(filePath) {
    if (!filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. pointerEvents="none" -> style={{ pointerEvents: 'none' }}
    content = content.replace(/pointerEvents="none"/g, 'style={{ pointerEvents: \'none\' }}');
    // For cases where there are already styles: style={[styles.x]} pointerEvents="none" -> we might need human care, but we'll safely try.
    // Instead of complex parsing, let's target just the ones the user highlighted in DashboardScreen and CadProperties if it exists.

    // 2. useNativeDriver: true -> useNativeDriver: false
    content = content.replace(/useNativeDriver:\s*true/g, 'useNativeDriver: false');

    // 3. Shadow props replacement regex
    // shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }
    // -> boxShadow: '0px 8px 16px rgba(0,0,0,0.08)'
    // Let's just do a naive substitution wherever we find a group of shadow props roughly
    const shadowRegex = /shadowColor:\s*['"]([^'"]+)['"],\s*shadowOpacity:\s*([\d.]+),\s*shadowRadius:\s*([\d.]+),\s*shadowOffset:\s*{\s*width:\s*([\d.]+),\s*height:\s*([\d.]+)\s*}/g;
    content = content.replace(shadowRegex, (match, color, opacity, radius, width, height) => {
        let rgba = `rgba(0,0,0,${opacity})`;
        if (color === '#D4AF37') rgba = `rgba(212,175,55,${opacity})`;
        return `boxShadow: '${width}px ${height}px ${radius}px ${rgba}'`;
    });
    
    const shadowRegex2 = /shadowColor:\s*['"]([^'"]+)['"],\s*shadowOffset:\s*{\s*width:\s*([\d.]+),\s*height:\s*([\d.]+)\s*},\s*shadowOpacity:\s*([\d.]+),\s*shadowRadius:\s*([\d.]+)/g;
    content = content.replace(shadowRegex2, (match, color, width, height, opacity, radius) => {
        let rgba = `rgba(0,0,0,${opacity})`;
        if (color === '#D4AF37') rgba = `rgba(212,175,55,${opacity})`;
        return `boxShadow: '${width}px ${height}px ${radius}px ${rgba}'`;
    });

    const textShadowRegex = /textShadowColor:\s*['"]([^'"]+)['"],\s*textShadowOffset:\s*{\s*width:\s*([\d.]+),\s*height:\s*([\d.]+)\s*},\s*textShadowRadius:\s*([\d.]+)/g;
    content = content.replace(textShadowRegex, (match, color, width, height, radius) => {
        return `textShadow: '${width}px ${height}px ${radius}px ${color}'`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
});
console.log("Migration complete.");
