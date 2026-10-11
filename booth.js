/*
    HeroFest Dash
    - Indie booths and the demo tokens laid out in the aisles
*/

'use strict';

///////////////////////////////////////////////////////////////////////////////
class Booth extends EngineObject
{
    constructor(pos, name, value)
    {
        super(pos, BOOTH_SIZE);
        this.name = name;
        this.value = value;
        this.token = undefined;
        this.tokenTimer = new Timer(rand(0, 2));
    }

    tokenSpawnPos() { return this.pos.add(vec2(0, -BOOTH_SIZE.y/2 - .9)); }

    update()
    {
        super.update();

        if (this.token && this.token.collected)
        {
            this.token = undefined;
            this.tokenTimer.set(TOKEN_RESPAWN_TIME + rand(0, 6));
        }

        if (!this.token && this.tokenTimer.elapsed())
        {
            this.token = new DemoToken(this.tokenSpawnPos(), this);
            this.tokenTimer.unset();
        }
    }

    render()
    {
        if (!isOnScreen(this.pos, 4)) return;

        // booth floor pad
        drawRect(this.pos, this.size, BOOTH_FLOOR);
        drawRect(this.pos, this.size.copy().subtract(vec2(.2)), rgb(1,1,1,.03));

        // table against the north side
        const tablePos = this.pos.add(vec2(0, .35));
        drawRect(tablePos, vec2(4.4, 1.9), BOOTH_TABLE_DARK);
        drawRect(tablePos, vec2(4.2, 1.7), BOOTH_TABLE);
        drawRect(tablePos.add(vec2(0, -.2)), vec2(4.2, .5), rgb(1,1,1,.06));

        // demo monitors face the south aisle
        for (let i = 0; i < 2; ++i)
        {
            const screenPos = this.pos.add(vec2(-.9 + i*1.8, -.35));
            drawRect(screenPos, vec2(1.2, .95), MONITOR_FRAME);
            drawRect(screenPos, vec2(1.05, .8), this.token ? SCREEN_ON : SCREEN_OFF);
            drawRect(screenPos.add(vec2(0, .08)), vec2(1.05, .07),
                rgb(1,1,1,this.token ? .2 : .04));
        }

        // booth name sign toward the front
        drawText(this.name, this.pos.add(vec2(0, -1.4)), .5,
            this.token ? SIGN_READY : SIGN_DONE, .03, BLACK, 'center', 'arial', 'bold');

        // featured booths get a banner on the back wall
        if (this.value >= 30)
        {
            drawRect(this.pos.add(vec2(0, 2.05)), vec2(4.6, .6), FEATURED_BANNER);
            drawText('FEATURED', this.pos.add(vec2(0, 2.05)), .4,
                WHITE, 0, BLACK, 'center', 'arial', 'bold');
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
class DemoToken extends EngineObject
{
    constructor(pos, booth)
    {
        super(pos, vec2(.9));
        this.booth = booth;
        this.bobPhase = rand(0, 2*PI);
        this.collected = false;
    }

    update()
    {
        super.update();

        if (this.collected || gameState !== 'playing' || !player) return;

        if (player.pos.distance(this.pos) < 1.1)
            collectToken(this);
    }

    render()
    {
        if (!isOnScreen(this.pos, 2)) return;

        const bob = sin(time*3 + this.bobPhase) * .1;
        const coinPos = this.pos.add(vec2(0, bob));

        drawEllipse(vec2(this.pos.x, this.pos.y - .5), vec2(.5, .16), rgb(0,0,0,.25));
        drawCircle(coinPos, 1, rgb(1, .8, .2, .1 + .05*sin(time*6)));
        drawEllipse(coinPos, vec2(.55, .65), TOKEN_GOLD, 0, .06, TOKEN_GOLD_DARK);
        drawRect(coinPos, vec2(.14, .5), TOKEN_GOLD_DARK);
        drawRect(coinPos, vec2(.5, .14), TOKEN_GOLD_DARK);
    }
}
