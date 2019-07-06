//ES 6 feature - import
import { moveUp, moveDown, moveLeft, moveRight } from "./main.js"

//crucial
$( document ).ready(function() {
    $(".key_arrow1").click(function(e) {
        console.log("Clicked a button 1");
    });
    $(".key_arrow2").click(function(e) {
        console.log("Clicked a button 2");
        moveUp()
    });
    $(".key_arrow3").click(function(e) {
        console.log("Clicked a button 3");
    });
    $(".key_arrow4").click(function(e) {
        console.log("Clicked a button 4");
        moveLeft()
    });
    $(".key_arrow5").click(function(e) {
        console.log("Clicked a button 5");
    });
    $(".key_arrow6").click(function(e) {
        console.log("Clicked a button 6");
        moveRight()
    });
    $(".key_arrow7").click(function(e) {
        console.log("Clicked a button 7");
    });
    $(".key_arrow8").click(function(e) {
        console.log("Clicked a button 8");
        moveDown()
    });
    $(".key_arrow9").click(function(e) {
        console.log("Clicked a button 9");
    });
 });