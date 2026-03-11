const PARTIALS = [
  { slot: 'slot-starfish', file: 'starfish.html' },
  { slot: 'slot-octopus', file: 'octopus.html' },
  { slot: 'slot-crab', file: 'crab.html' },
  { slot: 'slot-sea-horse', file: 'sea-horse.html' },
  { slot: 'slot-ball-fish', file: 'ball-fish.html' },
];

async function loadAnimals() {
  for (const part of PARTIALS) {
    const target = document.getElementById(part.slot);
    if (!target) continue;

    try {
      const response = await fetch(part.file);
      if (!response.ok) throw new Error(`Failed to load ${part.file}`);
      target.innerHTML = await response.text();
    } catch (error) {
      target.textContent = `Could not load ${part.file}`;
      target.style.color = '#ffe9a8';
    }
  }
}

loadAnimals();
