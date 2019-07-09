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
    constructor(){}
}

export {Entity, Creature}