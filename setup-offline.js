const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, 'public', 'models');
const LIB_DIR = path.join(__dirname, 'public', 'lib');

const MODEL_FILES = [
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json'
];

const LIB_FILES = [
  { name: 'face-api.min.js', url: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js' }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Créé: ${dir}`);
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    console.log(`Téléchargement: ${path.basename(dest)}...`);

    const request = (url) => {
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          fs.unlinkSync(dest);
          const newFile = fs.createWriteStream(dest);
          request(response.headers.location);
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`  OK: ${path.basename(dest)}`);
          resolve();
        });
      }).on('error', (err) => {
        fs.unlinkSync(dest);
        reject(err);
      });
    };

    request(url);
  });
}

async function main() {
  console.log('Configuration du mode hors-ligne...\n');

  ensureDir(MODELS_DIR);
  ensureDir(LIB_DIR);

  console.log('Téléchargement du modèle de détection faciale...');
  for (const file of MODEL_FILES) {
    const url = `https://raw.githubusercontent.com/nicholasmordecai/face-api-backup/master/weights/${file}`;
    const dest = path.join(MODELS_DIR, file);
    if (!fs.existsSync(dest)) {
      await downloadFile(url, dest);
    } else {
      console.log(`  Existe déjà: ${file}`);
    }
  }

  console.log('\nTéléchargement de la bibliothèque face-api...');
  for (const lib of LIB_FILES) {
    const dest = path.join(LIB_DIR, lib.name);
    if (!fs.existsSync(dest)) {
      await downloadFile(lib.url, dest);
    } else {
      console.log(`  Existe déjà: ${lib.name}`);
    }
  }

  console.log('\nConfiguration terminée!');
  console.log('Lancez: npm start');
  console.log('Puis ouvrez: http://localhost:3000');
}

main().catch(console.error);
