/*
    HeroFest Dash
    - StudioBug: bug-shaped AAA game studio agents that hunt the player
*/

'use strict';

///////////////////////////////////////////////////////////////////////////////
class StudioBug extends EngineObject
{
    constructor(pos)
    {
        super(pos, BUG_SIZE);
        this.gravityScale = 0; // top-down
        this.setCollision(false, false, true, false); // blocked by tiles only
        this.wanderTarget = pos.copy();
        this.wanderTimer = new Timer(rand(1, 3));
        this.stunTimer = new Timer(0);
        this.stunDir = vec2();
        this.avoidTimer = new Timer(0);
        this.avoidSign = 1;
        this.walkPhase = rand(0, 2*PI);
    }

    update()
    {
        super.update();

        const toPlayer = player.pos.subtract(this.pos);
        const dist = toPlayer.length();
        const chasing = gameState === 'playing' && !inEruptZone(player.pos);

        let desired;
        if (chasing && this.stunTimer.elapsed() && dist < BUG_SIGHT)
        {
            // bugs get faster the longer the run goes on
            const ramp = min(1, runElapsed / BUG_CHASE_RAMP_TIME);
            const speed = lerp(BUG_CHASE_SPEED_MIN, BUG_CHASE_SPEED_MAX, ramp);
            desired = toPlayer.normalize().scale(speed);
            this.walkPhase += .25;
        }
        else if (this.stunTimer.active())
        {
            desired = this.stunDir.scale(.3);
        }
        else
        {
            // roam the expo floor between hunts
            if (this.wanderTimer.elapsed())
            {
                this.wanderTarget = this.pos.add(randVec2(rand(2, 6)));
                this.wanderTimer.set(rand(1.5, 3.5));
            }
            const toTarget = this.wanderTarget.subtract(this.pos);
            desired = toTarget.length() > .4 ? toTarget.normalize().scale(BUG_WANDER_SPEED) : vec2();
        }

        // stay out of the ERUPT lounge - players are safe there
        if (this.pos.x < ERUPT_BUG_LIMIT)
            desired = desired.add(vec2(.07, 0));

        // writhe around blocked tiles so bugs don't grind the walls
        if (this.avoidTimer.active())
            desired = desired.rotate(this.avoidSign * PI * .4);

        this.velocity = this.velocity.lerp(desired, .12);
        if (this.velocity.lengthSquared() > 1e-4)
            this.angle = this.velocity.angle();
    }

    collideWithTile(tileData, pos)
    {
        if (this.avoidTimer.elapsed() && randBool(.7))
        {
            this.avoidTimer.set(rand(.4, .9));
            this.avoidSign = randSign();
        }
        return true;
    }

    setStunned()
    {
        this.stunTimer.set(rand(1.5, 2.5));
        this.stunDir = this.pos.subtract(player.pos).normalize(1);
        this.velocity = this.stunDir.scale(.4);
    }

    render()
    {
        if (!isOnScreen(this.pos, 2)) return;

        drawEllipse(this.pos.add(vec2(0, -.45)), vec2(.7, .22), rgb(0,0,0,.3));

        // wiggling legs
        for (let i = 0; i < 6; ++i)
        {
            const t = i - 2.5;
            const wiggle = sin(time*8 + this.walkPhase + i*2) * .1;
            drawLine(this.pos.add(vec2(t*.18, -.05)),
                this.pos.add(vec2(t*.28, -.42 + wiggle)), .05, BUG_LEG);
        }

        // body and head
        drawEllipse(this.pos.add(vec2(0, .05)), vec2(.72, .5), BUG_SHELL, this.angle);
        const head = this.pos.add(vec2().setAngle(this.angle, .32));
        drawEllipse(head, vec2(.42, .34), BUG_SHELL_DARK, this.angle);

        // antennae
        const a1 = head.add(vec2().setAngle(this.angle + .9, .3));
        const a2 = head.add(vec2().setAngle(this.angle - .9, .3));
        drawLine(head, a1, .04, BUG_LEG);
        drawLine(head, a2, .04, BUG_LEG);
        drawCircle(a1, .07, YELLOW);
        drawCircle(a2, .07, YELLOW);

        // the studio nameplate
        if (isOnScreen(this.pos, 1.5))
            drawText('AAA', this.pos.add(vec2(0, .6)), .45, BUG_LABEL, .05, BLACK,
                'center', 'arial', 'bold');
    }
}
