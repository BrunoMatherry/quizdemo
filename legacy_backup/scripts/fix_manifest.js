var fs = require('fs');
var path = require('path');

var manifestPath = path.join(__dirname, '../platforms/android/app/src/main/AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
    console.log('AndroidManifest.xml não encontrado — a saltar');
    return;
}

var content = fs.readFileSync(manifestPath, 'utf8');

// 1. Substituir placeholder antigo (caso ainda exista)
content = content.replace(/ca-app-pub-xxx~yyy/g, 'ca-app-pub-1954059473041916~4485783999');

// 2. Remover entradas duplicadas do APPLICATION_ID — manter apenas a primeira
var admobEntry = '<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"';
var lines = content.split('\n');
var seen = false;
lines = lines.filter(function(line) {
    if (line.indexOf(admobEntry) !== -1) {
        if (seen) return false; // apagar duplicados
        seen = true;
    }
    return true;
});
content = lines.join('\n');

fs.writeFileSync(manifestPath, content, 'utf8');
console.log('✅ AndroidManifest.xml corrigido (sem duplicados)!');
