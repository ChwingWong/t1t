'use strict';
/*
Copyright 2014 Ralph Thomas

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import Friction from './friction';
import Spring from './spring';
/***
 * Scroll combines Friction and Spring to provide the
 * classic "flick-with-bounce" behavior.
 */
export class Scroll {
    constructor(extent) {
        this._extent = extent;
        this._friction = new Friction(0.01);
        this._spring = new Spring(1, 90, 20);
        this._startTime = 0;
        this._springing = false;
        this._springOffset = 0;
    }
    set(x, v) {
        this._friction.set(x, v);
        // If we're over the extent or zero then start springing. Notice that we also consult
        // velocity because we don't want flicks that start in the overscroll to get consumed
        // by the spring.
        if (x > 0 && v >= 0) {
            this._springOffset = 0;
            this._springing = true;
            this._spring.snap(x);
            this._spring.setEnd(0);
        } else if (x < -this._extent && v <= 0) {
            this._springOffset = 0;
            this._springing = true;
            this._spring.snap(x);
            this._spring.setEnd(-this._extent);
        } else {
            this._springing = false;
        }
        this._startTime = (new Date()).getTime();
    }
    x(t) {
        if (!this._startTime)
            return 0;
        if (!t)
            t = ((new Date()).getTime() - this._startTime) / 1000.0;
        // We've entered the spring, use the value from there.
        if (this._springing)
            return this._spring.x() + this._springOffset;
        // We're still in friction.
        var x = this._friction.x(t);
        var dx = this.dx(t);
        // If we've gone over the edge the roll the momentum into the spring.
        if ((x > 0 && dx >= 0) || (x < -this._extent && dx <= 0)) {
            this._springing = true;
            this._spring.setEnd(0, dx);
            if (x < -this._extent)
                this._springOffset = -this._extent;
            else
                this._springOffset = 0;
            x = this._spring.x() + this._springOffset;
        }
        return x;
    }
    dx(t) {
        // if (this._springing)
        //     return this._spring.dx(t);
        // return this._friction.dx(t);
        var dx = 0;

        if (this._lastTime === t) {
            dx = this._lastDx;
        } else if (this._springing) {
            dx = this._spring.dx(t);
        } else {
            dx = this._friction.dx(t);
        }

        this._lastTime = t;
        this._lastDx = dx;
        return dx;
    }
    done() {
        if (this._springing)
            return this._spring.done();
        else
            return this._friction.done();
    }
    configuration() {
        var config = this._friction.configuration();
        config.push.apply(config, this._spring.configuration());
        return config;
    }
}