/* Author: 

*/

var engine;

$(document).ready(function() {
    
    engine = new jsge.Engine("stage", {
        init: function() {
            
            var player = new jsge.Sprite(this, {
                x: 100,
                y: 100,
                vx: 1,
                vy: 1,
                w: 100,
                h: 100,
                img: document.getElementById("img-sigmund")
            });
            
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
            
            this.ctx.mozImageSmoothingEnabled = false;
            
            /*
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
            */
            
            this.player = player;
            
            this.blip = new Audio("audio/blip.wav");
            this.blip.volume = 0.5;
            
            this.music = new Audio("audio/music.wav");
            this.music.volume = 0.5;
            this.music.loop = true;
            this.music.play();
            
            this.ctx.font = "20pt Arial";
            
        },
        
        main: function() {
            this.ctx.fillText("Hello, world!", 50, 50);
        },
        
        exit: function() {
            log("End");
        }
    });

    engine.start();

});










