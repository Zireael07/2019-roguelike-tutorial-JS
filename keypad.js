//ES 6 feature - import
import { movePlayer, loadGame, saveGame } from "./main.js"

//crucial
$( document ).ready(function() {
    $(".key_arrow1").click(function(e) {
        //console.log("Clicked a button 1");
        movePlayer(-1,-1);
    });
    $(".key_arrow2").click(function(e) {
        //console.log("Clicked a button 2");
        movePlayer(0, -1);
    });
    $(".key_arrow3").click(function(e) {
        //console.log("Clicked a button 3");
        movePlayer(1,-1);
    });
    $(".key_arrow4").click(function(e) {
        //console.log("Clicked a button 4");
        movePlayer(-1, 0);
    });
    $(".key_arrow5").click(function(e) {
        console.log("Clicked a button 5");
    });
    $(".key_arrow6").click(function(e) {
        //console.log("Clicked a button 6");
        movePlayer(1,0);
    });
    $(".key_arrow7").click(function(e) {
        //console.log("Clicked a button 7");
        movePlayer(-1,1);
    });
    $(".key_arrow8").click(function(e) {
        //console.log("Clicked a button 8");
        movePlayer(0,1);
    });
    $(".key_arrow9").click(function(e) {
        //console.log("Clicked a button 9");
        movePlayer(1,1);
    });
    $(".key_save").click(function(e){
        saveGame();
    });
    $(".key_load").click(function(e){
        console.log("Clicked load...");
        loadGame();
    });
 });
