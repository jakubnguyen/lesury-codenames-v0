const fs = require('fs');
const dir = "packages/game-logic/src/games/guessio/__tests__";
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.received.txt'))) {
   const original = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf-8'));
   fs.writeFileSync(`${dir}/${file.replace('.received', '.approved')}`, JSON.stringify(original, null, 2));
}
