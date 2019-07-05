var Game = {
    canvas: null,
    context: null,

    newGame: function(cnv) {
        this.canvas = cnv;
        this.context = cnv.getContext("2d");
    },
    clearGame: function() {
        this.context.fillStyle = 'rgb(0,0,0)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}



window.onload = function() {
    //get canvas
    var canvas = document.getElementById("canvas-game");
    canvas.width = 800
    canvas.height = 600

    //setup game
    Game.newGame(canvas);
    //test
    Game.clearGame();
}