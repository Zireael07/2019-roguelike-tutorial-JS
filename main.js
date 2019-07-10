import { Entity, Creature, AI } from "./entity.js"

import { GameMap } from "./gamemap.js"

import { createFOV } from "./fov.js";
import { tintImage } from "./tint_image.js";

var player = new Entity(1, 1, "Player");
player.creature = new Creature(player, 20, 40, 30);

//simple enum for JS
//https://stackoverflow.com/a/44447975
const GameStates = Object.freeze({
    PLAYER_TURN:   Symbol(0),
    ENEMY_TURN:  Symbol(1),
});


var Game = {
    canvas: null,
    context: null,
    player: null,
    _map: null,
    visible: null,
    seen: null,
    rng: null,
    entities: [],
    game_state: null,

    newGame: function(cnv) {
        this.canvas = cnv;
        this.context = cnv.getContext("2d");
        this.player = player;
        this.rng = aleaPRNG();
        this.visible = new Set();
        this.seen = new Set();
        this.game_state = GameStates.PLAYER_TURN;
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
    placeEntities: function(map, max) {
        // Get a random number of monsters
        var num = this.rng.range(0, max);

        // taking a shortcut here: this map is rectangular so we can just place in rectangle
        for (let i = 0; i < num; i++){
            // Choose a random location in the map
            let x = this.rng.range(1, (map._height - 5))
            let y = this.rng.range(1, (map._width - 5))

            //console.log(x,y);
            let ent = new Entity(x,y, "kobold");
            ent.creature = new Creature(ent, 5, 20,30);
            ent.ai = new AI(ent);
            this.entities.push(ent);
        }

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
    renderEntities: function(entities){
        for (let i = 0; i < entities.length; i++){
            if (Game.isSeen(entities[i]._x, entities[i]._y)){
                let iso = this.isoPos(entities[i]._x, entities[i]._y);
                // entities need a slight offset to be placed more or less centrally
                this.renderGfxTile(resources.get("gfx/kobold.png"), iso[0]+8, iso[1]+8);
            }
        }
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
      // vim
      case 72: moveLeft(); break; // h
      case 76: moveRight(); break; // l
      case 74: moveDown(); break; // j
      case 75: moveUp(); break; // k
      // diagonals
      case 89: moveLeftUp(); break; // y
      case 85: moveRightUp(); break; // u
      case 66: moveLeftDown(); break; // b
      case 78: moveRightDown(); break; // n
      default: console.log(key);
    }
}

// stubs called by jQuery onclick()
// ES 6 feature - export!
// they are also used by key input
export function moveUp() {
    if (Game.game_state == GameStates.PLAYER_TURN && Game.player.move(0, -1, Game._map, Game.entities)){
        Game.refreshVisibility();
    }
    Game.game_state = GameStates.ENEMY_TURN;

}

export function moveDown() {
    if (Game.game_state == GameStates.PLAYER_TURN && Game.player.move(0, 1, Game._map, Game.entities)){
        Game.refreshVisibility();
    }
    Game.game_state = GameStates.ENEMY_TURN;
}

export function moveLeft() {
    if (Game.game_state == GameStates.PLAYER_TURN && Game.player.move(-1, 0, Game._map, Game.entities)){
        Game.refreshVisibility();
    }
    Game.game_state = GameStates.ENEMY_TURN;
}

export function moveRight() {
    if (Game.game_state == GameStates.PLAYER_TURN && Game.player.move(1, 0, Game._map, Game.entities)){
        Game.refreshVisibility();
    }
    Game.game_state = GameStates.ENEMY_TURN;
}

export function moveLeftUp() {
    if (Game.game_state == GameStates.PLAYER_TURN && Game.player.move(-1, -1, Game._map, Game.entities)){
        Game.refreshVisibility();
    }
    Game.game_state = GameStates.ENEMY_TURN;

}

export function moveRightUp() {
    if (Game.game_state == GameStates.PLAYER_TURN && Game.player.move(1, -1, Game._map, Game.entities)){
        Game.refreshVisibility();
    }
    Game.game_state = GameStates.ENEMY_TURN;

}

export function moveLeftDown() {
    if (Game.game_state == GameStates.PLAYER_TURN && Game.player.move(-1, -1, Game._map, Game.entities)){
        Game.refreshVisibility();
    }
    Game.game_state = GameStates.ENEMY_TURN;

}

export function moveRightDown() {
    if (Game.game_state == GameStates.PLAYER_TURN && Game.player.move(1, -1, Game._map, Game.entities)){
        Game.refreshVisibility();
    }
    Game.game_state = GameStates.ENEMY_TURN;

}

function setup(canvas) {
    console.log("setup...");
    //setup game
    Game.newGame(canvas);
    Game.generateMap();
    Game.placeEntities(Game._map, 3);
    //uses map dimensions so has to come after
    Game.setupFOV();

    //what it says on the tin
    function mainLoop() {
        Game.clearGame();
        Game.renderMap(Game._map);
        Game.renderPlayer();
        Game.renderEntities(Game.entities);
        // AI turn
        if (Game.game_state == GameStates.ENEMY_TURN){
            //for (entity in game.entities:
            for (let index = 0; index < Game.entities.length; index++) {
                const entity = Game.entities[index];
                if (entity.ai != null){
                    //console.log("The " + entity.creature.name + " ponders the meaning of its existence.");
                    entity.ai.take_turn(Game.player, Game._map, Game.visible, Game.entities);
                }
            }
            Game.game_state = GameStates.PLAYER_TURN;
        }

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
        "gfx/kobold.png",
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