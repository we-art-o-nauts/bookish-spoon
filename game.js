/*
    HeroFest Dash
    - Core loop: run the expo, play indie demos, dodge the AAA bugs
    - The run starts in the ERUPT lounge, which is safe turf that heals you
    - Best score is saved with the engine readSaveData/writeSaveData flow
*/

'use strict';

///////////////////////////////////////////////////////////////////////////////
// Game state

let gameState = 'title';
let player;
let booths = [];
let worldLayer;

let runTimer = new Timer(0);
let runTimeLeft = RUN_TIME;
let runElapsed = 0;
let warnedClosing = false;

let score = 0;
let comboCount = 0;
let comboMult = 1;
let comboTimer = new Timer(0);

let spawnTimer = new Timer(BUG_START_TIME);
let scoreFloats = [];

let bestScore = 0;
let newBest = false;
let resultType = 'crash';

let messageText = '';
let messageTimer = new Timer(0);
let shakeAmount = 0;

///////////////////////////////////////////////////////////////////////////////
// Sounds (built-in zzfx tones - no assets)

const sfxStart    = new Sound([.3, .01, 440, .02, .15, .4]);
const sfxPickup   = new Sound([.3, 0,   800, 0,   .08, .3,  0, 1, 0, 0, 4, .05]);
const sfxHit      = new Sound([.5, .05, 120, 0,   .2,  .3,  2, 1, 0, 0, 0, 0, 0, 3]);
const sfxRecharge = new Sound([.25,.01, 520, .05, .25, .5]);
const sfxCrash    = new Sound([.5, .03, 180, .05, .35, .5,  2, 1]);
const sfxClosed   = new Sound([.35,.02, 660, .1,  .3,  .6,  0, 1, 0, 0, 5, .05]);

///////////////////////////////////////////////////////////////////////////////
// Level helpers

function inEruptZone(pos)
{
    return pos.x >= ERUPT_RECT_MIN.x && pos.x <= ERUPT_RECT_MAX.x &&
           pos.y >= ERUPT_RECT_MIN.y && pos.y <= ERUPT_RECT_MAX.y;
}

function setCollisionRect(pos, size)
{
    const minX = ceil(pos.x - size.x/2);
    const maxX = floor(pos.x + size.x/2);
    const minY = ceil(pos.y - size.y/2);
    const maxY = floor(pos.y + size.y/2);
    for (let x = minX; x <= maxX; ++x)
        for (let y = minY; y <= maxY; ++y)
            worldLayer.setCollisionData(vec2(x, y), 1);
}

function buildLevel()
{
    // collision-only tile layer, visuals drawn in gameRender
    worldLayer = new TileCollisionLayer(vec2(), WORLD_SIZE);
    worldLayer.render = () => {};

    // outer walls
    for (let x = 0; x < WORLD_SIZE.x; ++x)
        for (let y = 0; y < WORLD_SIZE.y; ++y)
            if (x < WALL_THICKNESS || x >= WORLD_SIZE.x - WALL_THICKNESS ||
                y < WALL_THICKNESS || y >= WORLD_SIZE.y - WALL_THICKNESS)
                worldLayer.setCollisionData(vec2(x, y), 1);

    // booth tables block movement
    for (const row of BOOTH_ROWS)
        for (const col of BOOTH_COLUMNS)
            setCollisionRect(vec2(col, row), BOOTH_SIZE);

    // booths with names and point values
    booths = [];
    for (let r = 0; r < BOOTH_ROWS.length; ++r)
        for (let c = 0; c < BOOTH_COLUMNS.length; ++c)
            booths.push(new Booth(
                vec2(BOOTH_COLUMNS[c], BOOTH_ROWS[r]),
                BOOTH_NAMES[r * BOOTH_COLUMNS.length + c],
                BOOTH_VALUES[r][c]));
}

///////////////////////////////////////////////////////////////////////////////
// Run control

function resetWorld()
{
    engineObjectsDestroy(true);
    scoreFloats = [];
    score = 0;
    comboCount = 0;
    comboMult = 1;
    comboTimer.set(0);
    runElapsed = 0;
    runTimeLeft = RUN_TIME;
    warnedClosing = false;
    shakeAmount = 0;
    buildLevel();
    player = new Player(PLAYER_START_POS);
    cameraPos = ERUPT_CENTER.copy();
}

function startPlaying()
{
    gameState = 'playing';
    runTimer.set(RUN_TIME);
    spawnTimer.set(BUG_START_TIME);
    spawnBug();
    spawnBug();
    sfxStart.play();
    showMessage('Play demos at booths before expo hours end!', 4);
}

function endRun(type)
{
    gameState = 'over';
    resultType = type;
    newBest = score > bestScore;
    if (newBest)
    {
        bestScore = score;
        writeSaveData(SAVE_NAME, {best: bestScore});
    }
    (type === 'crash' ? sfxCrash : sfxClosed).play();
    shakeAmount = .4;
}

function showMessage(text, time)
{
    messageText = text;
    messageTimer.set(time);
}

///////////////////////////////////////////////////////////////////////////////
// Scoring, spawning and effects

function collectToken(token)
{
    token.collected = true;
    token.destroy();

    comboCount = comboTimer.active() ? comboCount + 1 : 1;
    comboMult = min(COMBO_MAX, 1 + floor(comboCount / COMBO_PER_LEVEL));
    comboTimer.set(COMBO_WINDOW);

    const points = token.booth.value * comboMult;
    score += points;

    scoreFloats.push({pos: token.pos.copy(), text: '+' + points, life: 1, color: TOKEN_GOLD});
    if (comboMult > 1)
        scoreFloats.push({pos: token.pos.add(vec2(0, -.9)), text: 'x' + comboMult,
            life: 1, color: rgb(1, .5, .2)});

    collectBurst(token.pos);
    sfxPickup.play(token.pos);
}

function spawnBug()
{
    let choices = BUG_SPAWN_POINTS.filter(p => p.distance(player.pos) > BUG_SPAWN_PLAYER_MARGIN);
    if (!choices.length)
        choices = BUG_SPAWN_POINTS;
    new StudioBug(choices[randInt(choices.length)]);
}

function bugCount()
{
    let count = 0;
    for (const o of engineObjects)
        if (o instanceof StudioBug)
            ++count;
    return count;
}

function hitPlayer(bug)
{
    --player.lives;
    player.hurtTimer.set(PLAYER_HURT_TIME);
    bug.setStunned();
    shakeAmount = .35;
    hitBurst(player.pos);
    sfxHit.play(player.pos);
    if (player.lives <= 0)
        endRun('crash');
    else
        showMessage('Hit by an AAA bug! ERUPT lounge heals you', 3);
}

///////////////////////////////////////////////////////////////////////////////
function collectBurst(pos)
{
    new ParticleEmitter(pos, 0, .5, .2, 40, 2*PI, undefined,
        TOKEN_GOLD, rgb(1,.9,.3), rgb(1,.75,0,0), rgb(1,.75,0,0),
        .45, .06, 0, .2, .3, .85, .9, 0);
}

function hitBurst(pos)
{
    new ParticleEmitter(pos, 0, .6, .15, 50, 2*PI, undefined,
        BUG_SHELL, rgb(1,.4,.4), rgb(.4,.05,.05,0), rgb(.4,0,0,0),
        .4, .08, .02, .25, .5, .9, .9, 0);
}

function rechargeBurst(pos)
{
    new ParticleEmitter(pos, 0, .8, .4, 30, 2*PI, undefined,
        rgb(.4,.95,.5), rgb(.6,1,.6), rgb(.3,.9,.4,0), rgb(.3,.9,.4,0),
        .55, .05, .01, .12, .2, .92, .9, 0);
}

function dustPuff(pos)
{
    new ParticleEmitter(pos, 0, .3, .1, 8, 2*PI, undefined,
        rgb(.65,.68,.8,.4), rgb(.6,.63,.75,.35), rgb(.5,.55,.7,0), rgb(.5,.55,.7,0),
        .35, .1, .24, .05, .2, .9, .9, 0);
}

///////////////////////////////////////////////////////////////////////////////
// Engine callbacks

async function gameInit()
{
    bestScore = readSaveData(SAVE_NAME, {best:0}).best;
    cameraScale = 26;
    canvasClearColor = COLOR_FLOOR;
    resetWorld();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    if (gameState === 'title')
    {
        if (keyWasPressed('Space') || keyWasPressed('Enter') || mouseWasPressed(0))
            startPlaying();
        return;
    }

    if (gameState === 'over')
    {
        if (keyWasPressed('Space') || keyWasPressed('Enter') ||
            keyWasPressed('KeyR') || mouseWasPressed(0))
        {
            resetWorld();
            startPlaying();
        }
        return;
    }

    // playing
    runTimeLeft = max(0, -runTimer.get());
    runElapsed += timeDelta;

    if (runTimeLeft <= 0)
        return endRun('closed');

    if (!warnedClosing && runTimeLeft < 15)
    {
        warnedClosing = true;
        showMessage('Expo closing soon!', 3);
    }

    // bug spawner ramps up over the run
    if (spawnTimer.elapsed())
    {
        spawnTimer.set(BUG_SPAWN_INTERVAL);
        if (bugCount() < BUG_MAX_ALIVE)
            spawnBug();
    }

    // player-bug contact
    if (!player.invulnerable && !inEruptZone(player.pos))
        for (const o of engineObjects)
            if (o instanceof StudioBug && o.pos.distance(player.pos) < 1.05)
            {
                hitPlayer(o);
                break;
            }

    // floating score text
    for (const f of scoreFloats)
    {
        f.pos.y += .55 * timeDelta;
        f.life -= timeDelta;
    }
    scoreFloats = scoreFloats.filter(f => f.life > 0);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{
    // camera follows the player; the title shot hangs on the ERUPT lounge
    const target = gameState === 'title' ? ERUPT_CENTER : player.pos;
    cameraPos = cameraPos.lerp(target, .15);

    if (shakeAmount > 0)
    {
        cameraPos = cameraPos.add(randVec2(shakeAmount));
        shakeAmount = max(0, shakeAmount * .92);
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    const size = WORLD_SIZE;

    // dark backdrop beyond the walls
    drawRect(vec2(size.x/2, size.y/2), size.copy().add(vec2(10)), COLOR_BACKDROP);

    // base floor
    drawRect(vec2(size.x/2, size.y/2), size, COLOR_FLOOR);

    // aisle carpeting between booth columns
    for (let i = 0; i < BOOTH_COLUMNS.length - 1; ++i)
    {
        const c = (BOOTH_COLUMNS[i] + BOOTH_COLUMNS[i+1]) / 2;
        drawRect(vec2(c, size.y/2), vec2(4, size.y - WALL_THICKNESS*2), COLOR_AISLE);
    }

    // top and bottom corridor strips
    drawRect(vec2(size.x/2, 5.1), vec2(size.x - WALL_THICKNESS*2, 6.2), COLOR_AISLE);
    drawRect(vec2(size.x/2, size.y - WALL_THICKNESS - 4.1),
        vec2(size.x - WALL_THICKNESS*2, 8.2), COLOR_AISLE);

    // ERUPT lounge floor and rug
    drawRect(vec2(12, size.y/2), vec2(19, size.y - WALL_THICKNESS*2 - 1),
        rgb(.1, .09, .15));
    drawRect(ERUPT_CENTER, vec2(18.8, 30.8), COLOR_RUG_TRIM);
    drawRect(ERUPT_CENTER, vec2(18, 30), COLOR_RUG);
    for (let y = -12; y <= 12; y += 6)
        drawRect(ERUPT_CENTER.add(vec2(0, y)), vec2(18, .35), rgb(1,.75,.1,.22));

    // lounge furniture
    drawRect(vec2(4.2, ERUPT_CENTER.y + 1), vec2(1.6, 20), rgb(.16, .2, .3));
    drawRect(vec2(5.5, ERUPT_CENTER.y + 1), vec2(2.6, 18), rgb(.24, .28, .4));
    drawRect(vec2(9.5, ERUPT_CENTER.y - 8), vec2(3.6, 1.7), rgb(.35, .22, .12));
    drawRect(vec2(9.5, ERUPT_CENTER.y + 8), vec2(3.6, 1.7), rgb(.35, .22, .12));
    //drawText('ERUPT', vec2(12, 29), 3, rgb(1,.85,.2), .1, BLACK, 'center', 'arial', 'bold');
    drawText('ERUPT Lounge', vec2(12, 26), .8, rgb(.8,.85,.9), .02, BLACK);

    // outer walls
    drawRect(vec2(size.x/2, WALL_THICKNESS/2), vec2(size.x, WALL_THICKNESS), COLOR_WALL);
    drawRect(vec2(size.x/2, size.y - WALL_THICKNESS/2), vec2(size.x, WALL_THICKNESS), COLOR_WALL);
    drawRect(vec2(WALL_THICKNESS/2, size.y/2), vec2(WALL_THICKNESS, size.y), COLOR_WALL);
    drawRect(vec2(size.x - WALL_THICKNESS/2, size.y/2), vec2(WALL_THICKNESS, size.y), COLOR_WALL);

    // hall banner
    drawText('HEROFEST 2026', vec2(50, 47), 2, rgb(1,.85,.25), .06, BLACK,
        'center', 'arial', 'bold');

    // pulsing chevrons from the lounge into the hall
    const chevronAlpha = .45 + .25 * sin(time*4);
    for (let i = 0; i < 3; ++i)
    {
        const x = 22.8 + i*1.7;
        drawPoly([vec2(x, 24.3), vec2(x + .9, 26), vec2(x, 27.7)],
            rgb(1, 1, 1, max(0, chevronAlpha - i*.08)));
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // floating score text above everything (world space)
    for (const f of scoreFloats)
        drawText(f.text, f.pos, 1.1, f.color.withAlpha(min(1, f.life*1.6)), .05, BLACK);

    if (gameState === 'title')
        drawTitleScreen();
    else if (gameState === 'playing')
        drawHUD();
    else
        drawGameOverScreen();
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
