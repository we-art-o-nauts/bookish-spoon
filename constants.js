/*
    HeroFest Dash
    - Tuning, layout data and palette for the expo run
    - The run starts at the ERUPT lounge, indie booths fill the expo hall,
      and AAA "bug" studios hunt the players in the aisles
*/

'use strict';

///////////////////////////////////////////////////////////////////////////////
// World layout (1 unit = 1 tile)

const WORLD_SIZE        = vec2(84, 52);
const WALL_THICKNESS    = 2;

///////////////////////////////////////////////////////////////////////////////
// Player

const PLAYER_SPEED        = .16;  // world units per frame
const PLAYER_SIZE         = vec2(.8, .95);
const PLAYER_START_POS    = vec2(12, 26);
const PLAYER_MAX_LIVES    = 3;
const PLAYER_HURT_TIME    = 1.8;  // invulnerability seconds after a hit

///////////////////////////////////////////////////////////////////////////////
// ERUPT lounge - where the run begins, safe turf that heals you

const ERUPT_CENTER       = vec2(12, 26);
const ERUPT_RECT_MIN     = vec2(2.5, 3);
const ERUPT_RECT_MAX     = vec2(21.5, 49);
const ERUPT_BUG_LIMIT    = 23.5;    // bugs steer around this x
const ERUPT_RECHARGE_TIME= 24;      // heal cooldown seconds

///////////////////////////////////////////////////////////////////////////////
// Indie game booths (grid of tables with demo tokens in the aisles)

const BOOTH_SIZE     = vec2(5, 3.5);
const BOOTH_COLUMNS  = [29, 38, 47, 56, 65, 74];
const BOOTH_ROWS     = [10, 20, 30, 40];
const BOOTH_NAMES    =
    [
        'Pixel Barista',    'Slime Volleyball', 'Moth Runners',     'Cargo Cult 2',
        'Neon Gardener',    'PC Cheese Panic',  'Rogue Snail',      'Frog Detective 99',
        'Museum Heist Cats','Baguette Blade',   'Robot Rodeo',      'Desk Job: Rewind',
        'Cat Cafe Chaos',   'Grave Mower',      'Dungeon Repo',     'Bonsai Physics',
        'Signal From Pluto','Tofu Tumbler',     'Hex Bomber',       'Clockwork Park',
        'Pizza Tornado',    'GhostProof',       'Pigeon Pilot',     'Laundry Souls',
    ];
// rows of booth values top to bottom; 30 = featured booth
const BOOTH_VALUES =
    [
        [10, 20, 10, 10, 20, 10],
        [10, 30, 10, 20, 10, 10],
        [20, 10, 10, 10, 30, 20],
        [10, 10, 30, 20, 10, 10],
    ];
const TOKEN_RESPAWN_TIME = 16;  // demo token returns this many seconds after a play

///////////////////////////////////////////////////////////////////////////////
// Bugs - the AAA "studios" hunting the player

const BUG_SIZE             = vec2(.85, .7);
const BUG_WANDER_SPEED     = .05;
const BUG_CHASE_SPEED_MIN  = .11;
const BUG_CHASE_SPEED_MAX  = .15;
const BUG_SIGHT            = 16;
const BUG_CHASE_RAMP_TIME  = 40;   // seconds until bugs reach top speed
const BUG_SPAWN_INTERVAL   = 5;
const BUG_START_TIME       = 3;
const BUG_MAX_ALIVE        = 30;
const BUG_SPAWN_PLAYER_MARGIN = 14; // never spawn this close to the player
const BUG_SPAWN_POINTS     =
    [
        vec2(30, 4),  vec2(55, 4),  vec2(75, 4),
        vec2(30, 46), vec2(55, 46), vec2(75, 46),
        vec2(33, 26), vec2(47, 26), vec2(61, 26),
    ];

///////////////////////////////////////////////////////////////////////////////
// Run length and score

const RUN_TIME        = 150; // expo hours in seconds
const COMBO_WINDOW    = 2.8; // seconds between tokens to keep the combo
const COMBO_PER_LEVEL = 3;   // tokens per combo step
const COMBO_MAX       = 5;

const SAVE_NAME = 'HeroFestDash';

///////////////////////////////////////////////////////////////////////////////
// Palette

const COLOR_FLOOR    = rgb(.075, .075, .11);
const COLOR_AISLE    = rgb(.105, .098, .2);
const COLOR_WALL     = rgb(.16, .17, .23);
const COLOR_BACKDROP = rgb(.03, .03, .05);

const COLOR_RUG      = rgb(.15, .07, .17);
const COLOR_RUG_TRIM = rgb(.85, .7, .1);

const BOOTH_FLOOR      = rgb(.1, .12, .17);
const BOOTH_TABLE      = rgb(.42, .28, .16);
const BOOTH_TABLE_DARK = rgb(.3, .2, .12);
const MONITOR_FRAME    = rgb(.13, .13, .16);
const SCREEN_ON        = rgb(.2, .75, .85);
const SCREEN_OFF       = rgb(.22, .24, .3);
const SIGN_READY       = rgb(1, .85, .2);
const SIGN_DONE        = rgb(.5, .55, .6);
const FEATURED_BANNER  = rgb(.78, .33, .1);

const TOKEN_GOLD      = rgb(1, .8, .1);
const TOKEN_GOLD_DARK = rgb(.65, .45, .05);

const PLAYER_HOODIE = rgb(.2, .6, .75);
const PLAYER_SKIN   = rgb(.95, .85, .75);
const PLAYER_CAP    = rgb(.88, .22, .25);
const GLASSES       = rgb(.1, .1, .12);

const BUG_SHELL      = rgb(.8, .14, .2);
const BUG_SHELL_DARK = rgb(.42, .05, .08);
const BUG_LEG        = rgb(.15, .08, .1);
const BUG_LABEL      = rgb(1, .4, .45);
