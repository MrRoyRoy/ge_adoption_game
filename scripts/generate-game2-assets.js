const fs = require('fs');
const path = require('path');
const { generateImage } = require('../vertex-client');

const GAME2_DIR = path.join(__dirname, '../public/assets/game2');
const LOBBY_DIR = path.join(__dirname, '../public/assets/lobby');

if (!fs.existsSync(GAME2_DIR)) {
  fs.mkdirSync(GAME2_DIR, { recursive: true });
}

if (!fs.existsSync(LOBBY_DIR)) {
  fs.mkdirSync(LOBBY_DIR, { recursive: true });
}

const assetsToGenerate = [
  {
    filePath: path.join(LOBBY_DIR, 'banner-game1.jpg'),
    prompt: 'A futuristic cybernetic digital art arena, holographic image prompt engineering interface, glowing neon purple and cyan glassmorphism vectors, dark luxury 8k digital art masterpiece'
  },
  {
    filePath: path.join(LOBBY_DIR, 'banner-game2.jpg'),
    prompt: 'Dark dramatic Bowser Koopa castle fortress, glowing magma lava, cybernetic terminal matrix interface, dark fantasy retro futuristic pixel art masterpiece'
  },
  {
    filePath: path.join(GAME2_DIR, 'task1-spell-lock.jpg'),
    prompt: 'Kamek magical spell-lock glowing barrier, floating blue runes, dark cybernetic magic gate, dark fantasy cinematic digital art'
  },
  {
    filePath: path.join(GAME2_DIR, 'task2-airship-fleet.jpg'),
    prompt: 'Bowsers armored airship war fleet flying through dark stormy clouds, glowing warning lights, epic cinematic military dark fantasy concept art'
  },
  {
    filePath: path.join(GAME2_DIR, 'task3-dungeon-castle.jpg'),
    prompt: 'Bowsers lava dungeon fortress gate, heavy steel chains, glowing red magma floor, sinister dark fantasy palace environment art'
  },
  {
    filePath: path.join(GAME2_DIR, 'bowser-cutout.jpg'),
    prompt: 'Paper cut out art style King Bowser celebrating victory, gold crown, spiked shell, fiery roar, clean solid dark dark background, paper craft layered texture style, high detail'
  },
  {
    filePath: path.join(GAME2_DIR, 'peach-cutout.jpg'),
    prompt: 'Paper cut out art style Princess Peach smiling happily, pink dress, gold crown, clean solid dark background, paper craft layered texture style, high detail'
  },
  {
    filePath: path.join(GAME2_DIR, 'mario-cutout.jpg'),
    prompt: 'Paper cut out art style Mario giving a thumbs up, red cap, blue overalls, clean solid dark background, paper craft layered texture style, high detail'
  }
];

async function run() {
  console.log('🚀 Generating thematic scene assets via gemini-3.5-flash-image-lite...');
  for (const item of assetsToGenerate) {
    if (fs.existsSync(item.filePath)) {
      console.log(`⏩ Asset already exists: ${path.basename(item.filePath)}`);
      continue;
    }
    
    console.log(`🎨 Generating: ${path.basename(item.filePath)}...`);
    try {
      const base64Data = await generateImage(item.prompt);
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(item.filePath, buffer);
      console.log(`✅ Saved: ${path.basename(item.filePath)} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`❌ Failed to generate ${path.basename(item.filePath)}:`, err.message);
    }
  }
  console.log('🎉 Asset generation process complete!');
}

run();
