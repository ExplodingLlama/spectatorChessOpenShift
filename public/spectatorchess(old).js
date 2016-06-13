$(document).ready(function() {
    
    "use strict";
    var WHITE = 'w';
    var BLACK = 'b';

    var START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
    
    var files = ['a','b','c','d','e','f','g','h'];
    var ranks = ['1','2','3','4','5','6','7','8'];
    
    //Auto-called when user makes a move
    var onChange = function(oldPos, newPos) {
        makeGoodThingsHappen();
    };
    
    var cfg = {
        draggable: true,
        position: 'start',
        onChange: onChange
    };
    
    var board = ChessBoard('chessboard', cfg);
    
    var chess = new Chess();
    
    board.start(true);

    //Called when FEN is being added
    $('#fenbutton').on('click', function() {
        var fen = $('#feninput').val() || START_FEN;
        board.position(fen);
        makeGoodThingsHappen();
    });


        
    //Make a valid FEN string for Chess.js
    function getValidFen(fen, color){
        var elements = fen.split(' ');
        return elements[0] + " " + color + " - - 0 1";
    }
    
    //This is the place to add new functionality, the function makeGoodThingsHappen()
    function makeGoodThingsHappen(){
        console.log(markTerritory(WHITE));
        console.log(markTerritory(BLACK));
    }
    
    function markTerritory(color){
        
        //This one stores the results
        var attackedSquares = [];
        
        var newFen = getValidFen(board.fen(),color);
        
        //Get all legal moves for this color
        chess.load(newFen);
        var legalMoves = chess.moves();
        
        //We separate all non pawn moves from the array
        var nonPawnMoves = [];
        $.each(legalMoves, function(index, value) {
           if(!isPawnMove(value)){
               nonPawnMoves.push(value);
           } 
        });
        
        //Add the non-pawn moves to attackedSquares
        $.each(nonPawnMoves, function(index, value) {
            attackedSquares.push(getDestinationSquare(value));
        });
        
                
        //Now we add pawn capture squares for each pawn

        $.each(files, function(index1, value1) {
           $.each(ranks, function(index2, value2) {
               var piece = chess.get(value1+value2);
               if(piece && piece.color==(color) && piece.type==('p')){
                   //This is our guy.
                   //Two squares for each pawn, unless they are at the ends.
                   
                   //Get the rank of the two attacked squares
                   var rank = ranks[0];
                   if(color==(WHITE)){
                       rank = ranks[index2+1];
                   } else {
                       rank = ranks[index2-1];
                   }
                   
                   //Add the squares only if they are valid.
                   if(index1 > 0){
                       attackedSquares.push(files[index1-1] + rank);
                   }
                   if(index1 < files.length-1){
                       attackedSquares.push(files[index1+1] + rank);
                   }
               }
           }); 
        });
        
        //Adding squares which have a piece of the given color and are attacked by some other piece of the same color
        $.each(files,function(index1, value1) {
           $.each(ranks,function(index2,value2) {
               var currentSquare = value1+value2;
               var piece = chess.get(currentSquare);
               //if there is a piece of this color
               if(piece && piece.color==color){
                   //remove piece
                   var modifiedFen = removePieceFromFen(board.fen(),index1, index2);
                   chess.load(getValidFen(modifiedFen, color));
                   //get valid moves
                   var moves = chess.moves();
                   //Only look at the current square
                   $.each(moves, function(index3, value3) {
                       if(getDestinationSquare(value3) == currentSquare){
                           attackedSquares.push(currentSquare);
                       }
                   });
               }
           }); 
        });
        
        return attackedSquares;
    }
    
    //This function removes the given piece and returns the modified fen string 
    function removePieceFromFen(fen,fileIndex,rankIndex){
        //remove unnecessary things from the end
        var modifiedFen = fen.split(' ')[0];
        
        var modifiedFenArray = modifiedFen.split('/');
        var rankString = modifiedFenArray[ranks.length-rankIndex-1];
        var rankStringArray = rankString.split('');
        
        //iterate to the correct file number
        var i = 0;
        while(fileIndex>0){
            if(rankStringArray[i].match(/[1-8]/)) fileIndex-parseInt(rankStringArray[i]);
            else fileIndex--;
        }
        //Remove the piece
        rankStringArray[i] = "1";
        //Recreate Rank String
        var newRankString = "";
        $.each(rankStringArray, function(index, value) {
            newRankString+=value;
        });
        //UpdateFenArray
        modifiedFenArray[ranks.length-rankIndex-1] = newRankString;
        //Create Fen
        var result = "";
        $.each(modifiedFenArray, function(index, value) {
            result+=value;
            if(index<modifiedFenArray.length-1) result+='/';
        });
        
        return result;
    }
    
    function getDestinationSquare(move){
        return move.substr(move.length-2);
    }

    function isPawnMove(move){
        //Simple pawn moves
        var result = move.match(/^[a-h][1-8]$/);
        if(result && result.length > 0){
            return true;
        }
        //Captures
        result = move.match(/^[a-h]x[a-h][1-8]$/);
        if(result && result.length > 0){
            return true;
        }
        return false;
    }
});
