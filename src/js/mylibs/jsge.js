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
    
    var Engine = function(canvas_id, args) {
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
                        
                        /* Collide physics elements against each other */
                        for(var i=0; i<me.colliders.length; i++) {
                            var s1 = me.colliders[i];
                            for(var j=i; j<me.colliders.length; j++) {
                                var s2 = me.colliders[j];
                                if(s2 == s1) continue;
                                
                                // Bounding-box hitest the two sprites
                                var hitx = false,
                                    hity = false;
                                var d1 = s1.getDrawRect(),
                                    d2 = s2.getDrawRect(),
                                    dx = Math.abs(d2.x-d1.x),
                                    dy = Math.abs(d2.y-d1.y);
                                
                                if(d1.x < d2.x) {
                                    if(dx < d1.w) hitx = true;
                                } else {
                                    if(dx < d2.w) hitx = true;
                                }
                                if(!hitx) continue;
                                
                                if(d1.y < d2.y) {
                                    if(dy < d1.h) hity = true;
                                } else {
                                    if(dy < d2.h) hity = true;
                                }
                                if(!hity) continue;
                                
                                var norm = s2.getDrawCenter().sub(s1.getDrawCenter());
                                me.trigger("spriteCollide", [s1, s2, norm]);
                            }
                        }
                        
                        for(var s in local_closure.sprites) {
                            var sprite = local_closure.sprites[s];
                            sprite.update(now, delta);
                            
                            // Culling optimisations
                            if(!sprite.onScreen()) continue;
                            
                            sprite.draw(now, delta);
                        }
                        
                        args.main && args.main.apply(local_closure, [now, delta])
                    } else {
                        args.exit && args.exit.apply(local_closure);
                        
                        // Internal pack-up code here
                        
                    }
                } catch(err) {
                    console.log(err, err.message, err.stack);
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
        
        /* Accelerate the given state in some characteristic manner */
        me.accelerate = function(state, t) {
            // Do something to state using t
            var acc = new Vector();
            
            // Mass = 0 indicates an infinitely large object
		    if(state.mass == 0) return acc;
            
		    // Add up the forces and divide by mass to get acceleration (F=ma)
		    acc.x = state.forces.x / state.mass;
		    acc.y = state.forces.y / state.mass;
		
            return acc;
        }
        
        /* Evaluate the given conditions to resolve the output state */
        me.evaluate = function(initial, t, dt, derivative) {
        	var state = new State();
            state.pos.x = initial.pos.x + derivative.dpos.x*dt;
            state.pos.y = initial.pos.y + derivative.dpos.y*dt;
            state.vel.x = initial.vel.x + derivative.dvel.x*dt;
            state.vel.y = initial.vel.y + derivative.dvel.y*dt;
            state.forces = initial.forces;
            state.mass = initial.mass;
            
            var output = new Derivative();
            output.dpos.x = state.vel.x;
            output.dpos.y = state.vel.y;
            output.dvel = me.accelerate(state, t+dt);
            
            return output;
        }
        
        /* Integrate the given state over [t, t+dt] */
        me.integrate = function(state, t, dt) {
            var a = me.evaluate(state, t, 0.0, new Derivative());
            var b = me.evaluate(state, t+dt*0.5, dt*0.5, a);
            var c = me.evaluate(state, t+dt*0.5, dt*0.5, b);
            var d = me.evaluate(state, t+dt, dt, c);
            
            var dxdt = 1.0/6.0 * (a.dpos.x + 2.0*(b.dpos.x + c.dpos.x) + d.dpos.x);
            var dydt = 1.0/6.0 * (a.dpos.y + 2.0*(b.dpos.y + c.dpos.y) + d.dpos.y);
            var dvxdt = 1.0/6.0 * (a.dvel.x + 2.0*(b.dvel.x + c.dvel.x) + d.dvel.x);
            var dvydt = 1.0/6.0 * (a.dvel.y + 2.0*(b.dvel.y + c.dvel.y) + d.dvel.y);
            
            state.pos.x += dxdt * dt;
            state.pos.y += dydt * dt;
            state.vel.x += dvxdt * dt;
            state.vel.y += dvydt * dt;
        }
        
        /* 
         * Adds the given object to the set of sprites that are hit-tested
         */
        me.colliders = [];
        me.addCollider = function(sprite) {
            if(me.colliders.indexOf(sprite)!=-1) return;
            me.colliders.push(sprite);
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
    me.Engine = Engine;
    
    
    /* A 2D vector class */
    var Vector = function(x, y) {
        var me = {};
        
        me.x = isdef(x) ? x : 0;
        me.y = isdef(y) ? y : 0;
        
        me.add = function(v) {
            return new Vector(this.x+v.x, this.y+v.y);
        }
        me.sub = function(v) {
            return new Vector(this.x-v.x, this.y-v.y);
        }
        me.mag = function() {
            return Math.sqrt(this.x*this.x + this.y*this.y);
        }
        me.norm = function() {
            var mag = this.mag();
            return new Vector(this.x/mag, this.y/mag);
        }
        me.smul = function(s) {
            return new Vector(this.x*s, this.y*s);
        }
        
        return me;
    }
    me.Vector = Vector;
    
    /* A Physics State class - has a position and velocity */
    var State = function() {
        var me = {};
        
        me.pos = new Vector();
        me.vel = new Vector();
        
        me.mass = 0;
        me.forces = new Vector();
        
        return me;
    }
    me.State = State;
    
    /* The derivative of a State object */
    var Derivative = function() {
        var me = {};
        
        me.dpos = new Vector();
        me.dvel = new Vector();
        
        return me;
    }
    me.Derivative = Derivative;
    
    
    
    /**
     * A Sprite class.
     */
    var Sprite = function(engine, args) {
        var me = {};
        
        // Read args
        me.phys_state = new State();
        me.phys_state.pos = {
            x: isdef(args.x) ? args.x : 0,
            y: isdef(args.y) ? args.y : 0
        }
        me.phys_state.vel = {
            x: isdef(args.vx) ? args.vx : 0,
            y: isdef(args.vy) ? args.vy : 0
        }
        
        me.phys_state.mass = isdef(args.mass) ? args.mass : 0;
        
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
        
        me.getDrawRect = function() {
            return {
                x: this.getX() + this.origin_offset_x,
                y: this.getY() + this.origin_offset_y,
                w: this.size.w,
                h: this.size.h
            };
        }
        
        me.getDrawCenter = function() {
            return new Vector(
                this.getX() + this.origin_offset_x + this.size.w/2,
                this.getY() + this.origin_offset_y + this.size.h/2
            );
        }
        
        me.update = function(now, delta) {
            engine.integrate(this.phys_state, now, delta);
            
            this.theta += this.omega;
            this.omega += this.alpha;
            
            if(this.getX()<0 || this.getX()>engine.getWidth() ||
               this.getY()<0 || this.getY().y>engine.getHeight()) {
                engine.trigger("leavescreen", [this]);
            }
            
            args.update && args.update.apply(this);
        }
        
        me.clear = function() {
            engine.ctx.clearRect(
                this.getX() + this.origin_offset_x,
                this.getY() + this.origin_offset_y,
                this.size.w,
                this.size.h
            );
            
            args.clear && args.clear.apply(this);
        }
        
        me.draw = function(now, delta) {
            if(this.img) {
                if(me.state == "") {
                    engine.ctx.drawImage(
                        this.img,
                        this.getX() + this.origin_offset_x,
                        this.getY() + this.origin_offset_y,
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
                        this.getX() + this.origin_offset_x,
                        this.getY() + this.origin_offset_y,
                        this.size.w,
                        this.size.h
                    );
                }
            } else if(this.fill) {
                engine.ctx.fillStyle = this.fill;
                engine.ctx.fillRect(
                    this.getX() + this.origin_offset_x,
                    this.getY() + this.origin_offset_y,
                    this.size.w,
                    this.size.h
                )
            }
            
            args.draw && args.draw.apply(this);
        }
        
        me.getForces = function() {
            return me.phys_state.forces;
        }
        
        me.addForce = function(x, y) {
            me.phys_state.forces.x += x;
            me.phys_state.forces.y += y;
        }
        
        me.setForce = function(x, y) {
            me.phys_state.forces.x = x;
            me.phys_state.forces.y = y;
        }
        
        me.getVx = function() {
            return this.phys_state.vel.x;
        }
        
        me.setVx = function(vx) {
            this.phys_state.vel.x = vx;
        }
        
        me.getVy = function() {
            return this.phys_state.vel.y;
        }
        
        me.setVy = function(vy) {
            this.phys_state.vel.y = vy;
        }
        
        me.getMass = function() {
            return this.phys_state.mass;
        }
        
        me.setMass = function(m) {
            this.phys_state.mass = m;
        }
        
        me.setX = function(x) {
            this.phys_state.pos.x = x;
        }
        
        me.getX = function() {
            return this.phys_state.pos.x;
        }
        
        me.setY = function(y) {
            this.phys_state.pos.y = y;
        }
        
        me.getY = function() {
            return this.phys_state.pos.y;
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
            if(this.getX() < -this.size.w) return false;
            if(this.getX() > engine.getWidth() + this.size.w) return false;
            if(this.getY() < -this.size.h) return false;
            if(this.getY() > engine.getHeight() + this.size.h) return false;
            return true;
        }
        
        engine.sprites.push(me);
        
        return me;
        
    }
    me.Sprite = Sprite;
    
    
    return me;
    
})(jsge);







