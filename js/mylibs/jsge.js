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
            
            var local_closure = this;
            function loop() {
                try {
                    if(me.running) {
                        requestAnimFrame(loop, me.canvas);
                        
                        // Internal drawing code here
                        // Input
                        // Update
                        // Draw
                        
                        for(var s in local_closure.sprites) {
                            var sprite = local_closure.sprites[s];
                            sprite.update();
                            sprite.clear();
                            sprite.draw();
                        }
                        
                        args.main && args.main.apply(local_closure)
                    } else {
                        args.exit && args.exit.apply(local_closure);
                        
                        // Internal pack-up code here
                        
                    }
                } catch(err) {
                    local_closure.quit();
                }
            }
            
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
        
        me.size = {
            w: isdef(args.w) ? args.w : me.img.width,
            h: isdef(args.h) ? args.h : me.img.height
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
        }
        
        me.clear = function() {
            engine.ctx.clearRect(
                this.position.x - this.size.w/2,
                this.position.y - this.size.h/2,
                this.size.w,
                this.size.h
            );
        }
        
        me.draw = function() {
            engine.ctx.drawImage(
                this.img,
                this.position.x - this.size.w/2,
                this.position.y - this.size.h/2,
                this.size.w,
                this.size.h
            );
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
        
        engine.sprites.push(me);
        
        return me;
        
    }
    
    
    return me;
    
})(jsge);







