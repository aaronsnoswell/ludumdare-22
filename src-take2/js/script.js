/* 
 * TODO: Write docstring
 */

var engine;

$(document).ready(function() {
    
    engine = new jsge.Engine("stage", {
        init: function() {
            log("Init");
            
            this.ctx.font = "20px Arial";
            var gravity = new jsge.Vector(0, 600000);
            
            this.stars = [];
            for(var i=0; i<50; i++) {
                var dist = (Math.random()*0.6+0.4);
                
                var star = new jsge.Sprite(this, {
                    x: Math.random()*engine.getWidth(),
                    y: Math.random()*engine.getHeight(),
                    w: dist * 10,
                    h: dist * 10,
                    vx: (dist-0.3) * 5,
                    vy: (dist-0.3) * 15,
                    fill: t("rgba(255,254,188,{a})", {a:dist-0.3}),
                    mass: 100,
                    inertia: 10
                });
                
                star.listen("leavescreen", function() {
                    var dist = (Math.random()*0.6+0.4);
                    this.setX(Math.random()*engine.getWidth());
                    this.setY(-Math.random()*engine.getHeight()*0.2);
                    this.setW(dist * 10);
                    this.setH(dist * 10);
                    this.setVx((dist-0.3) * 5);
                    this.setVy((dist-0.3) * 15);
                    this.fill = t("rgba(255,254,188,{a})", {a:dist-0.3});
                });
                
                this.stars.push(star);
            }
            
            
            
            this.player = new jsge.Sprite(this, {
                x: 850,
                y: 400,
                w: 32,
                h: 64,
                mass: 100,
                inertia: 10,
                img: "img/player.png",
                states: {
                    "stand-right": {
                        "length": 7000,
                        frames: [
                            {x:0, y:0, weight:2},
                            {x:32, y:0}
                        ]
                    },
                    "stand-left": {
                        "length": 7000,
                        frames: [
                            {x:64, y:0, weight:2},
                            {x:96, y:0}
                        ]
                    },
                    "fall-right": {
                        "length": 300,
                        frames: [
                            {x:0, y:64},
                            {x:32, y:64}
                        ]
                    },
                    "fall-left": {
                        "length": 300,
                        frames: [
                            {x:64, y:64},
                            {x:96, y:64}
                        ]
                    }
                }
            });
            this.player.setState("fall-right");
            this.player.addForce("gravity", gravity);
            
            
            
            
            
        },
        
        main: function(now, delta) {
            this.ctx.fillText(this.getFPS().toFixed(0), 10, 25);
        },
        
        pause: function() {
            log("Paused");
        },
        
        resume: function() {
            log("Resumed");
        },
        
        exit: function() {
            log("Exit");
        }
    });
    
    engine.start();

});










