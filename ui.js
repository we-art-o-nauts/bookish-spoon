/*
    HeroFest Dash
    - HUD, title screen and game over screen (pixel space)
*/

'use strict';

///////////////////////////////////////////////////////////////////////////////
function drawHUD()
{
    const w = mainCanvasSize.x;
    const h = mainCanvasSize.y;
    const m = 14;

    // score chip
    drawRect(vec2(m + 125, m + 26), vec2(250, 52), rgb(.08,.08,.12,.8), 0, undefined, true);
    drawTextScreen('SCORE', vec2(m + 12, m + 16), 18, rgb(.7,.75,.85), 0, BLACK, 'left');
    drawTextScreen('' + score, vec2(m + 12, m + 42), 30, WHITE, 0, BLACK, 'left');
    if (comboMult > 1)
        drawTextScreen('x' + comboMult, vec2(m + 220, m + 40), 36, TOKEN_GOLD, 0, BLACK,
            'center', 'arial', 'bold');

    // lives
    for (let i = 0; i < PLAYER_MAX_LIVES; ++i)
    {
        const pos = vec2(m + 26 + i*40, m + 96);
        const color = i < player.lives ? rgb(.95, .35, .45) : rgb(.28, .28, .34);
        drawEllipse(pos, vec2(26, 26), color, 0, 3, BLACK, undefined, true);
    }

    // time chip
    drawRect(vec2(w - m - 130, m + 26), vec2(260, 52), rgb(.08,.08,.12,.8), 0, undefined, true);
    drawTextScreen('EXPO HOURS', vec2(w - m - 130, m + 14), 16, rgb(.7,.75,.85), 0, BLACK,
        'center', 'arial');
    drawTextScreen(formatTime(runTimeLeft), vec2(w - m - 130, m + 40), 32,
        runTimeLeft < 15 ? RED : WHITE, 0, BLACK, 'center', 'arial', 'bold');

    // hint message
    if (messageTimer.active())
        drawTextScreen(messageText, vec2(w/2, h*.8), 24, rgb(1,1,1,.9), 0, BLACK,
            'center', 'arial');
}

///////////////////////////////////////////////////////////////////////////////
function drawTitleScreen()
{
    const w = mainCanvasSize.x;
    const h = mainCanvasSize.y;

    drawRect(vec2(w/2, h/2), vec2(w, h), rgb(0,0,0,.62), 0, undefined, true);

    drawTextScreen('HEROFEST DASH', vec2(w/2, h*.2), h*.13, rgb(1,.85,.25), 6, BLACK,
        'center', 'arial', 'bold');
    drawTextScreen('a games expo run', vec2(w/2, h*.29), h*.034, rgb(.75,.8,.9), 0, BLACK,
        'center', 'arial');
    drawTextScreen(
        'Play demos at indie booths for points.\n' +
        'Dodge the bugs - they hunt for the big studios.\n' +
        'The ERUPT lounge is safe turf and heals you.',
        vec2(w/2, h*.44), h*.032, rgb(.9,.92,1), 0, BLACK, 'center', 'arial');
    drawTextScreen('controls: WASD / arrows to run, gamepad supported',
        vec2(w/2, h*.58), h*.028, rgb(.65,.7,.8), 0, BLACK, 'center', 'arial');

    if (oscillate(1, 1, time) > .25)
        drawTextScreen('Press SPACE to enter the expo', vec2(w/2, h*.68), h*.038,
            WHITE, 3, BLACK, 'center', 'arial', 'bold');
}

///////////////////////////////////////////////////////////////////////////////
function drawGameOverScreen()
{
    const w = mainCanvasSize.x;
    const h = mainCanvasSize.y;

    drawRect(vec2(w/2, h/2), vec2(w, h), rgb(0,0,0,.6), 0, undefined, true);

    const crashed = resultType === 'crash';
    drawTextScreen(crashed ? 'CRUSHED BY AAA BUGS' : 'EXPO CLOSED',
        vec2(w/2, h*.28), 60, crashed ? rgb(1,.3,.35) : rgb(1,.85,.25), 4, BLACK,
        'center', 'arial', 'bold');
    drawTextScreen('FINAL SCORE  ' + score, vec2(w/2, h*.4), 44, WHITE, 0, BLACK,
        'center', 'arial', 'bold');
    if (newBest)
        drawTextScreen('NEW BEST!', vec2(w/2, h*.49), 34, TOKEN_GOLD, 0, BLACK,
            'center', 'arial', 'bold');
    else
        drawTextScreen('BEST  ' + bestScore, vec2(w/2, h*.49), 30, rgb(.7,.75,.85), 0, BLACK,
            'center', 'arial');

    if (oscillate(1, 1, time) > .25)
        drawTextScreen('Press SPACE to play again', vec2(w/2, h*.64), 30, WHITE, 0, BLACK,
            'center', 'arial', 'bold');
    drawTextScreen('booths give points - bugs chase - ERUPT heals',
        vec2(w/2, h*.74), 20, rgb(.6,.65,.75), 0, BLACK, 'center', 'arial');
}
