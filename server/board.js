const rectangle = require('./rectangle');

module.exports = class{
    constructor(x, y, w, h, sepDist){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.sepDist = sepDist;

        this.buttons = [];
        this.rectangles = [];
        this.cells = [];
        for(var i = 0; i < 9; i++){
            this.cells.push("none");
        }
        var width = (this.w - (2 * this.sepDist)) / 3;
        var height = (this.h - (2 * this.sepDist)) / 3;
        for(var i = 0; i < 9; i++){
            var j = i;
            var k = i;
            while(j > 2){
                j -= 3;
            }
            if(i < 3){
                k = 0;
            }
            else if(i < 6){
                k = 1;
            }
            else{
                k = 2;
            }

            var left = this.x + (width * j) + (sepDist * j);
            var top = this.y + (height * k) + (sepDist * k);
            this.buttons.push({
                i: i,
                width: width,
                height: height,
                left: left,
                top: top
            });
        }

        this.rectangles.push(new rectangle(this.x + width, this.y, this.sepDist, this.h));
        this.rectangles.push(new rectangle(this.x + width * 2 + this.sepDist, this.y, this.sepDist, this.h));
        this.rectangles.push(new rectangle(this.x, height, this.w, this.sepDist));
        this.rectangles.push(new rectangle(this.x, height * 2 + this.sepDist, this.w, this.sepDist));

        this.won = "none";

        this.legal = [];
    }
}
