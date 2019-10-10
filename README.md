# Big Boi Tic-Tac-Toe

## How to Play

* Similar to normal Tic-Tac-Toe, the goal is to have three of your symbol in a row, column, or diagonal
  * Once a smaller board has three of the same symbol in a row, the smaller board fills with that symbol. The goal is to connect three big symbols.
* Unlike normal Tic-Tac-Toe, there are limited options as to where a symbol can be placed.
  * If the previous player placed in the top right cell of a small board, the succeeding player must place in the top right of the big board.
  * If the previous player placed in the top left cell and the top left of the small boards has already been filled, the succeeding player may place in any of the adjecent cells.
    * This effect stacks; if an adjacent cell is also filled, a symbol can be placed in any cell bordering that one.
