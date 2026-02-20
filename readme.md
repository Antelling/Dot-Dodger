we are going to make a minimal implementation of a tilt-based arcade game. its pretty simple... 

first, the general requirements. this will be a mobile-only phone game. it will run in a normal web browser, using either 2d canvas technologies or SVG... canvas might be more performant. the canvas will be full screen, and 
there will not be UI visible other than the canvas. the game must run at 60fps. the language will be typescript, and you will use the strong type system to full effect. there is no need for a server or any way to save or 
persist information. maybe local storage for acheivements...

the core gameplay is thus. the user will control a cursor by tilting their phone. the cursor will be a dot - representing the true position and hitbox - a small gap around the box, and an arrow that points in the current direction of
travel. the cursor does not have momentum, just velocity determined by the phones current angle of deviation from flat. this lets the user quickly and precisely whip the cursor around. the game arena will get filled with red dots. 
if the red dots touch the characters hitbox (just the center circle) the player loses instantly. the player will pick up various weapons from the arena - by flying into the orbss - and then firing the weapons to target the dots. 

dots will appear as part of patterns. the patterns control the initial spawning behavior of the dots, as well as what they do once they are spawned. typically, dots will either follow the player at a constant velocity, like 
zombies, or they move as part of the shape the patterns is trying to draw. each pattern is easy, medium, or hard. the game picks a pattern every so often. the rate of picking patterns, and which patterns are chosen, get harder as
the game goes on. sometimes multiple patterns can happen at once. patterns often take multiple seconds to fully spawn, then might remain on the arena for an arbitrary amount of time - until they are destroyed. 
here are some of the patterns:

1. zombie snow: simply spawn dots randomly around the screen every so often, like raindrops or snow. the dots should immediately start slowly moving towards the character. 

2. sweeper line: spawn a line of dots horizontally or vertically on one side of the screen. make the line dense enough the player can't sneak through it, but put 1 to 5 holes in the line depending on the current game difficulty. 
the line should then sweep back and forth across the screen, at a speed set by the game difficulty. 

3. sparse grid: spawn a sparse rectangular grid of dots across the arena. then make them move towards the player very slowly. 

4. the bouncing ball. spawn like 300 dots arranged in a dense circle. make the shape move cohesively. make it bounce around the arena like a screensaver. 

5. the gatling point. select a random point on the arena. start spawning dots at that point. make them move towards the player at a high velocity, but in a perfectly straight line so they are very easily dodged. however, they should
then bounce off the walls of the arena. the gatling point should shoot its laser of dots at the player for 3 to 6 seconds. 

6. the bullet hell. pick a point in the middle of one of the two  short edges of the arena. make it start quickly shooting out dots in spiral patterns - just do various trigonometry - like a bullet hell spaceship game. make the 
patterns varied and complicated. these dots should also move quickly in a straight line, but should fly out of the arena instead of bouncing off the edges. 

7. the containment ring. spawn a bunch of points in a ring close around the player. the player will have to react quickly cause the ring is pretty dense. 


when dots spawn, they should first appear as larger than normal, and have a little animated ripple effect as they shrink down to their size. they should not move or kill the player during this spawning animation. it is not fair to 
drop dots right on top of the player and give them no time to react.

the weapons are as follows: 

1. the kinetic bomb. after picking up this orb, it should have a little animation - collapse into a point, then explode into a circle like 20% of the width of the screen, then fade away the circle. kill all dots in the circle when it appears.

2. the blaster. after picking up this orb, make the players cursor turn purple and grow a hammerhead type shape from the tip of its cursor point - then launch a horizontal bar of desctruction, perpendicular to where the player is facing, moving across the arena at a quick pace in the direction the player was facing. give them two seconds to prepare/choose a direction. kill all dots that get hit by the beam of destruction. 

3. the ice bomb. a larger nuke, but it just freezes dots. the player has to go through and touch them all to kill them. they thaw out after 20 seconds. thawed dots lose their patter association. they just act like slow zombies. 

4. the homing missiles. when the user touches the orb, instantly launch three homing missiles in a trident out of the orb, in the direction the player was facing. these are quickly moving dots that can slightly update their angle of travel each gamestep. they should pick a dot according to some metric (how many dots are a small angular deviation from the current future path + prioritize close dots). the speed of the missiles should be influenced by how quicly the player ssmashes through the orb. 

5. the nuclear bomb. bumping into this orb should make it move across the screen, as if the player is a cue and the orb a pool ball. it should bounce off the edges of the arena, if appropriate, until finally exploding. if the user is
inside the explosion bubble, they die too. 

6. the electric bomb. works like the nuclear bomb, as in it gets bumped and the area of effect kills the player too, however, this bombs circle is much smaller then even the kinetic bomb. however, it is viral - dots in the circle spawn
electric bomb circles centered on them - smaller then the main circle - and all dots in that circle get electric bomb circles on *them* - these ones the same size though. if the character gets electrified too, though, they die. 

7. dot repellent. this acts like a magnet around the player that repels dots. it can push away slow zombie dots entirely, and substantially slows down fast zombies and laster dots. if a dot is in a shape pattern, the magnetic field 
breaks it out and turns it into a slow zombie. 

8. the chainsaw. turns the player into a large circle for 5 seconds. they can zoom around and kill dots with the circle. then it wears off. 

9. the flame burst. when touching this orb, the player is sucked into the center of it, held there for 5 seconds, then shot out - fix the velocity of the character to the maximum but let them steer - for the distance of half the 
width of the widest edge of the arena. paint a trail of fire during the burst. the fire should kill all dots that enter it and last for 7 seconds. make the player invincible for half a second after the fire burst wears off. 


if the player moves off the edge of the screen, they should wrap around like a torus. 

make ui like new game and oh no you lost this is your highscore in normal html elements above the canvas. I said not to do that before but I have changed my mind. 
