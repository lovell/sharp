# sharp

<picture><img src="https://sharp.pixelplumbing.com/sharp-logo.svg" width="160" height="160" alt="sharp logo" align="right"></picture>

The typical use case for this high speed Node-API module
is to convert large images in common formats to
smaller, web-friendly JPEG, PNG, WebP, GIF and AVIF images of varying dimensions.

It can be used with all JavaScript runtimes
that provide support for Node-API v9, including
Node.js (>= 20.9.0), Deno and Bun.

Resizing an image is typically 4x-5x faster than using the
quickest ImageMagick and GraphicsMagick settings
due to its use of [libvips](https://github.com/libvips/libvips).

Colour spaces, embedded ICC profiles and alpha transparency channels are all handled correctly.
Lanczos resampling ensures quality is not sacrificed for speed.

As well as image resizing, operations such as
rotation, extraction, compositing and gamma correction are available.

Most modern macOS, Windows and Linux systems
do not require any additional install or runtime dependencies.

## Documentation

Visit [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com/) for complete
[installation instructions](https://sharp.pixelplumbing.com/install),
[API documentation](https://sharp.pixelplumbing.com/api-constructor),
[benchmark tests](https://sharp.pixelplumbing.com/performance) and
[changelog](https://sharp.pixelplumbing.com/changelog).

## Examples

```sh
npm install sharp
```

```javascript
// ESM
import sharp from 'sharp';

// CJS
const sharp = require('sharp');
```

```javascript
await sharp(inputBuffer)
  .resize({ width: 320, height: 240 })
  .toFile('output.webp', (err, info) => { ... });
```

```javascript
const output = await sharp('input.jpg')
  .autoOrient()
  .resize({ width: 200 })
  .jpeg({ mozjpeg: true })
  .toBuffer();
```

```javascript
const semiTransparentRedPng = await sharp({
  create: {
    width: 48,
    height: 48,
    channels: 4,
    background: { r: 255, g: 0, b: 0, alpha: 0.5 }
  }
})
  .png()
  .toBuffer();
```

```javascript
const roundedCorners = Buffer.from(
  '<svg><rect x="0" y="0" width="200" height="200" rx="50" ry="50"/></svg>'
);

const roundedCornerResizer =
  sharp()
    .resize(200, 200)
    .composite([{
      input: roundedCorners,
      blend: 'dest-in'
    }])
    .png();

readableStream
  .pipe(roundedCornerResizer)
  .pipe(writableStream);
```

## Contributing

A [guide for contributors](https://github.com/lovell/sharp/blob/main/.github/CONTRIBUTING.md)
covers reporting bugs, requesting features and submitting code changes.

## Licensing

Copyright 2013 Lovell Fuller and others.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[https://www.apache.org/licenses/LICENSE-2.0](https://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.


## 🌐 Web Resources & Interactive Index
- [SOLITAIRE QUEST](https://ilearnworld.pages.dev/solitaire-quest.html)
- [BRAINROT CLEANING](https://quizverses-9d2f2.web.app/brainrot-cleaning.html)
- [MONONINJA](https://learnquester.pages.dev/mononinja.html)
- [FASHION PRINCESS DRESS UP FOR GIRLS](https://thelearnquesters.pages.dev/fashion-princess-dress-up-for-girls.html)
- [CATEGORY MATCH 3 2](https://learnquesters.pages.dev/category-match-3-2.html)
- [CATEGORY CASUAL 2](https://quizverses.pages.dev/category-casual-2.html)
- [INDEX26](https://themindzone.pages.dev/index26.html)
- [CATEGORY DIFFICULT81](https://quizverses-9d2f2.web.app/category-difficult81.html)
- [IDOL LIVESTREAM DOLL DRESS UP](https://learnquester.github.io/idol-livestream-doll-dress-up.html)
- [VSCO GIRL AESTHETIC](https://themindzone.pages.dev/vsco-girl-aesthetic.html)
- [INDEX10](https://studyquesthub.web.app/index10.html)
- [ROYAL CROWN BLAST](https://themindzone.pages.dev/royal-crown-blast.html)
- [CATEGORY RPG80](https://quizverses.pages.dev/category-rpg80.html)
- [PURRFECT SCOOPS](https://studyplayings.web.app/purrfect-scoops.html)
- [CATEGORY SIDE SCROLLING184](https://themindplay.github.io/category-side-scrolling184.html)
- [TSUNAMI BRAINROTS ONLINE](https://studyplaying.github.io/tsunami-brainrots-online.html)
- [COSMO PET STARRY CARE](https://themindzone.pages.dev/cosmo-pet-starry-care.html)
- [BACKWOODS](https://quizverses.github.io/backwoods.html)
- [PIECE OF CAKE MERGE AND BAKE](https://themindzone.pages.dev/piece-of-cake-merge-and-bake.html)
- [HAPPY FARM THE CROP](https://quizverses.pages.dev/happy-farm-the-crop.html)
- [CATEGORY ADVENTURE 2](https://thelearnquesters.pages.dev/category-adventure-2.html)
- [ULTIMATE YATZY](https://iskillquest.pages.dev/ultimate-yatzy.html)
- [MINITOSS](https://learnquesters.pages.dev/minitoss.html)
- [MATCH COLLECTION](https://iskillquest.pages.dev/match-collection.html)
- [SOUL NOT FOUND](https://learnquester.github.io/soul-not-found.html)
- [POOL BUBBLES](https://quizverses.github.io/pool-bubbles.html)
- [CATEGORY FPS](https://learnquester.pages.dev/category-fps.html)
- [MOJICON FRUIT CONNECT](https://learnquesters.pages.dev/mojicon-fruit-connect.html)
- [CATEGORY TOP DOWN251](https://learnquesters.pages.dev/category-top-down251.html)
- [PIN PUZZLE LOVE STORY](https://quizverses-9d2f2.web.app/pin-puzzle-love-story.html)
- [HELICOPTER BATTLE STEVE 2 PLAYER](https://quizverses-9d2f2.web.app/helicopter-battle-steve-2-player.html)
- [PETS VS BEES](https://themindzone.pages.dev/pets-vs-bees.html)
- [CATEGORY SIMULATION 5](https://studyplaying.github.io/category-simulation-5.html)
- [CATEGORY CASUAL 7](https://themindzone.pages.dev/category-casual-7.html)
- [CATEGORY CAN T STOP PLAYING212](https://learnquesters.pages.dev/category-can-t-stop-playing212.html)
- [CATEGORY CASUAL 5](https://iskillquest.pages.dev/category-casual-5.html)
- [OBBY DUMB OR GENIUS IQ TEST](https://iskillquest.pages.dev/obby-dumb-or-genius-iq-test.html)
- [STICKMAN DUO ESCAPE THE TOMB](https://theskillquest.pages.dev/stickman-duo-escape-the-tomb.html)
- [REAL CAR PARKING AND STUNT](https://learnquester.github.io/real-car-parking-and-stunt.html)
- [MERGE SMITH](https://learnquester.pages.dev/merge-smith.html)
- [CATEGORY 3D1 371](https://learnquesters.pages.dev/category-3d1-371.html)
- [SWORD AND SPIN](https://studyquests.github.io/sword-and-spin.html)
- [NUMBER RUSH](https://themindzone.pages.dev/number-rush.html)
- [IDOL LIVESTREAM DOLL DRESS UP](https://themindplay.pages.dev/idol-livestream-doll-dress-up.html)
- [CATEGORY MOBILE2 112](https://learnquester.pages.dev/category-mobile2-112.html)
- [POPTROPICA](https://iskillquest.pages.dev/poptropica.html)
- [MAGIC BEAUTY MAKEUP](https://quizverses.github.io/magic-beauty-makeup.html)
- [BILLIARDS 3D RUSSIAN PYRAMID](https://studyplayings.web.app/billiards-3d-russian-pyramid.html)
- [SHEEP VS WOLF](https://iskillquest.pages.dev/sheep-vs-wolf.html)
- [MY DINOSAUR LAND](https://studyquests.pages.dev/my-dinosaur-land.html)
- [FIGHT TRIVIA](https://studyquests.github.io/fight-trivia.html)
- [TAP 3D BLOCKS](https://themindplay.pages.dev/tap-3d-blocks.html)
- [GOTHIC KNIFE](https://studyplayings.web.app/gothic-knife.html)
- [IDLE LUNCH](https://theskillquest.pages.dev/idle-lunch.html)
- [INDEX34](https://studyquests.github.io/index34.html)
- [SAVAGE DEFENDERS](https://themindzone.pages.dev/savage-defenders.html)
- [CATEGORY BATTLESHIP](https://studyquests.pages.dev/category-battleship.html)
- [ZUMBLE STORY](https://thelearnquester.web.app/zumble-story.html)
- [INDEX19](https://studyquests.github.io/index19.html)
- [SPRUNKI GARDEN](https://themindzone.pages.dev/sprunki-garden.html)
- [FALL BEAN 2](https://themindplay.pages.dev/fall-bean-2.html)
- [BALING BUM](https://learnquesters.pages.dev/baling-bum.html)
- [CATEGORY FPS175](https://quizverses-9d2f2.web.app/category-fps175.html)
- [BLOXDHOP IO](https://studyplayings.web.app/bloxdhop-io.html)
- [SKILLFITE IO](https://quizverses.github.io/skillfite-io.html)
- [MONSTER SQUAD RUSH](https://learnquester.github.io/monster-squad-rush.html)
- [HOMO EVOLUTION](https://studyquests.github.io/homo-evolution.html)
- [DOWNHILL CAR RIDE CRASH TEST](https://themindzone.pages.dev/downhill-car-ride-crash-test.html)
- [POWER LIGHT](https://learnquesters.pages.dev/power-light.html)
- [ART PUZZLE MASTER](https://themindzone.pages.dev/art-puzzle-master.html)
- [IDLE MERGE CAR AND RACE](https://quizverses.pages.dev/idle-merge-car-and-race.html)
- [TRIANGLE WAY](https://learnquester.pages.dev/triangle-way.html)
- [MERGE TIKTOK GRAVITY KNIFE](https://learnquester.pages.dev/merge-tiktok-gravity-knife.html)
- [POOL MASTER](https://studyplaying.github.io/pool-master.html)
- [SURVIVAL MASTER 456 CHALLENGE](https://iskillquest.pages.dev/survival-master-456-challenge.html)
- [CLUB TYCOON IDLE CLICKER](https://studyplaying.github.io/club-tycoon-idle-clicker.html)
- [CATEGORY STICKMAN](https://learnquesters.pages.dev/category-stickman.html)
- [CATEGORY PLATFORM260](https://quizverses.pages.dev/category-platform260.html)
- [CATEGORY TOP DOWN248](https://themindzone.pages.dev/category-top-down248.html)
- [CATEGORY ART](https://learnquester.github.io/category-art.html)
- [CATEGORY POOL](https://studyquests.pages.dev/category-pool.html)
- [CONTACT](https://learnquester.github.io/contact.html)
- [STICK HERO BATTLE](https://learnquester.pages.dev/stick-hero-battle.html)
- [SQUISHY TABA PAW ASMR](https://studyplayings.web.app/squishy-taba-paw-asmr.html)
- [GRANNY RETURNS 3D EVIL DESTINY](https://theskillquest.pages.dev/granny-returns-3d-evil-destiny.html)
- [CATEGORY 2D1 070](https://studyquests.pages.dev/category-2d1-070.html)
- [CATEGORY ROBOT49](https://themindplay.pages.dev/category-robot49.html)
- [STEAL BRAINROT ORIGINAL 3D](https://studyplaying.github.io/steal-brainrot-original-3d.html)
- [21 CARDS](https://quizverses-9d2f2.web.app/21-cards.html)
- [MATH DUCK](https://quizverses.pages.dev/math-duck.html)
- [BLOCK STACKING](https://iskillquest.pages.dev/block-stacking.html)
- [PHYSICS BOX 2](https://studyplayings.pages.dev/physics-box-2.html)
- [CATEGORY CONTROLLER](https://learnquester.github.io/category-controller.html)
- [MAHJONG CONNECT SPOOKY](https://themindzone.pages.dev/mahjong-connect-spooky.html)
- [DETECTIVE LOGIC PUZZLES](https://theskillquest.pages.dev/detective-logic-puzzles.html)
- [CATEGORY INCREMENTAL](https://studyquesthub.web.app/category-incremental.html)
- [GARDEN TALES MAHJONG 2](https://themindzone.pages.dev/garden-tales-mahjong-2.html)
- [MEGA LAMBA RAMP](https://learnquesters.pages.dev/mega-lamba-ramp.html)
- [STRAWBERRY HERO](https://iskillquest.pages.dev/strawberry-hero.html)
- [CATEGORY CASUAL 11](https://themindzone.pages.dev/category-casual-11.html)
- [CATEGORY DRAWING GAME](https://themindzone.pages.dev/category-drawing-game.html)
- [OBBY ESCAPE BARRYS JAIL PARKOUR](https://themindplay.pages.dev/obby-escape-barrys-jail-parkour.html)
- [CATEGORY BASKETBALL](https://learnquesters.pages.dev/category-basketball.html)
- [BLAST CUBES](https://themindzone.pages.dev/blast-cubes.html)
- [DEADFLIP FRENZY](https://themindzone.pages.dev/deadflip-frenzy.html)
- [LIQUID SORT DELUXE](https://theskillquest.pages.dev/liquid-sort-deluxe.html)
- [CATEGORY ANIMAL216](https://learnquester.github.io/category-animal216.html)
- [ITALIAN BRAINROT NEURO BEASTS](https://iskillquest.pages.dev/italian-brainrot-neuro-beasts.html)
- [FIDGET TOYS POP IT](https://learnquester.github.io/fidget-toys-pop-it.html)
- [ANGRY FLAPPY](https://iskillquest.pages.dev/angry-flappy.html)
- [SAVE SEAFOOD](https://studyplayings.pages.dev/save-seafood.html)
- [SUPER BRAIN](https://studyquests.github.io/super-brain.html)
- [MERGE HEROES TITANS](https://themindplay.pages.dev/merge-heroes-titans.html)
- [VEGAMIX MATCH 3 VILLAGE](https://theskillquest.pages.dev/vegamix-match-3-village.html)
- [UNBLOCK IT ATLANTIS](https://theskillquest.pages.dev/unblock-it-atlantis.html)
- [CATEGORY RACING DRIVING 2](https://themindplay.pages.dev/category-racing-driving-2.html)
- [K POP PUZZLE HUNTERS](https://learnquesters.pages.dev/k-pop-puzzle-hunters.html)
- [QUBE 2048](https://thelearnquester.web.app/qube-2048.html)
- [HIDE AND SEEK HORROR ESCAPE](https://themindplay.github.io/hide-and-seek-horror-escape.html)
- [BUTTERFLY EAR CUFF JEWELRY](https://studyquests.pages.dev/butterfly-ear-cuff-jewelry.html)
- [CATEGORY ROBOT49](https://themindzone.pages.dev/category-robot49.html)
- [DONT TAP](https://studyquests.github.io/dont-tap.html)
- [CARNAGE BATTLE ARENA](https://theskillquest.pages.dev/carnage-battle-arena.html)
- [BURGER CAFE COOKING GAMES FOR KIDS](https://learnquesters.pages.dev/burger-cafe-cooking-games-for-kids.html)
- [COOL GIRL AESTHETICS](https://theskillquest.pages.dev/cool-girl-aesthetics.html)
- [HOLE BATTLEIO](https://studyplayings.pages.dev/hole-battleio.html)
- [MOBILE PHONE CASE DIY](https://themindzone.pages.dev/mobile-phone-case-diy.html)
- [TANGLE MASTER 3D](https://studyplaying.github.io/tangle-master-3d.html)
- [WACKY WHEELS](https://studyquests.github.io/wacky-wheels.html)
- [VALLEY OF WOLVES AMBUSH](https://studyquests.pages.dev/valley-of-wolves-ambush.html)
