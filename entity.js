class Entity{
    constructor(x,y, name){
        this._x = x;
        this._y = y;
        this.name = name
        //console.log("Created entity @ " + x + " " + y);
        //optional components
        this.creature = null;
    }
    get_creatures_at(entities, x, y){
        //for...in statement iterates over user-defined properties in addition to the array elements
        for (let index = 0; index < entities.length; index++) {
            const entity = entities[index];
            if (entity.creature != null && entity._x == x && entity._y == y){
                return entity;
                }
            }
            return null;
    };
    move(dx,dy, map, entities){
        var tx = this._x + dx
        var ty = this._y + dy
        
        if (tx < 0 || ty < 0){
            return false;
        }
        if (tx > map._width || ty > map._height){
            return false;
        }
    
        //is it a wall?
        if (map._tiles[tx][ty] == 0){
            return false;
        }

        //check for creatures
        var target = this.get_creatures_at(entities, tx, ty);
        if (target != null){
            console.log("You kick " + target.name + " in the shins!");
            //no need to refresh FOV
            return false;
        }

        this._x = this._x + dx;
        this._y = this._y + dy;
        return true;
    };
}

class Creature{
    constructor(owner, hp, def, attack){
        this.owner = owner;
        this.hp = hp;
        this.max_hp = hp;
        this.defense = def;
        this.attack = attack;
    }
    move_towards(tx, ty, game_map, entities){
        var dx = tx - this.owner._x
        var dy = ty - this.owner._y
        //var distance = math.sqrt(dx ** 2 + dy ** 2)
        var distance = distance_to(this.owner._x, this.owner._y, tx, ty);

        dx = Math.round(dx / distance);
        dy = Math.round(dy / distance);
        //console.log ("dx " + dx + " dy: " + dy);

        if ((!game_map.isBlocked(this.owner._x + dx, this.owner._y + dy)) || (get_creatures_at(entities, this.owner._x + dx, this.owner._y + dy))){
            console.log("We can move to " + (this.owner._x + dx) + " " + (this.owner._y + dy));
            return this.owner.move(dx, dy, game_map, entities);
        }
    }
}

class AI{
    constructor(owner){
        this.owner = owner;
    }
    take_turn(target, game_map, visible, entities){ 
        console.log("The " + this.owner.name + " wonders when it will get to move");
        var monster = this.owner
        // assume if we can see it, it can see us too
        if (visible.has(`${monster._x},${monster._y}`)){  
            if (distance_to(monster._x, monster._y, target._x, target._y) >= 2){
                monster.creature.move_towards(target._x, target._y, game_map, entities);
            }
            else if (target.creature.hp > 0){
                console.log(this.owner.name + " insults you!");
            }
        }
    };
}

function distance_to(sx,sy, tx, ty){
    let dx = tx - sx;
    let dy = ty - sy;
    return (Math.sqrt(dx ** 2 + dy ** 2));
}


export {Entity, Creature, AI}