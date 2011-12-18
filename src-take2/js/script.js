/* 
 * TODO: Write docstring
 */

var engine;

$(document).ready(function() {
    
    engine = new jsge.Engine("stage", {
        init: function() {
            log("Init");
            
            this.player = new jsge.Sprite(this, {
                x: 100,
                y: 100,
                w: 32,
                h: 64,
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
        },
        
        main: function(now, delta) {
            
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










