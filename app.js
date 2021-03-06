const express = require('express');
const app = express();
const serv = require('http').Server(app);
const fs  = require('fs');

const board = require('./server/board');
const bigboard = require('./server/bigboard');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');

});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Listening...");

var SOCKET_LIST = {};
var table = new bigboard(new board(0, 0, 150, 150, 10));
var turn = "square";
var lastGo = "square";
var lastMove = "";
var lastWon = false;
var lastLegal = -1;
var lastTurn = null;
var lastLastTurn = null;
var lastSmallCell = -1;

var chatText = "";

function checkIfBordering(bigCell, bigboard){
    var bordering = [];
    for(var i = 0; i < bigboard.boards.length; i++){
        if(bigboard.boards[i].legal.includes(bigCell)){
            bordering.push(i);
        }
    }
    return bordering;
}

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    socket.emit('init', {
        board: table,
        chatText: chatText
    });

    socket.on("joined", (data) => {
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit("join", {
                message: data.user + "</b> has joined the server</i>",
                name: data.user
            });
        }
        chatText = "<i><b class='notYou'>" + data.user + "</b> has joined the server</i><br><br>" + chatText;
        SOCKET_LIST[socket.id].name = data.user;
    });

    socket.on('newMove', (data) => {
        if(lastTurn === socket){
            socket.emit("twice");
            return;
        }
        var bigCell = parseInt(data.cellNum.split("")[0]);
        var cell = parseInt(data.cellNum.split("")[1]);

        if(table.smallCell != -1 && table.smallCell != bigCell && !checkIfBordering(bigCell, table).includes(table.smallCell)){
            socket.emit("illegal");
            return;
        }
        else if(table.boards[bigCell].won != "none"){
            socket.emit('illegal');
            return;
        }

        lastLastTurn = lastTurn;
        lastTurn = socket;

        lastSmallCell = table.smallCell;
        table.smallCell = cell;

        lastMove = data.cellNum;
        lastWon = false;
        lastLegal = -1;

        var bigX = table.boards[bigCell].x;
        var bigY = table.boards[bigCell].y;

        var cellX = cell % 3;
        var cellY;
        if(cell < 3){
            cellY = 0;
        }
        else if(cell < 6){
            cellY = 1;
        }
        else{
            cellY = 2;
        }

        var tableWidth = (table.table.w - (table.table.sepDist * 2)) / 3;
        var tableHeight = (table.table.h - (table.table.sepDist * 2)) / 3;

        var x = (tableWidth * cellX) + (table.table.sepDist * cellX) + bigX + (tableWidth / 2) - ((turn === "square") ? table.table.sepDist : 0);
        var y = (tableHeight * cellY) + (table.table.sepDist * cellY) + bigY + (tableHeight / 2) - ((turn === "square") ? table.table.sepDist : 0);

        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('turnTaken', {
                cellNum: data.cellNum,
                turn: turn,
                x: x,
                y: y,
                w: table.table.sepDist * 2,
                h: table.table.sepDist * 2,
                name: socket.name,
                board: bigCell,
                cell: cell
            });
        }

        chatText = "<i><b class='notYou'>" + socket.name + "</b> has placed a " + turn + " in Board " + bigCell + ", Cell " + cell + "</i><br><br>" + chatText;

        table.boards[bigCell].cells[cell] = turn;

        for(var i = 0; i < table.boards.length; i++){
            var b = table.boards[i].cells;
            if(table.boards[i].won === 'none' && ((b[0] === b[1] && b[1] === b[2] && b[0] != 'none') || (b[3] === b[4] && b[4] === b[5] && b[3] != 'none') || (b[6] === b[7] && b[7] === b[8] && b[6] != 'none') || (b[0] === b[3] && b[3] === b[6] && b[0] != 'none') || (b[1] === b[4] && b[4] === b[7] && b[1] != 'none') || (b[2] === b[5] && b[5] === b[8] && b[2] != 'none') || (b[0] === b[4] && b[4] === b[8] && b[0] != 'none') || (b[2] === b[4] && b[4] === b[6] && b[2] != 'none'))){
                table.boards[i].won = turn;
                lastWon = true;
                table.boards[i].legal = table.borders[i];

                for(var j = 0; j < table.boards.length; j++){
                    for(var k = 0; k < table.boards.length; k++){
                        for(var l = 0; l < table.boards[k].legal.length; l++){
                            if(!table.boards[j].legal.includes(table.boards[k].legal[l])){
                                table.boards[j].legal.push(table.boards[k].legal[l]);
                            }
                        }
                    }
                }

                lastLegal = i;
                for(var j in SOCKET_LIST){
                    SOCKET_LIST[j].emit('won', {
                        x: table.boards[i].x + table.table.w / 2 - ((turn === "square") ? table.table.w / 2: 0),
                        y: table.boards[i].y + table.table.h / 2 - ((turn === "square") ? table.table.h / 2: 0),
                        w: table.table.w,
                        h: table.table.h,
                        turn: turn
                    });
                }
                break;
            }
        }

        lastGo = turn;
        turn = (turn === "square") ? "circle" : "square";
    });

    socket.on('clear', () => {
        lastTurn = null;
        table.smallCell = -1;
        for(var i = 0; i < table.boards.length; i++){
            for(var j = 0; j < table.boards[i].cells.length; j++){
                table.boards[i].cells[j] = "none";
                table.boards[i].won = 'none';
                table.boards[i].legal = [];
            }
        }

        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('boardCleared', {
                board: table,
                name: socket.name
            });
        }

        chatText = "<i><b class='notYou'>" + socket.name + "</b> has cleared the board</i><br><br>" + chatText;

        turn = "square";
    });

    socket.on('undo', function(){
        lastTurn = lastLastTurn;
        table.smallCell = lastSmallCell;
        if(lastLegal != -1){
            table.boards[lastLegal].legal = [];
        }
        var n = lastMove.split("");
        var big = parseInt(n[0]);
        var small = parseInt(n[1]);
        table.boards[big].won = lastWon ? "none" : table.boards[big].won;
        table.boards[big].cells[small] = "none";
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('undid', {
                board: table
            });
        }
        turn = lastGo;
    });

    socket.on("chat", (data) => {
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit("chatReceived", {
                sender: data.user,
                message: data.message
            });
        }
        chatText = "<b class='notYou'>" + data.user + "</b>: " + data.message + "<br><br>" + chatText;
    });

    socket.on("clearChat", (data) => {
        var cleared, message;
        if(data.pwd === "the chat has been cleared"){
            cleared = true;
            chatText = "";
            message = data.name + "</b> has cleared the chat</i>";
        }
        else{
            cleared = false;
            message = data.name + "</b> has failed to clear the chat because they are an absolute idiot</i>";
        }
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit("chatCleared", {
                cleared: cleared,
                message: message,
                name: data.name
            });
        }
        chatText = "<i><b class='notYou'>" + message + "<br><br>" + chatText;
    });

    socket.on('disconnect', () => {
        var name = SOCKET_LIST[socket.id].name;
        delete SOCKET_LIST[socket.id];
        if(name && name != "null" && name != undefined && name != "undefined"){
            for(var i in SOCKET_LIST){
                SOCKET_LIST[i].emit("join", {
                    message: name + "</b> has left the server</i>",
                    name: name
                });
            }
        }
        if(name && name != "null" && name != undefined && name != "undefined"){
            chatText = "<i><b class='notYou'>" + name + "</b> has left the server</i><br><br>" + chatText;
        }
    });

    console.log("Socket connection");
});

var chatCleared = false;
setInterval(() => {
    time = new Date();
    if(time.getHours() == 11 && !chatCleared){
        chatCleared = true;
        chatText = "";
    }
    else if(time.getHours() != 11 && chatCleared){
        chatCleared = false;
    }
}, 1000);
