/* Author: 

*/

var engine;

$(document).ready(function() {
    
    engine = new jsge.Engine("stage", {
        init: function() {
            this.ctx.font = "20pt Arial";
            
            // Arbitary scale to get realistic-looking fall speed
            this.gravity = 9.81 * 200;
            this.star_fall_speed = 0;
            this.star_fall_speed_x = 4;
            
            this.stars = [];
            
            // Create the stars in the background
            for(var i=0; i<40; i++) {
                var star = new jsge.Sprite(this, {
                    x: Math.random()*this.getWidth(),
                    y: Math.random()*this.getHeight()*2 - this.getHeight(),
                    w: 8,
                    h: 8,
                    vx: 4,
                    vy: 0,
                    omega: Math.random()*0.5,
                    fill: "rgba(255,254,188,0.6)",
                    update : function() {
                        this.phys_state.vel.y = this.speedscale*engine.star_fall_speed;
                        this.phys_state.vel.x = this.speedscale*engine.star_fall_speed_x;
                    }
                });
                star.speedscale = Math.random()*0.5 + 1;
                
                star.listen("leavescreen", function() {
                    // Move the star back up to the top if it falls off-screen
                    if(this.getY() >= engine.getHeight() + 16) {
                        this.setX((Math.random()-0.5)*engine.getWidth() + engine.player.getX());
                        this.setY((Math.random()-1)*engine.getHeight() + engine.player.getY());
                        this.speedscale = Math.random()*0.5 + 1;
                        this.omega = Math.random()*0.5;
                    }
                });
                
                
                this.stars.push(star);
            }
            
            var player_start_x = 850,
                player_start_y = 350;
            
            this.pillars = [];
            
            var pillar_width = 30,
                pillar_height = 900,
                pillar_spacing = 400
                pillar_step = 200;
            
            // Create the pillars
            for(var i=0; i<3; i++) {
                // Create the pillar the player starts on
                var pillar = new jsge.Sprite(this, {
                    x: player_start_x - i*pillar_spacing,
                    y: player_start_y - i*pillar_step,
                    w: pillar_width,
                    h: pillar_height,
                    origin: "n",
                    fill: "rgb(45, 45, 55)"
                })
                this.pillars.push(pillar);
            }
            
            var player = new jsge.Sprite(this, {
                x: player_start_x,
                y: player_start_y,
                w: 32,
                h: 64,
                origin: "s",
                mass: 70,
                img: document.getElementById("img-player"),
                states: {
                    "stand-right": {
                        x: 0,
                        y: 0
                    },
                    "stand-left": {
                        x: 32,
                        y: 0
                    },
                    "fall-right": {
                        x: 64,
                        y: 0
                    },
                    "fall-left": {
                        x: 96,
                        y: 0
                    }
                },
                update : function() {
                    var cfs = (this.getState().indexOf("stand")==-1) ? "fall" : "stand",
                        speed = (cfs=="fall") ? 20 : 5,
                        speedlim = (cfs=="fall") ? 300 : 100;
                    
                    // Handle key input
                    if(engine.left.pressed && !engine.right.pressed) {
                        if(Math.abs(this.getVx()) < speedlim)
                            this.phys_state.vel.x -= speed;
                    } else if(engine.right.pressed && !engine.left.pressed) {
                        if(Math.abs(this.getVx()) < speedlim)
                            this.phys_state.vel.x += speed;
                    } else {
                        this.phys_state.vel.x *= 0.97;
                    }
                    
                    var standing_on = this.onPlatform();
                    if(standing_on) {
                        this.setVy(0);
                        this.setY(standing_on.getY());
                        this.phys_state.vel.x *= 0.9;
                    } else {
                        //this.phys_state.vel.y += engine.gravity/this.phys_state.mass + 5;
                        if(this.getY() > engine.getHeight()*2) {
                            this.reset();
                        }
                    }
                    
                    if(engine.spacebar.pressed && cfs=="stand") {
                        this.phys_state.vel.y -= 200;
                    }
                    
                    // Update the player's sprite state
                    var fs = this.getState().split("-")[0];
                    if(this.getVy() != 0) {
                        fs = "fall";
                    } else {
                        fs = "stand";
                    }
                    
                    var lr = this.getState().split("-")[1];
                    if(this.getVx() < 0) {
                        lr = "left";
                    } else if(this.getVx() > 0) {
                        lr = "right";
                    }
                    
                    this.setState(fs + "-" + lr);
                }
            });
            this.player = player;
            
            player.setState("stand-right");
            
            player.onPlatform = function() {
                var y_threshold = 10;
                for(var p in engine.pillars) {
                    var pillar = engine.pillars[p];
                    if(Math.abs(this.getX()-pillar.getX()) < pillar.size.w/2) {
                        if(Math.abs(this.getY()-pillar.getY()) < y_threshold)
                            return pillar;
                    }
                }
                return null;
            }
            
            player.reset = function() {
                this.setX(player_start_x);
                this.setY(player_start_y);
                this.setVx(0);
                this.setVy(0);
            }
            
            engine.setCameraTarget(player);
            
            this.canvas.addEventListener("mouseup", function(e) {
                if(engine.player.getState().indexOf("stand")!=-1) {
                    var lr;
                    if(e.offsetX < engine.player.getTransformedDrawRect().x) {
                        lr = "left";
                    } else {
                        lr = "right";
                    }
                    engine.player.setState("stand-" + lr);
                }
            });
            
            // Load some sounds
            /*
            var jump = document.getElementById("sfx-jump");
            jump.volume = 0.5;
            this.jump = jump;
            
            var upsound = document.getElementById("sfx-up");
            upsound.volume = 0.5;
            this.upsound = upsound;
            
            this.music = new Audio("audio/lowtones.mp3");
            this.music.volume = 1;
            this.music.loop = true;
            this.music.play();
            */
            
            /*
            player.listen("leavescreen", function() {
                this.velocity.x *= -1;
                this.velocity.y *= -1;
                engine.blip.play();
            });
            
            this.blip = new Audio("audio/blip.wav");
            this.blip.volume = 0.5;
            
            this.music = new Audio("audio/music.wav");
            this.music.volume = 0.5;
            this.music.loop = true;
            this.music.play();
            */
            
            /* Bind key listeners */
            engine.left = engine.keys.addKey({
	            keyCode: 37
	        });
            engine.right = engine.keys.addKey({
	            keyCode: 39
            });
            engine.up = engine.keys.addKey({
	            keyCode: 38
            });
            engine.down = engine.keys.addKey({
	            keyCode: 40
            });
            engine.spacebar = engine.keys.addKey({
	            keyCode: 32
            });
        },
        
        main: function(now, delta) {
            this.ctx.strokeText(this.getFPS().toFixed(0) + " fps", 10, 30);
            var tmp = Math.sin(now/3)*9.81*215;
            
            if(tmp < -0.8*9.81*215) {
                this.gravity = 9.81*200 + tmp;
                if(!this.played_upsound) {
                    this.star_fall_speed = 0;
                    this.star_fall_speed_x = 0;
                }
            } else {
                this.gravity = 9.81*200;
                    this.star_fall_speed = this.gravity / 80 + 5;
                    this.star_fall_speed_x = 10;
            }
        },
        
        exit: function() {
            log("End");
        }
    });
    
    engine.start();

});










