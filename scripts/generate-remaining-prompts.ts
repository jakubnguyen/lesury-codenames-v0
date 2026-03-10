import fs from 'fs';
import path from 'path';

const items = `Lagos (Nigeria)
Cairo
Johannesburg
Jerusalem
Moscow
Baghdad
Tehran (Iran)
Dubai
Kabul (Afghanistan)
Maldives
New Delhi (India)
Kathmandu (Nepal)
Dhaka (Bangladesh)
Bangkok
Singapore
Beijing
Perth (Australia)
Tokyo
Adelaide
Sydney
Lord Howe Island
Auckland (New Zealand)
Chatham Islands
Tonga
Kiritimati (Line Islands)
Planck Length
Hydrogen Atom Diameter
DNA Strand (Uncoiled)
Red Blood Cell
Human Hair Width
Ant
Lego Brick
Golf Ball
Subway Sandwich
Guitar
King Cobra
Giraffe
London Bus
Giant Squid
Hollywood Sign
Bowling Lane
Blue Whale
Christ the Redeemer
Space Shuttle
Arc de Triomphe
Leaning Tower of Pisa
Boeing 747
Statue of Liberty
Football Field
Saturn V Rocket
Great Pyramid of Giza
Titanic
Eiffel Tower
Empire State Building
Seawise Giant
Burj Khalifa
Angel Falls
Golden Gate Bridge
Central Park
Mount Everest
Mariana Trench
Marathon
Channel Tunnel
Grand Canyon
Italy
Great Barrier Reef
Amazon River
Nile River
Trans-Siberian Railway
Great Wall of China
Equator
Distance to Moon
The Sun (Diameter)
Distance to Sun
Light Year
Camera Flash
Honeybee Wing Flap
Blink of an Eye
Human Reaction Time
One Heartbeat
Vine Video
Goldfish Attention Span
100m Sprint Record
Traffic Light Yellow
Commercial Break
One Minute
Pop Song
Egg Boiling (Soft)
Snooze Button
Half-Time (Football)
Sitcom Episode
ISS Orbit
Marathon Record
Titanic Movie
Work Day
Earth Rotation
One Day
Apollo 11 Mission
Cicada Life Cycle
Full Moon Cycle
Pregnancy (Human)
One Year
Mars Mission (One Way)
High School
World War II
Jupiter Orbit
Saturn Orbit
Average Human Life
Halley's Comet
Pluto Orbit
Roman Empire
Great Pyramid Age
Recorded History
Ice Age Duration
Human Species Age
Dinosaur Era
Milky Way Rotation
Age of Earth
Age of Sun
Age of Universe
Carbon-14 Half Life
Plastic Bottle Decay
Chernobyl Safety
A "Jiffy"
One Microcentury
Celery Stalk
Tic Tac
Chewing Gum
Cucumber (Slice)
Espresso Shot
Strawberry
Almond
Hershey's Kiss
Oreo Cookie
Apple
Banana
Coca-Cola (Can)
Beer (Pint)
Snickers Bar
Avocado
Ramen Noodles
Big Mac
Full English Breakfast
Large Pizza (Pepperoni)
Stick of Butter
MRE (Meal Ready to Eat)
Human Daily Intake (Male)
1kg of Body Fat
Tour de France Stage
Michael Phelps Diet
Coal (1kg)
Gasoline (1 Gallon)
Lightning Bolt
TNT (1kg)
Smartphone Battery
AA Battery
Uranium (1 gram)
Hiroshima Bomb
Hurricane
9V Battery
Shot of Vodka
Cup of Rice (Cooked)
Cheesecake Slice
Thanksgiving Dinner
Blue Whale (Mouthful)
Barrel of Oil
Car Battery
Stick of Dynamite
Tsunami
Earthquake (Mag 7)
Meteor Impact (Dinosaur Killer)
Sun (Per Second)
Supernova
Tic Tac (Mint)
Diet Coke
Mayfly
Drone Ant
House Fly
Dragonfly
Worker Bee
Mouse
Hamster
Guinea Pig
Kangaroo
Domestic Rabbit
Great Dane
Chihuahua
Cheetah
Lion
Domestic Cat
Queen Ant
Polar Bear
Horse
Chimpanzee
Goldfish
African Elephant
Average Human
Orca (Killer Whale)
Macaw (Parrot)
Lobster
Blue Whale
Human (Record)
Giant Tortoise
Bowhead Whale
Koi Fish
Greenland Shark
Quahog Clam
Bristlecone Pine
Glass Sponge
Immortal Jellyfish
Plastic Bottle
Aluminum Can
Styrofoam Cup
Cigarette Butt
Apple Core
Red Dwarf Star
The Sun
Massive Star (Type O)
Proton
Civilization
US Dollar Bill
Coin
Hard Drive
GPS Satellite
Nuclear Waste (Pu-239)
Absolute Zero
Boomerang Nebula
Liquid Helium
Pluto Surface
Liquid Nitrogen
Vostok Station
Dry Ice
Mars Surface (Avg)
Mercury (Night)
Commercial Freezer
Water Freezing Point
Fridge Temperature
Room Temperature
Human Body
Death Valley Record
Sauna
Water Boiling Point
Maillard Reaction
Paper Burns
Lead Melting Point
Venus Surface
Wood Fire
Lava
Jet Engine (Inside)
Light Bulb Filament
Iron Melting Point
Diamond Melting Point
Sun Surface
Earth's Core
Lightning Bolt
Nuclear Explosion
Sun's Core
ITER Fusion Reactor
Supernova
Large Hadron Collider
Universe (1s after Big Bang)
Planck Temperature
Pizza Oven
Cremation
Bunsen Burner
Candle Flame
Deep Space
Surface of Mercury (Day)
Oven (Baking)
Hot Tub
Coldest Shower
Coffee (Serving)
Steak (Medium Rare)
Chicken (Cooked Safe)
Sous Vide Egg`
    .split('\n')
    .filter(Boolean);

const colorPalettes = [
    'soft blue, mint green, light grey',
    'pastel pink, soft yellow, light grey',
    'pastel green, soft brown, light yellow',
    'light blue, soft red, pastel grey',
    'mint green, soft blue, pastel white',
    'pastel purple, light grey, soft blue',
    'soft red, light white, pastel blue',
    'light brown, pastel orange, soft grey',
    'soft grey, light red, pastel blue',
    'pastel orange, soft pink, light blue',
];

let markdownOutput = '# Generated Prompts\\n\\n';
let startId = 226;

items.forEach((item, index) => {
    const color = colorPalettes[index % colorPalettes.length];
    const prompt = `Minimalistic hand-drawn line art of **${item}**, single continuous black line feeling. The background behind the line art features a few loose, abstract pastel color blob shadings (e.g. ${color}) that do not strictly stay within the lines, similar to a watercolor or digital brush wash behind the drawing. Clean white background overall. Monoline vector style icon.`;
    markdownOutput += `**${startId + index}. ${item}**\n> ${prompt}\n\n`;
});

const outputPath = path.join(process.env.HOME || '', 'Desktop', 'remaining_card_prompts.md');
fs.writeFileSync(outputPath, markdownOutput);
console.log(`Saved ${items.length} prompts to ${outputPath}`);
