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
        
        /* ===================================================================== Globals */
        me.running = true;
        me.events = {};
        me.fps_history = [0,0,0,0,0,0,0,0,0];
        me.runtime = 0;
        me.sprites = [];
        me.phys = new PhysicsIntegrator(me);
        
        /* ===================================================================== Initialisation Methods */
        me.canvas = document.getElementById(canvas_id);  
        me.ctx = me.canvas.getContext('2d');
        
        
        me.keys = new keyListener({
            name: 'keyListener'
        });
        
        
        /**
         * Starts the game engine and the main loop
         */
        me.start = function() {
            
            args.init && args.init.apply(this);
            
            // Add window focus listeners
            me.onwindowblur = function() {
                me.running = false;
            }
            window.addEventListener("blur", me.onwindowblur);
            
            me.onwindowfocus = function() {
                me.running = true;
                args.resume && args.resume.apply(me);
                loop();
            }
            window.addEventListener("focus", me.onwindowfocus);
            
            
            /* ================================================================= Main Loop */
            var prev_time = new Date().getTime()/1000;
            function loop() {
                // Track time delta and fps
                var now = new Date().getTime()/1000,
                    delta = now - prev_time;
                
                prev_time = now;
                me.runtime += delta;
                me.fps_history.push(1.0/delta);
                me.fps_history.shift();
                
                
                // Catch errors and quit
                try {
                    if(me.running) {
                        requestAnimFrame(loop, me.canvas);
                        
                        // Internal drawing code here
                        // Input
                        // Update
                        // Draw
                        
                        // Update the camera position
                        
                        // Clear the screen
                        me.ctx.clearRect(
                            0,
                            0,
                            me.getWidth(),
                            me.getHeight()
                        );
                        
                        /* Collide physics elements agains each other */
                        me.phys.collide(delta);
                        
                        // Draw all sprites
                        for(var s in me.sprites) {
                            var sprite = me.sprites[s];
                            
                            sprite.clear();
                            
                            sprite.update(now, delta);
                            
                            // Culling optimisations
                            //if(!sprite.onScreen()) continue;
                            
                            sprite.draw(now, delta);
                        }
                        
                        args.main && args.main.apply(me, [now, delta])
                    } else {
                        // Game loop paused for some reason
                        args.pause && args.pause.apply(me);
                    }
                } catch(err) {
                    console.log(err, err.message, err.stack);
                    me.quit();
                }
            }
            
            // Kick things off
            loop();
            
        }
        
        /**
         * Kill the main loop and exit the game
         */
        me.quit = function() {
            this.running = false;
            args.exit && args.exit.apply(me);
            
            window.removeEventListener("blur", me.onwindowblur);
            window.removeEventListener("focus", me.onwindowfocus);
        }
        
        /**
         * Trigers the given custom event with the given arguements
         */
        me.trigger = function(event_name, args) {
            if(!(args instanceof Array)) args = [args];
            for(var f in this.events[event_name]) {
                this.events[event_name][f].apply(this, args);
            }
        }
        
        /**
         * Adds a listener for the given custom event
         */
        me.listen = function(event_name, handler) {
            me.events[event_name] = me.events[event_name] || [];
            me.events[event_name].push(handler);
        }
        
        
        /* ==================================================================== Getters and Setters */
        me.etWidth = function(w) {
            if(w) this.canvas.width = w;
            return this.canvas.width;
        }
        me.getWidth = me.setWidth = me.etWidth;
        
        me.etHeight = function(h) {
            if(h) this.canvas.height = h;
            return this.canvas.height;
        }
        me.getHeight = me.setHeight = me.etHeight;
        
        me.getFPS = function() {
            var av = 0;
            for(var f in me.fps_history) {
                av += me.fps_history[f];
            }
            av /= me.fps_history.length;
            return av;
        }
        
        
        
        return me;
    }
    me.Engine = Engine;
    
    
    /**
     * A Sprite class.
     */
    var Sprite = function(engine, args) {
        var me = {};
        
        // Read args
        me.phys = new State();
        me.phys.pos = {
            x: isdef(args.x) ? args.x : 0,
            y: isdef(args.y) ? args.y : 0
        }
        me.phys.vel = {
            x: isdef(args.vx) ? args.vx : 0,
            y: isdef(args.vy) ? args.vy : 0
        }
        me.phys.theta = isdef(args.theta) ? args.theta : 0;
        me.phys.omega = isdef(args.omega) ? args.omega : 0;
        
        me.phys.mass = isdef(args.mass) ? args.mass : 0;
        me.phys.inertia = isdef(args.inertia) ? args.inertia : 0;
        
        // Load the sprite image
        if(typeof(args.img)=="string") {
            // Load it, if the user didn't
            me.img = new Image();
            me.img.src = args.img;
        } else {
            // Otherwise just store a reference to it
            me.img = args.img;
        }
        
        me.fill = args.fill;
        
        me.size = {
            w: isdef(args.w) ? args.w : me.img.width,
            h: isdef(args.h) ? args.h : me.img.height
        }
        
        me.origin = isdef(args.origin) ? args.origin : "c";
        me.origin_x =
            (me.origin.indexOf("e")!==-1) ? -me.size.w :
            (me.origin.indexOf("w")!==-1) ? 0 : -me.size.w/2;
        me.origin_y =
            (me.origin.indexOf("n")!==-1) ? 0 :
            (me.origin.indexOf("s")!==-1) ? -me.size.h : -me.size.h/2;
        
        me.states = isdef(args.states) ? args.states : {};
        me.state = "";
        me.anim_time = 0;
        
        
        /**
         * Removes this sprite from the engine
         */
        me.remove = function() {
            engine.sprites.splice(engine.sprites.indexOf(me), 1);
        }
        
        /**
         * Updates the physical properties of the sprite
         */
        me.update = function(now, delta) {
            engine.phys.integrate(this.phys, now, delta);
            
            var visible = engine.phys.hitTestBoxOnBox(this.getRect(), {
                x: 0,
                y: 0,
                w: engine.getWidth(),
                h: engine.getHeight()
            });
            if(!visible) engine.trigger("leavescreen", this);
            
            args.update && args.update.apply(this, [now, delta]);
        }
        
        /**
         * Clears the sprite from the screen
         */
        me.clear = function(now, delta) {
            engine.ctx.save();
            
            engine.ctx.translate(this.getX()+this.origin_x, this.getY()+this.origin_y);
            engine.ctx.rotate(this.getTheta());
            
            engine.ctx.clearRect(
                this.origin_x,
                this.origin_y,
                this.size.w,
                this.size.h
            )
            
            engine.ctx.restore();
        }
        
        /**
         * Draws the sprite
         */
        me.draw = function(now, delta) {
            
            if(me.state !== "") {
                var state = me.states[me.state];
                state.loop = isdef(state.loop) ? state.loop : true;
                
                var weight_sum = 0,
                    weights = [];
                for(var f in state.frames) {
                    var frame = state.frames[f];
                    var weight = frame.weight || 1;
                    weight_sum += weight;
                    weights.push(weight);
                }
                
                var current_pos = Math.round(me.anim_time / (state.length/1000) * weight_sum + 0.5);
                var current_frame;
                for(var w in weights) {
                    var weight = weights[w];
                    current_pos -= weight;
                    if(current_pos <= 0) {
                        current_frame = w;
                        break;
                    }
                }
                
                if(state.loop) {
                    me.anim_time += delta;
                    me.anim_time %= state.length/1000;
                } else {
                    if(me.anim_time < state.length/1000-1) {
                        me.anim_time += delta;
                    } else {
                        me.anim_time = state.length/1000-1;
                    }
                }
            }
            
            engine.ctx.save();
            
            engine.ctx.translate(this.getX()+this.origin_x, this.getY()+this.origin_y);
            engine.ctx.rotate(this.getTheta());
            
            if(this.img) {
                if(me.state == "") {
                    engine.ctx.drawImage(
                        this.img,
                        this.origin_x,
                        this.origin_y,
                        this.size.w,
                        this.size.h
                    );
                } else {
                    engine.ctx.drawImage(
                        this.img,
                        this.states[this.state].frames[current_frame].x,
                        this.states[this.state].frames[current_frame].y,
                        this.size.w,
                        this.size.h,
                        this.origin_x,
                        this.origin_y,
                        this.size.w,
                        this.size.h
                    );
                }
            } else if(this.fill) {
                engine.ctx.fillStyle = this.fill;
                engine.ctx.fillRect(
                    this.origin_x,
                    this.origin_y,
                    this.size.w,
                    this.size.h
                )
            }
            
            engine.ctx.restore();
            
            args.draw && args.draw.apply(this, [now, delta]);
        }
        
        /**
         * Adds the named force to this object's list of active forces
         */
        me.addForce = function(name, force) {
            if(me.phys.forces[name]) return;
            me.phys.forces[name] = force;
        }
        
        /**
         * Adds the named impulse to this object's list of active forces - the
         * impulse is like a force, but is only applied for one iteration before
         * being removed
         */
        me.addImpulse = function(name, force) {
            me.phys.forces[name] = force;
            me.phys.iforces.push(name);
        }
        
        /**
         * Removes the named force from the list of active forces
         */
        me.removeForce = function(name) {
            delete me.phys.forces[name];
        }
        
        /**
         * Get the sum of all currently active forces
         */
        me.getForceSum = function() {
            var sum = new Vector();
            for(var f in me.phys.forces) {
                sum.x += me.phys.forces[f].x;
                sum.y += me.phys.forces[f].y;
            }
            return sum;
        }
        
        /**
         * Adds the named moment to this object's list of active moments
         */
        me.addMoment = function(name, moment) {
            if(me.phys.moments[name]) return;
            me.phys.moments[name] = moment;
        }
        
        /**
         * Adds the named moment impulse to this object's list of active moments
         */
        me.addMImpulse = function(name, moment) {
            me.phys.moments[name] = moment;
            me.phys.imoments.push(name);
        }
        
        /**
         * Removes the named moment from the list of active forces
         */
        me.removeMoment = function(name) {
            delete me.phys.moments[name];
        }
        
        /* Adds an event listener that will only be called if this Sprite was
         * the context (first argument passed with the event).
         */
        me.listen = function(event, callback) {
            engine.listen(event, function(context) {
                if(context == me) callback.apply(me);
            });
        }
        
        /**
         * Tests if the player is onscreen
         */
        me.onScreen = function() {
            engine.phys.hitTextBoxOnBox(me.getRect(), {
                x: 0,
                y: 0,
                w: engine.getW(),
                h: engine.getH()
            });
        }
        
        /* ===================================================================== Getters + Setters */
        me.getRect = function() {
            return {
                x: me.etX(),
                y: me.etY(),
                w: me.etW(),
                h: me.etH()
            }
        }
        
        me.getCenter = function() {
            return {
                x: me.etX() + me.etW()/2,
                y: me.etY() + me.etH()/2
            }
        }
        
        me.etState = function(state) {
            isdef(state) && (this.state = state);
            return this.state;
        }
        me.getState = me.setState = me.etState;
        
        me.etW = function(w) {
            isdef(w) && (this.size.w = w);
            return this.size.w;
        }
        me.getW = me.setW = me.etW;
        
        me.etH = function(h) {
            isdef(h) && (this.size.h = h);
            return this.size.h;
        }
        me.getH = me.setH = me.etH;
        
        me.etX = function(x) {
            isdef(x) && (this.phys.pos.x = x);
            return this.phys.pos.x;
        }
        me.getX = me.setX = me.etX;
        
        me.etY = function(y) {
            isdef(y) && (this.phys.pos.y = y);
            return this.phys.pos.y;
        }
        me.getY = me.setY = me.etY;
        
        me.etTheta = function(t) {
            isdef(t) && (this.phys.theta = t);
            return this.phys.theta;
        }
        me.setTheta = me.getTheta = me.etTheta;
        
        me.etVx = function(vx) {
            isdef(vx) && (this.phys.vel.x = vx);
            return this.phys.vel.x;
        }
        me.setVx = me.getVx = me.etVx;
        
        me.etVy = function(vy) {
            isdef(vy) && (this.phys.vel.y = vy);
            return this.phys.vel.y;
        }
        me.getVy = me.setVy = me.etVy;
        
        me.etOmega = function(o) {
            isdef(o) && (this.phys.omega = o);
            return this.phys.omega;
        }
        me.getOmega = me.setOmega = me.etOmega;
        
        me.etMass = function(m) {
            isdef(m) && (this.phys.mass = m);
            return this.phys.mass;
        }
        me.setMass = me.getMass = me.etMass;
        
        me.etInertia = function(i) {
            isdef(i) && (this.phys.inertia = i);
            return this.phys.inertia;
        }
        me.setInertia = me.getInertia = me.etInertia;
        
        
        engine.sprites.push(me);
        
        
        return me;
        
    }
    me.Sprite = Sprite;
    
    
    /* An immutable 2D vector class - the basis of everything cool */
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
    
    
    /* A Physics State class - Fully describes the physical propertis of some 2D
     * object. Has a position and velocity, angle and angular velocity, mass and
     * intertia as well as a list of all forces (named Vectors) and moments
     * (named floats) currently acting on the object.
     * on it
     */
    var State = function() {
        var me = {};
        
        // Integrable properties
        me.pos = new Vector();
        me.vel = new Vector();
        me.theta = 0;
        me.omega = 0;
        
        me.mass = 0;
        me.inertia = 0;
        me.forces = {};
        me.iforces = [];
        me.moments = {};
        me.imoments = [];
        
        return me;
    }
    me.State = State;
    
    
    /* The derivative of a State object */
    var Derivative = function() {
        var me = {};
        
        me.dpos = new Vector();
        me.dvel = new Vector();
        me.dtheta = 0;
        me.domega = 0;
        
        return me;
    }
    me.Derivative = Derivative;
    
    
    /* An object that handles integrating physics of objects on the screen and
     * doing collision detection
     */
    var PhysicsIntegrator = function(engine) {
        var me = {};
        
        // A collection of Sprites to be self-collided
        me.colliders = [];
        
        // Adds a sprite to be collided
        me.addCollider = function(sprite) {
            if(me.colliders.indexOf(sprite)!=-1) return;
            me.colliders.push(sprite);
        }
        
        me.hitTestCircleOnCircle = function(c1, c2) {
            var maxdist = c1.r + c2.r;
            
            var dx = Math.abs(c1.x-c2.x);
            if(dx > maxdist) return false;
            
            var dy = Math.abs(c1.y-c2.y);
            if(dy > maxdist) return false;
            
            var dist = Math.sqrt(dx*dx + dy*dy);
            if(dist > maxdist) return false;
            
            return true;
        }
        
        // Hit tests two boxes (objects with properties x,y,w,h)
        me.hitTestBoxOnBox = function(rect1, rect2) {
            var hitx = me.horizHitTestBoxOnBox(rect1, rect2);
            if(!hitx) return false;
            
            var hity = me.vertHitTestBoxOnBox(rect1, rect2);
            if(!hity) return false;
            
            return true;
        }
        
        // Horizontally hit tests two boxes
        me.horizHitTestBoxOnBox = function(rect1, rect2) {
            var dx = Math.abs(rect2.x-rect1.x);
            if(rect1.x < rect2.x) {
                if(dx < rect1.w) return true;
            } else {
                if(dx < rect2.w) return true;
            }
            return false;
        }
        
        // Vertically hit tests two boxes
        me.vertHitTestBoxOnBox = function(rect1, rect2) {
            var dy = Math.abs(rect2.y-rect1.y);
            if(rect1.y < rect2.y) {
                if(dy < rect1.h) return true;
            } else {
                if(dy < rect2.h) return true;
            }
            return false;
        }
        
        me.collide = function(delta) {
            for(var i=0; i<me.colliders.length; i++) {
                var s1 = me.colliders[i];
                for(var j=i; j<me.colliders.length; j++) {
                    var s2 = me.colliders[j];
                    if(s2 == s1) continue;
                    
                    // Bounding-box hitest the two sprites
                    if(me.hitTestBoxOnBox(s1.getDrawRect(), s2.getDrawRect())) {
                        var norm = s2.getDrawCenter().sub(s1.getDrawCenter());
                        engine.trigger("spritecollide", [s1, s2, norm, delta]);
                    } else {
                        continue;
                    }
                }
            }
        }
        
        
        /* Accelerates the given state in some characteristic manner fully
         * described by the list of forces acting on the state (state.forces)
         */
        var accelerate = function(state, dt, t) {
            // Do something to state using t
            var acc = new Vector();
            
            // Mass = 0 indicates an infinitely large object
		    if(state.mass == 0) return acc;
            
		    // Add up the forces and divide by mass to get acceleration (F=ma)
		    for(var f in state.forces) {
		        acc.x += state.forces[f].x;
		        acc.y += state.forces[f].y;
		    }
		    acc.x /= state.mass;
		    acc.y /= state.mass;
		    
		    acc.x *= dt;
		    acc.y *= dt;
		
            return acc;
        }
        
        /* Angularly accelerates the given state in some characteristic manner
         * fully described by the list of moments acting on the state
         * (state.moments)
         */
        var angaccelerate = function(state, dt, t) {
            // Do something to state using t
            var alpha = 0;
            
            // Inertia = 0 indicates an inert object
            if(state.intertia == 0) return alpha;
            
            // Add up the moments and divide by I to get alpha (M=Ia)
            for(var m in state.moments) {
                alpha += state.moments[m];
            }
            alpha /= state.inertia;
            
		    alpha.y *= dt;
            
            return alpha;
        }
        
        /* Evaluate the given initial conditions to resolve an output state */
        var evaluate = function(initial, t, dt, derivative) {
        	var state = new State();
            state.pos.x = initial.pos.x + derivative.dpos.x*dt;
            state.pos.y = initial.pos.y + derivative.dpos.y*dt;
            state.vel.x = initial.vel.x + derivative.dvel.x*dt;
            state.vel.y = initial.vel.y + derivative.dvel.y*dt;
            state.theta = initial.theta + derivative.dtheta*dt;
            state.omega = initial.omega + derivative.domega*dt;
            
            state.mass = initial.mass;
            state.inertia = initial.inertia;
            state.forces = initial.forces;
            state.iforces = initial.iforces;
            state.moments = initial.moments;
            state.imoments = initial.imoments;
            
            var output = new Derivative();
            output.dpos.x = state.vel.x;
            output.dpos.y = state.vel.y;
            output.dtheta = state.omega;
            output.dvel = accelerate(state, dt, t+dt);
            output.domega = angaccelerate(state, dt, t+dt);
            
            return output;
        }
        
        /* Integrate the given state over [t, t+dt] */
        me.integrate = function(state, t, dt) {
            if(dt == 0) return;
            
            var a = evaluate(state, t, 0.0, new Derivative());
            var b = evaluate(state, t+dt*0.5, dt*0.5, a);
            var c = evaluate(state, t+dt*0.5, dt*0.5, b);
            var d = evaluate(state, t+dt, dt, c);
            
            var dxdt = 1.0/6.0 * (a.dpos.x + 2.0*(b.dpos.x + c.dpos.x) + d.dpos.x);
            var dydt = 1.0/6.0 * (a.dpos.y + 2.0*(b.dpos.y + c.dpos.y) + d.dpos.y);
            var dvxdt = 1.0/6.0 * (a.dvel.x + 2.0*(b.dvel.x + c.dvel.x) + d.dvel.x);
            var dvydt = 1.0/6.0 * (a.dvel.y + 2.0*(b.dvel.y + c.dvel.y) + d.dvel.y);
            var dthetadt = 1.0/6.0 * (a.dtheta + 2.0*(b.dtheta + c.dtheta) + d.dtheta);
            var domegadt = 1.0/6.0 * (a.domega + 2.0*(b.domega + c.domega) + d.domega);
            
            state.pos.x += dxdt * dt;
            state.pos.y += dydt * dt;
            state.vel.x += dvxdt * dt;
            state.vel.y += dvydt * dt;
            state.theta += dthetadt * dt;
            state.omega += domegadt * dt;
            
            for(var f in state.iforces) {
		        delete state.forces[state.iforces[f]];
            }
            state.iforces = [];
            for(var m in state.imoments) {
		        delete state.moments[state.imoments[m]];
            }
            state.imoments = [];
        }
        
        return me;
    }
    me.PhysicsIntegrator = PhysicsIntegrator;
    
    
    return me;
    
})(jsge);







