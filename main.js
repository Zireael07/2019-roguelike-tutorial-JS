import { GameMap } from "./gamemap.js"

import { createFOV } from "./fov.js";
import { tintImage } from "./tint_image.js";

var player = {
    _x: 1,
    _y: 1,

    move: function(dx,dy, map) {
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
    }
}

var Game = {
    canvas: null,
    context: null,
    player: null,
    _map: null,
    visible: null,
    seen: null,
    rng: null,

    newGame: function(cnv) {
        this.canvas = cnv;
        this.context = cnv.getContext("2d");
        this.player = player;
        this.rng = aleaPRNG();
        this.visible = new Set();
        this.seen = new Set();
    },
    setupFOV: function() {
        this.refreshFOV = createFOV(
            this._map._width,
            this._map._height,
            (x, y) => this.revealTile(x, y),
            (x, y) => this._map.isOpaque(x, y)
          );
        
        this.refreshVisibility();
    },
    refreshVisibility: function() {
        this.visible.clear();
        this.refreshFOV(this.player._x, this.player._y, 4);
    },

    generateMap: function() {
        let map = [];
        for (let x = 0; x < 20; x++) {
          map.push([]);
          for (let y = 0; y < 20; y++) {
            map[x].push(1); //floor
          }
        }

        //walls around the map
        for (let x =0; x < 20; x++){
            map[x][0] = 0;
            map[x][19] = 0;
        }

        for (let y = 0; y < 20; y++){
            map[0][y] = 0;
            map[19][y] = 0;
        }

        this._map = new GameMap(map);
    },
    //FOV
    isVisible: function(x, y) {
        return this.visible.has(`${x},${y}`);
    },
    isSeen(x, y) {
        return this.seen.has(`${x},${y}`);
    },
    revealTile: function(x, y) {
        const id = `${x},${y}`;
        this.visible.add(id);
        this.seen.add(id);
    },

    //rendering functions from here down
    clearGame: function() {
        this.context.fillStyle = 'rgb(0,0,0)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    isoPos: function(x,y) {
        // those values work for Gervais isometric tiles
        let HALF_TILE_HEIGHT = 16
        let HALF_TILE_WIDTH = 32
        let offset_x = 80
        let tile_x = (x - y) * HALF_TILE_WIDTH + offset_x
        let tile_y = (x + y) * HALF_TILE_HEIGHT
  
        return [tile_x,tile_y];
    },
    drawMapTile: function(x,y, tile){
        if (tile == 0){
            this.renderGfxTile(resources.get("gfx/wall_stone.png"), x, y);
        }
        else{
            this.renderGfxTile(resources.get("gfx/floor_cave.png"), x, y);
        }
    },
    drawMapTileTint: function(x,y, tile){
        if (tile == 0){
            Game.context.drawImage(tintImage(resources.get("gfx/wall_stone.png"), "wall_stone_gray", 'rgb(127, 127,127)', 0.5), x, y);
        }
        else{
            Game.context.drawImage(tintImage(resources.get("gfx/floor_cave.png"), "floor_cave_gray", 'rgb(127, 127, 127)', 0.5), x, y);
        }
    },
    renderMap: function(map){
    for (let x =0; x < map._width; x++){
        for (let y=0; y < map._height; y++){
            let iso = this.isoPos(x,y);
            if (Game.isVisible(x,y)){
                this.drawMapTile(iso[0], iso[1], map._tiles[x][y]);
            }
            else if (Game.isSeen(x,y)){
                this.drawMapTileTint(iso[0], iso[1], map._tiles[x][y]);
            }
        }
    }
    },
    renderPlayer: function(){
        let iso = this.isoPos(this.player._x, this.player._y);
        // entities need a slight offset to be placed more or less centrally
        this.renderGfxTile(resources.get("gfx/human_m.png"), iso[0]+8, iso[1]+8);
    },
    renderGfxTile: function(img, x, y) {
        this.context.drawImage(img, x, y);
    }
}

// main key input handler
// key is the key code
function processKeyDown(key){
    switch (key) {
      case 37: moveLeft(); break;  //left
      case 39: moveRight();  break;   //right
      case 38: moveUp(); break;     //up
      case 40: moveDown();  break;    //down
      default: console.log(key);
    }
}

// stubs called by jQuery onclick()
// ES 6 feature - export!
// they are also used by key input
export function moveUp() {
    if (Game.player.move(0, -1, Game._map)){
        Game.refreshVisibility();
    }

}

export function moveDown() {
    if (Game.player.move(0, 1, Game._map)){
        Game.refreshVisibility();
    }
}

export function moveLeft() {
    if (Game.player.move(-1, 0, Game._map)){
        Game.refreshVisibility();
    }
}

export function moveRight() {
    if (Game.player.move(1, 0, Game._map)){
        Game.refreshVisibility();
    }
}

function setup(canvas) {
    console.log("setup...");
    //setup game
    Game.newGame(canvas);
    Game.generateMap();
    //uses map dimensions so has to come after
    Game.setupFOV();

    //what it says on the tin
    function mainLoop() {
        //test
        Game.clearGame();
        Game.renderMap(Game._map);
        Game.renderPlayer();
        requestAnimationFrame(mainLoop);
    }
    
    //crucial! not part of main loop!
    requestAnimationFrame(mainLoop);


}


window.onload = function() {
    //get canvas
    var canvas = document.getElementById("canvas-game");
    canvas.width = 800
    canvas.height = 600

    //load assets
    resources.load([
        "gfx/human_m.png",
        "gfx/wall_stone.png",
        "gfx/floor_cave.png",
    ]);
    resources.setReady(setup, canvas);

    //keys
    function onKeyDown(event) {
        // prevent scrolling on arrow keys
        event.preventDefault();
        processKeyDown(event.keyCode, Game.player);
    }

    window.addEventListener("keydown", onKeyDown)



}