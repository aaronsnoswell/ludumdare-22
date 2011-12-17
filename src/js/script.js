/* Author: 

*/

var engine;

$(document).ready(function() {
    
    engine = new jsge.Engine("stage", {
        init: function() {
            this.ctx.font = "20pt Arial";
            
            this.stars = [];
            
            /* Create the stars in the background */
            for(var i=0; i<15; i++) {
                var star = new jsge.Sprite(this, {
                    x: Math.random()*this.getWidth(),
                    y: Math.random()*this.getHeight()*2 - this.getHeight(),
                    w: 8,
                    h: 8,
                    vx: 0.2,
                    vy: 1,
                    fill: "rgba(255,254,188,0.7)",
                    update : function() {
                        this.trail_length = this.trail_length || 110;
                        
                        this.position_trail_x = this.position_trail_x || [];
                        this.position_trail_y = this.position_trail_y || [];
                        
                        if(this.position_trail_x.length == this.trail_length) {
                            this.position_trail_x.shift();
                            this.position_trail_y.shift();
                        }
                        
                        this.position_trail_x.push(this.position.x);
                        this.position_trail_y.push(this.position.y);
                    },
                    draw : function() {
                        engine.ctx.strokeStyle = "rgba(255,255,255,0.1)";
                        engine.ctx.beginPath();
                        engine.ctx.moveTo(
                            this.position_trail_x[0],
                            this.position_trail_y[0]
                        );
                        engine.ctx.lineTo(
                            this.position.x,
                            this.position.y
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
                    if(this.position.y >= engine.getHeight() + 16 + this.trail_length) {
                        this.position.x = Math.random()*engine.getWidth();
                        this.position.y = Math.random()*engine.getHeight() - engine.getHeight();
                        this.position_trail_x = [];
                        this.position_trail_y = [];
                    }
                });
                
                
                this.stars.push(star);
            }
            
            var player_start_x = 850,
                player_start_y = 350;
            
            this.pillars = [];
            
            var pillar_width = 26,
                pillar_height = 900,
                pillar_spacing = 700
                pillar_step = 200;
            
            
            /* Create the pillars */
            for(var i=0; i<3; i++) {
                // Create the pillar the player starts on
                this.pillars.push(new jsge.Sprite(this, {
                    x: player_start_x - i*pillar_spacing,
                    y: player_start_y - i*pillar_step,
                    w: pillar_width,
                    h: pillar_height,
                    origin: "n",
                    fill: "rgb(45, 45, 55)"
                }));
            }
            
            this.player = new jsge.Sprite(this, {
                x: 850,
                y: 350,
                w: 32,
                h: 64,
                origin: "s",
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
                    var stand_or_fall = "fall";
                    var speed = 4;
                    if(this.onPlatform()) {
                        stand_or_fall = "stand";
                        this.acceleration.y = 0;
                        this.velocity.y = 0;
                        speed = 2;
                    } else {
                        this.acceleration.y = 1;
                        speed = 4;
                    }
                    
                    var left_or_right = (this.getState().indexOf("right")!=-1) ? "right" : "left";
                    if(engine.left.pressed && !engine.right.pressed) {
                        left_or_right = "left";
                        this.velocity.x = -speed;
                    } else if(engine.right.pressed && !engine.left.pressed) {
                        left_or_right = "right";
                        this.velocity.x = speed;
                    } else {
                        this.velocity.x = 0;
                    }
                    
                    this.setState(stand_or_fall + "-" + left_or_right);
                }
            });
            
            this.player.onPlatform = function() {
                for(var p in engine.pillars) {
                    var pillar = engine.pillars[p];
                    if(Math.abs(this.position.x - pillar.position.x) < pillar.size.w) {
                        if(this.position.y >= pillar.position.y) return true;
                    }
                }
                return false;
            }   
            
            this.player.setState("stand-right");
            
            
            /*
            player.listen("leavescreen", function() {
                this.velocity.x *= -1;
                this.velocity.y *= -1;
                engine.blip.play();
            });
            
            this.canvas.addEventListener("mouseup", function(e) {
                player.clear();
                player.position.x = e.offsetX;
                player.position.y = e.offsetY;
            });
            
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
            engine.spcaebar = engine.keys.addKey({
	            keyCode: 32,
	            press: function() {
	                engine.player.position.y -= 50;
	            }
            });
        },
        
        main: function() {
            
        },
        
        exit: function() {
            log("End");
        }
    });
    
    console.log(engine);
    engine.start();

});










