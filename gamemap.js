//ES 6 all the way! no more Prototype, yay!
//this can be traced back to coding.cookies tutorial, part 3a
class GameMap {
    constructor(tiles) {
      this._tiles = tiles;
      this._width = tiles.length;
      this._height = tiles[0].length;
    }
  
    getWidth = () => this._width;
    getHeight = () => this._height;
  
    getTile = (x, y) => {
      if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
        return -1;
      } else {
        return this._tiles[x][y];
      }
    };

    isOpaque(x, y) {
      return this._tiles[x][y] == 0;
    };
    isBlocked(x, y){
      return this._tiles[x][y] == 0;
    };
    isStairs(x, y){
      return this._tiles[x][y] == 2;
    };
}

export { GameMap }