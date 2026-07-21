// 20 diverse, structured master images for the GE Adoption Game
const masterLibrary = [
  {
    index: 1,
    title: "Neon Dreams of Victoria Harbour",
    category: "Hong Kong Elements",
    style: "Cyberpunk Cityscape",
    difficulty: "Medium",
    prompt: "A cinematic long-exposure photograph of Victoria Harbour in Hong Kong at night, glowing neon-cyan and purple billboards reflecting on the shimmering water, traditional wooden junk boat sailing in the center, modern skyscrapers in the background covered in volumetric fog, ultra-detailed, 8k resolution, shot on 35mm lens.",
    filename: "master-1.jpg"
  },
  {
    index: 2,
    title: "Spirited Anime Shrine",
    category: "Japanese Anime",
    style: "Studio Ghibli Aesthetic",
    difficulty: "Easy",
    prompt: "An atmospheric anime background illustration of a traditional Japanese torii gate standing at the entrance of a glowing ancient forest at dusk, cherry blossom petals gently floating in the wind, soft magical light rays filtering through the dense canopy, hand-drawn digital painting style, vibrant pastel colors.",
    filename: "master-2.jpg"
  },
  {
    index: 3,
    title: "Vogue High-Fashion Studio Portrait",
    category: "Model Photography",
    style: "Editorial Studio",
    difficulty: "Hard",
    prompt: "A high-fashion editorial studio photograph of an elegant model wearing an avant-garde metallic silver structured gown, dramatic high-contrast side lighting (chiaroscuro), deep shadows, sharp focus on eyes, minimalist dark gray textured background, shot on Hasselblad, 85mm lens, f/1.8.",
    filename: "master-3.jpg"
  },
  {
    index: 4,
    title: "Gaze of the Renaissance",
    category: "Classic Art Pieces",
    style: "Oil on Canvas",
    difficulty: "Hard",
    prompt: "A classic oil painting portrait of a noble merchant in 15th-century Europe, wearing dark velvet robes with fur trim, sitting near a window with soft natural northern light illuminating his face, rich sfumato details, warm amber and earthy brown color palette, visible canvas brushstrokes, in the style of Rembrandt.",
    filename: "master-4.jpg"
  },
  {
    index: 5,
    title: "Majestic Guardian of the Snow",
    category: "Animal Kingdom",
    style: "Wildlife Photography",
    difficulty: "Medium",
    prompt: "A breathtaking close-up wildlife photograph of a majestic snow leopard crouching on a snow-covered mountain cliff in the Himalayas, intense blue eyes looking directly into the camera, heavy blizzard swirling in the background, sharp details on fur and whiskers, national geographic style, shot on 400mm telephoto lens.",
    filename: "master-5.jpg"
  },
  {
    index: 6,
    title: "The Alchemist's Study",
    category: "Different Centuries",
    style: "17th Century Interior",
    difficulty: "Medium",
    prompt: "An intricate interior photograph of a 17th-century alchemist's library, shelves overflowing with ancient leather-bound books and glass vials containing glowing liquids, an open celestial map on a heavy wooden desk, a single candle burning in a brass holder casting long flickering shadows, warm mystery, dusty atmosphere.",
    filename: "master-6.jpg"
  },
  {
    index: 7,
    title: "Futuristic Lunar Colony",
    category: "Cinematic Sci-Fi",
    style: "Concept Art",
    difficulty: "Medium",
    prompt: "A futuristic sci-fi concept art of a sprawling human colony on the surface of the moon, biosphere domes glowing with warm interior light, astronauts in high-tech suits working near a lunar rover, Earth visible as a brilliant blue marble in the pitch-black space background, realistic starfield, cinematic lighting.",
    filename: "master-7.jpg"
  },
  {
    index: 8,
    title: "The Dim Sum Teahouse",
    category: "Hong Kong Elements",
    style: "Vintage Documentary",
    difficulty: "Easy",
    prompt: "A warm, vintage documentary photograph of a bustling traditional dim sum teahouse in Hong Kong during the 1980s, steam rising majestically from stacks of bamboo baskets, elderly local residents reading newspapers, retro green tiled walls, cinematic film grain, warm nostalgic lighting.",
    filename: "master-8.jpg"
  },
  {
    index: 9,
    title: "Cyber-Street Samurai",
    category: "Japanese Anime",
    style: "Neo-Tokyo Cyberpunk",
    difficulty: "Hard",
    prompt: "A striking neo-Tokyo cyberpunk anime illustration of a female cyber-samurai standing in a rainy alleyway, neon signs in Japanese letters reflecting on wet puddles, holding a glowing katana, wearing a sleek techwear jacket and visor, futuristic cybernetic details, highly stylized, bold key visual.",
    filename: "master-9.jpg"
  },
  {
    index: 10,
    title: "Ethereal Forest Nymph",
    category: "Model Photography",
    style: "Fantasy Portraiture",
    difficulty: "Medium",
    prompt: "An ethereal fantasy portrait of a model dressed as a forest nymph, wearing a crown made of glowing moss and wild orchids, standing in a sun-drenched enchanted redwood forest, surrounded by floating golden fireflies, dreamlike double-exposure effect, soft pastel tone curves.",
    filename: "master-10.jpg"
  },
  {
    index: 11,
    title: "The Great Wave Reimagined",
    category: "Classic Art Pieces",
    style: "Ukiyo-e Woodblock Print",
    difficulty: "Hard",
    prompt: "A traditional Japanese ukiyo-e woodblock print representing giant, curling ocean waves with white foam crests crashing down, Mount Fuji with snow-capped peak visible in the far background, old wooden fishing boats navigating the fierce waves, textured washi paper effect, indigo and beige inks.",
    filename: "master-11.jpg"
  },
  {
    index: 12,
    title: "Ancient Mayan Secrets",
    category: "Cultures & Ages",
    style: "Adventure Archaeology",
    difficulty: "Medium",
    prompt: "A majestic wide-angle photograph of an ancient Mayan pyramid towering over a dense, misty tropical jungle at sunrise, golden sunbeams piercing through the morning fog, exotic birds in flight, historical stone carvings covered in green moss, dramatic lighting, epic cinematic scale.",
    filename: "master-12.jpg"
  },
  {
    index: 13,
    title: "The Red Planet Expedition",
    category: "Cinematic Sci-Fi",
    style: "Macro Terrain",
    difficulty: "Medium",
    prompt: "A dramatic wide shot of a rugged red Martian valley, a high-tech exploration habitat situated near a massive rust-colored dust storm, a research drone hovering above the ground emitting a blue scanning laser beam, dusty atmosphere, deep orange and crimson color palette.",
    filename: "master-13.jpg"
  },
  {
    index: 14,
    title: "Monet's Water Lily Pond",
    category: "Classic Art Pieces",
    style: "Impressionist Oil",
    difficulty: "Medium",
    prompt: "An impressionist oil painting of a serene pond filled with blooming pink and white water lilies, a green wooden bridge arching gracefully over the water, weeping willow branches sweeping the water's surface, vibrant textured brushstrokes capturing the reflection of dappled sunlight, in the style of Claude Monet.",
    filename: "master-14.jpg"
  },
  {
    index: 15,
    title: "Vintage Serengeti Safari",
    category: "Cultures & Ages",
    style: "Historical Sepia",
    difficulty: "Easy",
    prompt: "A beautiful sepia-toned vintage historical photograph of an open safari vehicle driving through the wide grasslands of the Serengeti, majestic acacia trees silhouetted against a setting sun, a herd of elephants walking slowly in the background, dust clouds, retro border, film scratch texture.",
    filename: "master-15.jpg"
  },
  {
    index: 16,
    title: "The Steampunk Locomotive",
    category: "Different Centuries",
    style: "Steampunk Alternate History",
    difficulty: "Medium",
    prompt: "A powerful steampunk train locomotive charging forward on brass tracks, thick white steam billow from large copper chimneys, intricate clockwork gears and piping exposed along the train body, Victorian passengers waiting on a metal platform under a glass dome ceiling, warm bronze and copper tones.",
    filename: "master-16.jpg"
  },
  {
    index: 17,
    title: "Neon Alleyways of Mong Kok",
    category: "Hong Kong Elements",
    style: "Urban Street Photography",
    difficulty: "Easy",
    prompt: "A vibrant street-level photograph of a narrow neon-lit alleyway in Mong Kok, Hong Kong, on a rainy night, traditional shop signs in red and green Chinese characters reflecting on wet asphalt, steam rising from food stalls, a single figure walking under a transparent umbrella, rich contrast.",
    filename: "master-17.jpg"
  },
  {
    index: 18,
    title: "Dune of the Nomad",
    category: "Cultures & Ages",
    style: "Desert Landscape",
    difficulty: "Easy",
    prompt: "A stunning minimalist desert landscape photograph, massive sand dunes with sharp wind-blown ridges under a dramatic orange sunset sky, a lone nomad leading a camel caravan walking along the spine of a giant dune, casting long elegant shadows across the golden sand.",
    filename: "master-18.jpg"
  },
  {
    index: 19,
    title: "Oceanic Bioluminescence",
    category: "Animal Kingdom",
    style: "Macro Nature",
    difficulty: "Hard",
    prompt: "A magical macro underwater photograph of a translucent glowing jellyfish swimming in the deep dark ocean, emit vibrant neon blue and emerald bioluminescent light, tiny glowing plankton floating in the water column like a underwater starfield, soft focus, high-end marine documentary style.",
    filename: "master-19.jpg"
  },
  {
    index: 20,
    title: "Interstellar Library of Light",
    category: "Cinematic Sci-Fi",
    style: "Abstract Architecture",
    difficulty: "Hard",
    prompt: "An awe-inspiring abstract interior space representing a library spanning across multiple dimensions of light, endless floating columns of books made of pure energy, a central warm gravitational sphere of light bending the perspectives of bookshelves, deep navy and gold sparkles, cosmic surrealism.",
    filename: "master-20.jpg"
  }
];

module.exports = masterLibrary;
