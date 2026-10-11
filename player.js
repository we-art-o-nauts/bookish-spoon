/*
    HeroFest Dash
    - Player: an indie dev running the expo floor
*/

'use strict';

///////////////////////////////////////////////////////////////////////////////
class Player extends EngineObject
{
    constructor(pos)
    {
        super(pos, PLAYER_SIZE);
        this.gravityScale = 0; // top-down
        this.setCollision(false, false, true, false); // blocked by tiles only
        this.lives = PLAYER_MAX_LIVES;
        this.hurtTimer = new Timer(0);
        this.rechargeTimer = new Timer(0);
        this.stepTimer = new Timer(0);
        this.faceX = 1;
    }

    get invulnerable() { return this.hurtTimer.active(); }

    update()
    {
        super.update();

        // directional input rule: keyDirection for arrows/WASD, stick for analog
        let move = keyDirection();
        const stick = gamepadStick(0);
        if (stick.lengthSquared() > .01)
            move = move.add(stick);
        this.velocity = move.clampLength(1).scale(PLAYER_SPEED);

        if (this.getSpeed() > .02)
        {
            if (this.velocity.x < 0) this.faceX = -1;
            if (this.velocity.x > 0) this.faceX = 1;

            if (this.stepTimer.elapsed())
            {
                this.stepTimer.set(.18);
                dustPuff(this.pos.add(vec2(0, -.35)));
            }
        }
        else
        {
            this.stepTimer.set(0);
        }

        // back at the ERUPT lounge: recharge a life over time
        if (inEruptZone(this.pos) &&
            this.lives < PLAYER_MAX_LIVES &&
            this.rechargeTimer.elapsed())
        {
            this.rechargeTimer.set(ERUPT_RECHARGE_TIME);
            ++this.lives;
            rechargeBurst(this.pos);
            sfxRecharge.play(this.pos);
            showMessage('ERUPT lounge recharges you!', 2);
        }
    }

    render()
    {
        if (!isOnScreen(this.pos, 3)) return;

        // blink while hurt, draw faded instead of hiding
        const alpha = this.invulnerable && frame % 10 < 4 ? .3 : 1;
        const step = sin(time*10) * min(1, this.getSpeed()/PLAYER_SPEED);
        const legLift = abs(step) * .06;

        drawEllipse(this.pos.add(vec2(0, -.5)), vec2(.7, .22), rgb(0,0,0,.3));

        // legs
        drawEllipse(this.pos.add(vec2(-.16, -.34 - legLift)), vec2(.2, .34),
            rgb(.85, .88, .95, alpha));
        drawEllipse(this.pos.add(vec2( .16, -.34 + legLift)), vec2(.2, .34),
            rgb(.85, .88, .95, alpha));

        // body
        drawEllipse(this.pos.add(vec2(0, -.08)), vec2(.64, .58),
            PLAYER_HOODIE.withAlpha(alpha));
        drawEllipse(this.pos.add(vec2(-.36, -.05)), vec2(.16, .4),
            PLAYER_HOODIE.withAlpha(alpha));
        drawEllipse(this.pos.add(vec2( .36, -.05)), vec2(.16, .4),
            PLAYER_HOODIE.withAlpha(alpha));

        // lanyard and expo badge
        drawLine(this.pos.add(vec2(-.02, -.3)), this.pos.add(vec2(.06, -.14)),
            .04, rgb(.9, .9, .95, alpha));
        drawRect(this.pos.add(vec2(.07, -.04)), vec2(.16, .2),
            TOKEN_GOLD.withAlpha(alpha));

        // head, cap and glasses
        drawEllipse(this.pos.add(vec2(0, .28)), vec2(.52, .48), PLAYER_SKIN.withAlpha(alpha));
        drawRect(this.pos.add(vec2(0, .42)), vec2(.56, .2), PLAYER_CAP.withAlpha(alpha));
        drawRect(this.pos.add(vec2(.1, .32)), vec2(.5, .09), PLAYER_CAP.withAlpha(alpha), -.06);
        drawRect(this.pos.add(vec2(0, .26)), vec2(.44, .09), GLASSES.withAlpha(alpha));
        drawRect(this.pos.add(vec2(-.12, .245)), vec2(.1, .06), rgb(.2,.75,.85, alpha*.9));
        drawRect(this.pos.add(vec2( .12, .245)), vec2(.1, .06), rgb(.2,.75,.85, alpha*.9));
    }
}
