/* Author: 

*/

var engine;

$(document).ready(function() {
    
    engine = new jsge.Engine("stage", {
        init: function() {
            this.ctx.font = "20pt Arial";
            
            // Arbitary scale to get realistic-looking fall speed
            var gravity = 9.81 * 200;
            
            /*
            this.stars = [];
            
            // Create the stars in the background
            for(var i=0; i<20; i++) {
                var star = new jsge.Sprite(this, {
                    x: Math.random()*this.getWidth(),
                    y: Math.random()*this.getHeight()*2 - this.getHeight(),
                    w: 8,
                    h: 8,
                    vx: 2,
                    vy: 10,
                    fill: "rgba(255,254,188,0.7)",
                    update : function() {
                        this.trail_length = this.trail_length || 110;
                        
                        this.position_trail_x = this.position_trail_x || [];
                        this.position_trail_y = this.position_trail_y || [];
                        
                        if(this.position_trail_x.length == this.trail_length) {
                            this.position_trail_x.shift();
                            this.position_trail_y.shift();
                        }
                        
                        this.position_trail_x.push(this.getX());
                        this.position_trail_y.push(this.getY());
                    },
                    draw : function() {
                        engine.ctx.strokeStyle = "rgba(255,255,255,0.1)";
                        engine.ctx.lineCap = "round";
                        engine.ctx.beginPath();
                        engine.ctx.moveTo(
                            this.position_trail_x[0],
                            this.position_trail_y[0]
                        );
                        engine.ctx.lineTo(
                            this.getX(),
                            this.getY()
                        );
                       engine.ctx.closePath(); 
                       engine.ctx.stroke();
                    },
                    clear : function() {
                        var line_clear_glitch_padding = 5;
                        var startx = Math.min(this.position_trail_x[0], this.position_trail_x[19]) - line_clear_glitch_padding,
                            starty = Math.min(this.position_trail_y[0], this.position_trail_y[19]) - line_clear_glitch_padding,
                            width = Math.max(this.position_trail_x[0], this.position_trail_x[19]) + line_clear_glitch_padding - startx,
                            height = Math.max(this.position_trail_y[0], this.position_trail_y[19]) + line_clear_glitch_padding - starty;
                        
                        engine.ctx.clearRect(
                            startx,
                            starty,
                            width,
                            height
                        );
                    }
                });
                
                star.listen("leavescreen", function() {
                    // Move the star back up to the top if it falls off-screen
                    if(this.getY() >= engine.getHeight() + 16 + this.trail_length) {
                        this.setX(Math.random()*engine.getWidth());
                        this.setY(Math.random()*engine.getHeight() - engine.getHeight());
                        this.position_trail_x = [];
                        this.position_trail_y = [];
                    }
                });
                
                
                this.stars.push(star);
            }
            */
            
            var player_start_x = 850,
                player_start_y = 350;
            
            this.pillars = [];
            
            var pillar_width = 26,
                pillar_height = 900,
                pillar_spacing = 700
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
                x: 850,
                y: 350,
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
                        speed = (cfs=="fall") ? 20 : 10,
                        speedlim = (cfs=="fall") ? 300 : 30;
                    
                    // Handle key input
                    if(engine.left.pressed && !engine.right.pressed) {
                        if(Math.abs(this.getVx()) < speedlim)
                            this.phys_state.vel.x -= speed;
                    } else if(engine.right.pressed && !engine.left.pressed) {
                        if(Math.abs(this.getVx()) < speedlim)
                            this.phys_state.vel.x += speed;
                    } else {
                        this.phys_state.vel.x *= 0.8;
                    }
                    
                    var standing_on = this.onPlatform();
                    if(standing_on) {
                        this.setVy(0);
                        this.setY(standing_on.getY());
                    } else {
                        this.phys_state.vel.y += gravity/this.phys_state.mass;
                    }
                    
                    if(engine.spacebar.pressed && cfs=="stand") {
                        this.phys_state.vel.y -= 200;
                    }
                    
                    // Update the player's sprite state
                    var fs = "stand"
                    if(this.getVy() != 0) fs = "fall";
                    
                    var lr = "right";
                    if(this.getVx() < 0) lr = "left";
                    
                    this.setState(fs + "-" + lr);
                }
            });
            this.player = player;
            
            player.setState("stand-right");
            
            player.onPlatform = function() {
                var y_threshold = 5;
                for(var p in engine.pillars) {
                    var pillar = engine.pillars[p];
                    if(Math.abs(this.getX()-pillar.getX()) < pillar.size.w/2) {
                        if(Math.abs(this.getY()-pillar.getY()) < y_threshold)
                            return pillar;
                    }
                }
                return null;
            }
            
            
            /*
            this.canvas.addEventListener("mouseup", function(e) {
                var stand_or_fall = (engine.player.getState().indexOf("fall")==-1) ? "fall" : "stand";
                var left_or_right = "left";
                if(e.offsetX < engine.player.getX()) {
                    left_or_right = "left";
                } else {
                    left_or_right = "right";
                }
                engine.player.setState(stand_or_fall + "-" + left_or_right);
            });
            
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
        },
        
        exit: function() {
            log("End");
        }
    });
    
    engine.start();

});










