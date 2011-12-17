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
                    w: 16,
                    h: 16,
                    vx: 0,
                    vy: 1,
                    img: document.getElementById("img-star"),
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
            
            // Create the pillar the player starts on
            this.start_pillar = new jsge.Sprite(this, {
                x: 850,
                y: 350,
                w: 26,
                h: 900,
                origin: "n",
                fill: "rgb(45, 45, 55)"
            });
            
            this.player = new jsge.Sprite(this, {
                x: 850,
                y: 350,
                w: 32,
                h: 64,
                origin: "s",
                img: document.getElementById("img-player")
            });
            
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










