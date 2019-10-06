const board = require("./board");
const rectangle = require("./rectangle");

module.exports = class{
    constructor(table){
        this.table = table;
        this.boards = [];
        this.rectangles = [];
        this.sepDist = this.table.sepDist * 2;

        for(var i = 0; i < 9; i++){
            var boardx = i % 3;
            var boardy;
            if(i < 3) boardy = 0;
            else if(i < 6) boardy = 1;
            else boardy = 2;

            this.boards.push(new board(table.x + table.w * boardx + this.sepDist * boardx, table.y + table.h * boardy + this.sepDist * boardy, table.w, table.h, table.sepDist));
        }

        var width = table.w * 3 + this.sepDist * 2;
        var height = table.h * 3 + this.sepDist * 2;

        var tableWidth = (table.w - (table.sepDist * 2)) / 3;
        var tableHeight = (table.h - (table.sepDist * 2)) / 3;

        this.rectangles.push(new rectangle(table.x + table.w, table.y, this.sepDist, height));
        this.rectangles.push(new rectangle(table.x + table.w * 2 + this.sepDist, table.y, this.sepDist, height));
        this.rectangles.push(new rectangle(table.x, table.y + table.h, width, this.sepDist));
        this.rectangles.push(new rectangle(table.x, table.y + table.h * 2 + this.sepDist, width, this.sepDist));

        var more = 0;
        for(var i = 0; i < 6; i++){
            this.rectangles.push(new rectangle(more + table.x + tableWidth * (i + 1) + table.sepDist * i, table.y, table.sepDist, height));
            if((i + 1) % 2 === 0){
                more += this.sepDist + tableWidth;
            }
        }

        more = 0;
        for(var i = 0; i < 6; i++){
            this.rectangles.push(new rectangle(table.x, more + table.y + tableHeight * (i + 1) + table.sepDist * i, width, table.sepDist));
            if((i + 1) % 2 === 0){
                more += this.sepDist + tableHeight;
            }
        }
    }
}
