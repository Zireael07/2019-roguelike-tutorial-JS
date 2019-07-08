class Entity{
    constructor(x,y){
        this._x = x;
        this._y = y;
        //console.log("Created entity @ " + x + " " + y);
    }

    move(dx,dy, map){
        var tx = this._x + dx
        var ty = this._y + dy
        
        if (tx < 0 || ty < 0){
            return false;
        }
        if (tx > map._width || ty > map._height){
            return false;
        }
    
        if (map._tiles[tx][ty] == 0){
            return false;
        }

        this._x = this._x + dx;
        this._y = this._y + dy;
        return true;
    };
}

export {Entity}