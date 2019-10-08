const express = require('express');
const app = express();
const serv = require('http').Server(app);

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
var lastMove = "";
var lastWon = false;
var lastTurn;

function checkIfBordering(bigCell, bigboard){
    for(var i = 0; i < bigboard.boards.length; i++){
        if(bigboard.boards[i].legal.includes(bigCell)){
            return true;
        }
    }
    return false;
}

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    socket.emit('init', {
        board: table
    });

    socket.on('newMove', (data) => {
        if(lastTurn === socket){
            socket.emit("twice");
            return;
        }
        lastTurn = socket;
        var bigCell = parseInt(data.cellNum.split("")[0]);
        var cell = parseInt(data.cellNum.split("")[1]);
        var bordering = false;

        if(table.smallCell != -1 && table.smallCell != bigCell && !checkIfBordering(bigCell, table)){
            socket.emit("illegal");
            return;
        }

        table.smallCell = cell;

        lastMove = data.cellNum;
        lastWon = false;

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
                h: table.table.sepDist * 2
            });
        }

        table.boards[bigCell].cells[cell] = turn;

        for(var i = 0; i < table.boards.length; i++){
            var b = table.boards[i].cells;
            if(table.boards[i].won === 'none' && ((b[0] === b[1] && b[1] === b[2] && b[0] != 'none') || (b[3] === b[4] && b[4] === b[5] && b[3] != 'none') || (b[6] === b[7] && b[7] === b[8] && b[6] != 'none') || (b[0] === b[3] && b[3] === b[6] && b[0] != 'none') || (b[1] === b[4] && b[4] === b[7] && b[1] != 'none') || (b[2] === b[5] && b[5] === b[8] && b[2] != 'none') || (b[0] === b[4] && b[4] === b[8] && b[0] != 'none') || (b[2] === b[4] && b[4] === b[6] && b[2] != 'none'))){
                table.boards[i].won = turn;
                lastWon = true;
                switch(i){
                    case 0:
                        table.boards[i].legal = [1, 3, 4];
                        break;
                    case 1:
                        table.boards[i].legal = [0, 2, 3, 4, 5];
                        break;
                    case 2:
                        table.boards[i].legal = [1, 4, 5];
                        break;
                    case 3:
                        table.boards[i].legal = [0, 1, 3, 6, 7];
                        break;
                    case 4:
                        table.boards[i].legal = [0, 1, 2, 3, 5, 6, 7, 8];
                        break;
                    case 5:
                        table.boards[i].legal = [1, 2, 4, 7, 8];
                        break;
                    case 6:
                        table.boards[i].legal = [3, 4, 7];
                        break;
                    case 7:
                        table.boards[i].legal = [3, 4, 5, 6, 8];
                        break;
                    case 8:
                        table.boards[i].legal = [4, 5, 7];
                        break;
                }
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
                board: table
            });
        }

        turn = "square";
    });

    socket.on('undo', function(){
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
        turn = (turn === "square") ? "circle" : "square";
    });

    socket.on('disconnect', () => {
        delete SOCKET_LIST[socket.id];
    });

    console.log("Socket connection");
});
