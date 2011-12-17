/**
 * jsge.js - A lightweight, evented javascript game engine
 */
    
// requestAnim shim layer by Paul Irish
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(callback, element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();


var jsge = (function(me) {
    me = me || {};
    
    function isdef(o) {
        if(typeof(o) == "undefined") return false;
        return true;
    }
    
    me.Engine = function(canvas_id, args) {
        me = {};
        
        // Globals here
        me.running = true;
        me.event_dispatch = document.createElement("div");
        me.events = {};
        
        me.start = function() {
            
            
            // Internal init code here...
            me.canvas = document.getElementById(canvas_id);  
            me.ctx = me.canvas.getContext('2d');
            
            me.keys = new keyListener({
                name: 'keyListener'
            });
            
            args.init && args.init.apply(this);
            
            me.fps_tracker = [];
            me.getFPS = function() {
                var av = 0;
                for(var i in me.fps_tracker) {
                    av += me.fps_tracker[i];
                }
                av /= me.fps_tracker.length;
                return av;
            }
            
            var local_closure = this;
            var prev_time = new Date().getTime()/1000;
            this.runtime = 0;
            function loop() {
                // Track time delta and fps
                var now = new Date().getTime()/1000,
                    delta = now - prev_time;
                prev_time = now;
                me.runtime += delta;
                
                me.fps_tracker.push(1.0/delta);
                if(me.fps_tracker.length == 20) me.fps_tracker.shift();
                
                try {
                    if(me.running) {
                        requestAnimFrame(loop, me.canvas);
                        
                        // Internal drawing code here
                        // Input
                        // Update
                        // Draw
                        
                        local_closure.ctx.clearRect(
                            0,
                            0,
                            local_closure.getWidth(),
                            local_closure.getHeight()
                        );
                        
                        for(var s in local_closure.sprites) {
                            var sprite = local_closure.sprites[s];
                            sprite.update();
                            
                            // Culling optimisations
                            if(!sprite.onScreen()) continue;
                            
                            sprite.draw();
                        }
                        
                        args.main && args.main.apply(local_closure, [delta])
                    } else {
                        args.exit && args.exit.apply(local_closure);
                        
                        // Internal pack-up code here
                        
                    }
                } catch(err) {
                    console.log(err);
                    local_closure.quit();
                }
            }
            
            window.addEventListener("blur", function() {
                me.running = false;
            });
            
            window.addEventListener("focus", function() {
                me.running = true;
                loop();
            });
            
            loop();
            
        }
        
        me.trigger = function(event_name, args) {
            if(!(args instanceof Array)) args = [args];
            for(var f in this.events[event_name]) {
                this.events[event_name][f].apply(this, args);
            }
        }
        
        me.listen = function(event_name, handler) {
            me.events[event_name] = me.events[event_name] || [];
            me.events[event_name].push(handler);
        }
        
        me.quit = function() {
            this.running = false;
        }
        
        me.getWidth = function() {
            return this.canvas.width;
        }
        
        me.getHeight = function() {
            return this.canvas.height;
        }
        
        me.sprites = [];
        
        return me;
    }
    
    /**
     * A Sprite class.
     */
    me.Sprite = function(engine, args) {
        var me = {};
        
        // Read args
        me.position = {
            x: isdef(args.x) ? args.x : 0,
            y: isdef(args.y) ? args.y : 0
        }
        
        me.velocity = {
            x: isdef(args.vx) ? args.vx : 0,
            y: isdef(args.vy) ? args.vy : 0
        }
        
        // Set via physics engine
        me.acceleration = {
            x: 0,
            y: 0
        }
        
        me.theta = isdef(args.th) ? args.th : 0;
        me.omega = isdef(args.om) ? args.om : 0;
        me.alpha = 0;
        
        me.img = args.img;
        me.fill = args.fill;
        
        me.size = {
            w: isdef(args.w) ? args.w : me.img.width,
            h: isdef(args.h) ? args.h : me.img.height
        }
        
        me.origin = isdef(args.origin) ? args.origin : "c";
        me.origin_offset_x =
            (me.origin.indexOf("e")!==-1) ? -me.size.w :
            (me.origin.indexOf("w")!==-1) ? 0 : -me.size.w/2;
        me.origin_offset_y =
            (me.origin.indexOf("n")!==-1) ? 0 :
            (me.origin.indexOf("s")!==-1) ? -me.size.h : -me.size.h/2;
        
        me.states = isdef(args.states) ? args.states : {};
        me.state = "";
        me.setState = function(state) {
            this.state = state;
        }
        me.getState = function() {
            return this.state;
        }
        
        me.mass = isdef(args.mass) ? args.mass : 0;
        
        me.update = function() {
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.velocity.x += this.acceleration.x;
            this.velocity.y += this.acceleration.y;
            
            this.theta += this.omega;
            this.omega += this.alpha;
            
            if(this.position.x<0 || this.position.x>engine.getWidth() ||
               this.position.y<0 || this.position.y>engine.getHeight()) {
                engine.trigger("leavescreen", [this]);
            }
            
            args.update && args.update.apply(this);
        }
        
        me.clear = function() {
            engine.ctx.clearRect(
                this.position.x + this.origin_offset_x,
                this.position.y + this.origin_offset_y,
                this.size.w,
                this.size.h
            );
            
            args.clear && args.clear.apply(this);
        }
        
        me.draw = function() {
            if(this.img) {
                if(me.state == "") {
                    engine.ctx.drawImage(
                        this.img,
                        this.position.x + this.origin_offset_x,
                        this.position.y + this.origin_offset_y,
                        this.size.w,
                        this.size.h
                    );
                } else {
                    engine.ctx.drawImage(
                        this.img,
                        this.states[this.state].x,
                        this.states[this.state].y,
                        this.size.w,
                        this.size.h,
                        this.position.x + this.origin_offset_x,
                        this.position.y + this.origin_offset_y,
                        this.size.w,
                        this.size.h
                    );
                }
            } else if(this.fill) {
                engine.ctx.fillStyle = this.fill;
                engine.ctx.fillRect(
                    this.position.x + this.origin_offset_x,
                    this.position.y + this.origin_offset_y,
                    this.size.w,
                    this.size.h
                )
            }
            
            args.draw && args.draw.apply(this);
        }
        
        me.remove = function() {
            // TODO
            //engine.sprites.split(this);
        }
        
        me.listen = function(event, callback) {
            engine.listen(event, function(fired_by) {
                if(fired_by == me) callback.apply(me);
            });
        }
        
        me.onScreen = function() {
            if(this.position.x < -this.size.w) return false;
            if(this.position.x > engine.getWidth() + this.size.w) return false;
            if(this.position.y < -this.size.h) return false;
            if(this.position.y > engine.getHeight() + this.size.h) return false;
            return true;
        }
        
        engine.sprites.push(me);
        
        return me;
        
    }
    
    
    return me;
    
})(jsge);







