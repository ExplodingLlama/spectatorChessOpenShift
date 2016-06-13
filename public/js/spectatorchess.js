$(document).ready(function() {
    
    'use strict';
    
    var WHITE = 'w';
    var BLACK = 'b';

    var START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
    
    var files = ['a','b','c','d','e','f','g','h'];
    var ranks = ['1','2','3','4','5','6','7','8'];
    
    var CSS = {
        whiteT1: 'white-territory1',
        blackT1: 'black-territory1',
        whiteT2: 'white-territory2',
        blackT2: 'black-territory2',
        whiteT3: 'white-territory3',
        blackT3: 'black-territory3',
        attacked: 'attacked'
    };
    
    var currentFen = START_FEN;
    
    //Auto-called when user makes a move
    var onChange = function(oldPos, newPos) {
        currentFen = ChessBoard.objToFen(newPos);
        makeGoodThingsHappen(ChessBoard.objToFen(newPos));
    };
    
    var cfg = {
        draggable: true,
        position: 'start',
        onChange: onChange
    };
    
    var board = ChessBoard('chessboard', cfg);
    
    var chess = new Chess();
    
    board.start(true);
    
    //index = square name, value = numerical value, +ve for white territory, -ve for black
    var territoryMap = {};
    //this below map is similar to territory map except, pawns are not special
    var numberOfAttackersMap = {};
    
    //index = square name, value = numerical value of the lightest piece attacking this square
    var lightestAttackingPieceMapWhite = {}; 
    var lightestAttackingPieceMapBlack = {};
    
    //list of attacked pieces
    var attackedPieces = [];
    
    var pgnMoveList = [];
    
    var pgnMoveIndex = 0;
    
    init();
    
    makeGoodThingsHappen(board.fen());

    function init() {
        $.each(files, function(fileIndex, fileValue) {
            $.each(ranks, function(rankIndex, rankValue) {
                var square = fileValue+rankValue;
                territoryMap[square] = 0;
                numberOfAttackersMap[square] = 0;
            });
        });
    }
    
    //Called when FEN is being added
    $('#fenbutton').on('click', function() {
        var fen = $('#feninput').val() || START_FEN;
        board.position(fen);
        makeGoodThingsHappen(fen);
    });

    //Called when PGN is being added
    $('#pgnbutton').on('click', function() {
        var pgn = $('#pgninput').val();
        chess.load_pgn(pgn);
        pgnMoveList = chess.get_pgn_move_list();
        pgnMoveIndex = 0;
        chess.reset();
        board.position(chess.fen());
    });
    
    $('#forwardbutton').on('click', function() {
        //get move from the pgn move list
        var move = pgnMoveList[pgnMoveIndex];
        if(pgnMoveIndex>=pgnMoveList.length-1) return;
           
        pgnMoveIndex++;
        //make move on chess.js
        chess.reset();
        var i = 0;
        for(i=0;i<pgnMoveIndex;i++){
            var move = pgnMoveList[i];
            //make move on chess.js
            chess.move(move);
        }
        var fen = chess.fen();
        board.position(fen);
    });
    
    $('#backbutton').on('click', function() {
        var i = 0;
        if(pgnMoveIndex<=0) return;
            
        pgnMoveIndex--;
        chess.reset();
        for(i=0;i<pgnMoveIndex;i++){
            var move = pgnMoveList[i];
            //make move on chess.js
            chess.move(move);
        }
        var fen = chess.fen();
        board.position(fen);
    });
        
    //Make a valid FEN string for Chess.js castling info is not required
    function getValidFen(fen, color) {
        var elements = fen.split(' ');
        return elements[0] + " " + color + " - - 0 1";
    }
    
    //This is the place to add new functionality, the function makeGoodThingsHappen()
    function makeGoodThingsHappen(fen) {
                
        removeTerritoryMarkings();
        markTerritory(fen, WHITE);
        markTerritory(fen, BLACK);
        addTerritoryMarkings();
        //Mark pieces under attack
        removeAttackedPieceMarkings();
        markAttackedPieces();
    }
    
    function removeAttackedPieceMarkings() {
        var squareElementIds = board.getSquareElIds();
        $.each(attackedPieces, function(index, value) {
            $('#' + squareElementIds[value]).removeClass(CSS.attacked);
        });
        
        attackedPieces = [];
    }
    
    function markAttackedPieces() {
        $.each(files, function(fileIndex, fileValue) {
            $.each(ranks, function(rankIndex, rankValue) {
                var square = fileValue+rankValue;
                var piece = chess.get(square);
                
                if(piece!=null){
                    //if the piece is on a square that is attacked more times than it is defended, mark it attacked
                    if((numberOfAttackersMap[square]>0 && piece.color == BLACK) ||
                       (numberOfAttackersMap[square]<0 && piece.color == WHITE)) {
                        attackedPieces.push(square);
                    }
                    //if the piece is attacked by a lighter piece, mark it attacked
                    if((piece.color == WHITE && lightestAttackingPieceMapBlack[square]<getPieceValue(piece)) ||
                       (piece.color == BLACK && lightestAttackingPieceMapWhite[square]<getPieceValue(piece))) {
                        attackedPieces.push(square);
                    }
                }
            });
        });
        
        var squareElementIds = board.getSquareElIds();
        $.each(attackedPieces, function(index, value) {
            //remove other markings
            $('#' + squareElementIds[value]).removeClass(CSS.blackT1);
            $('#' + squareElementIds[value]).removeClass(CSS.whiteT1);
            $('#' + squareElementIds[value]).removeClass(CSS.blackT2);
            $('#' + squareElementIds[value]).removeClass(CSS.whiteT2);
            $('#' + squareElementIds[value]).removeClass(CSS.blackT3);
            $('#' + squareElementIds[value]).removeClass(CSS.whiteT3);
            
            //Add this attaked one
            $('#' + squareElementIds[value]).addClass(CSS.attacked);
        })
    }
    
    function getPieceValue(piece) {
        switch(piece.type) {
            case 'p': return 1;
            case 'b': return 3;
            case 'n': return 3;
            case 'k': return 100;
            case 'q': return 9;
            case 'r': return 5;
            default: return 0;
        }
    }
    
    function markTerritory(fen, color) {

        //load board state into chess.js
        chess.load(getValidFen(fen, color));
        
        //We take each piece of this color and according to what piece it is, we find all the squares it attacks
        $.each(files, function(fileIndex, fileValue) {
           $.each(ranks, function(rankIndex, rankValue) {
               var piece = chess.get(fileValue+rankValue);
               var attckedSquaresPerPiece = [];
               if(piece && piece.color == color){
                   switch(piece.type){
                       case 'b': //Bishop
                           attckedSquaresPerPiece = getBishopTerritory(fileIndex, rankIndex, color, true);
                           break;
                       case 'q': //Queen
                           attckedSquaresPerPiece = getQueenTerritory(fileIndex, rankIndex, color);
                           break;
                       case 'k': //King
                           attckedSquaresPerPiece = getKingTerritory(fileIndex, rankIndex, color);
                           break;
                       case 'n': //Knight
                           attckedSquaresPerPiece = getKnightTerritory(fileIndex, rankIndex, color);
                           break;
                       case 'r': //Rook
                           attckedSquaresPerPiece = getRookTerritory(fileIndex, rankIndex, color, true);
                           break;
                       case 'p': //teeny tiny cute can't-move-back Pawn
                           attckedSquaresPerPiece = getPawnTerritory(fileIndex, rankIndex, color);
                           break;
                   }
               }
               
               $.each(attckedSquaresPerPiece, function(index, value) {
                   
                   if(color == WHITE) {
                       numberOfAttackersMap[value]++;
                       if(piece.type == 'p') territoryMap[value]+=3;
                       else territoryMap[value]++;
                   }
                   else {
                       numberOfAttackersMap[value]--;
                       if(piece.type == 'p') territoryMap[value]-=3;
                       else territoryMap[value]--;
                   }
               });
           }); 
        });

    }
    
    function removeTerritoryMarkings() {
        
        lightestAttackingPieceMapBlack = {};
        lightestAttackingPieceMapWhite = {};
        
        var squareElementIds = board.getSquareElIds();
        $.each(files, function(fileIndex, fileValue) {
           $.each(ranks, function(rankIndex, rankValue) {
               territoryMap[fileValue+rankValue] = 0;
               numberOfAttackersMap[fileValue+rankValue] = 0;
               $('#' + squareElementIds[fileValue+rankValue]).removeClass(CSS.blackT1);
               $('#' + squareElementIds[fileValue+rankValue]).removeClass(CSS.whiteT1);
               $('#' + squareElementIds[fileValue+rankValue]).removeClass(CSS.blackT2);
               $('#' + squareElementIds[fileValue+rankValue]).removeClass(CSS.whiteT2);
               $('#' + squareElementIds[fileValue+rankValue]).removeClass(CSS.blackT3);
               $('#' + squareElementIds[fileValue+rankValue]).removeClass(CSS.whiteT3);
           }); 
        });
    }
    
    function addTerritoryMarkings() {
        
        var squareElementIds = board.getSquareElIds();
        var cssClass;
        
        $.each(territoryMap, function(index, value) {
            switch(value) {
                case 1: cssClass = CSS.whiteT1;
                    break;
                case 2: cssClass = CSS.whiteT2;
                    break;
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8: cssClass = CSS.whiteT3;
                    break;
                case -1: cssClass = CSS.blackT1;
                    break;
                case -2: cssClass = CSS.blackT2;
                    break;
                case -3: 
                case -4:
                case -5:
                case -6:
                case -7:
                case -8:
                    cssClass = CSS.blackT3;
                    break;
                default: cssClass = null;
                    break;
                    
            }
            
            $('#' + squareElementIds[index]).addClass(cssClass);
        })
        
    }
    
    function getPawnTerritory(fileIndex, rankIndex, color) {
        var result = [];
        
        //Only two possible squares
        var attackedRankI;
        if(color == WHITE) attackedRankI = rankIndex+1;
        else attackedRankI = rankIndex-1;
        
        if(attackedRankI>=0 && attackedRankI<=ranks.length-1) {
            if(fileIndex>0) result.push(files[fileIndex-1] + ranks[attackedRankI]);
            if(fileIndex<files.length-1) result.push(files[fileIndex+1] + ranks[attackedRankI]);
        }
        
        //update the lightest attacking piece map
        var attackingMap;
        if(color == WHITE) attackingMap = lightestAttackingPieceMapWhite;
        else attackingMap = lightestAttackingPieceMapBlack;
        $.each(result, function(index, value) {
           attackingMap[value] = 1; //1 for pawn
        });
        
        return result;
    }
    
    function getKnightTerritory(fileIndex, rankIndex, color) {
        
        var result = [];
        
        //Eight possible squares
        //First, two squares to the right
        var fileI = fileIndex+2;
        if(fileI <= files.length-1) {
            if(rankIndex<ranks.length-1) result.push(files[fileI] + ranks[rankIndex+1]);
            if(rankIndex>0) result.push(files[fileI] + ranks[rankIndex-1]);
        }
        
        //Next, twp squares to the left
        fileI = fileIndex-2;
        if(fileI>=0) {
            if(rankIndex<ranks.length-1) result.push(files[fileI] + ranks[rankIndex+1]);
            if(rankIndex>0) result.push(files[fileI] + ranks[rankIndex-1]);
        }
        
        //next, two squares up
        var rankI = rankIndex+2;
        if(rankI <= ranks.length-1) {
            if(fileIndex<files.length-1) result.push(files[fileIndex+1] + ranks[rankI]);
            if(fileIndex>0) result.push(files[fileIndex-1] + ranks[rankI]);
        }
        
        //Next, two squares down
        rankI = rankIndex-2;
        if(rankI>=0) {
            if(fileIndex<files.length-1) result.push(files[fileIndex+1] + ranks[rankI]);
            if(fileIndex>0) result.push(files[fileIndex-1] + ranks[rankI]);
        }
        
        //update the lightest attacking piece map
        var attackingMap;
        if(color == WHITE) attackingMap = lightestAttackingPieceMapWhite;
        else attackingMap = lightestAttackingPieceMapBlack;
        $.each(result, function(index, value) {
            //if none attacking yet
            if(attackingMap[value]==null || attackingMap[value]>3) {
               attackingMap[value] = 3; //3 for knght and bishop
            }
        });
        
        return result;
    }
    
    function getKingTerritory(fileIndex, rankIndex, color) {
        
        var result = [];
        //One square each direction
        //to the left three squares
        if(fileIndex>0) {
            var fileI = fileIndex-1;
            if(rankIndex>0) result.push(files[fileI] + ranks[rankIndex-1]);
            result.push(files[fileI] + ranks[rankIndex]);
            if(rankIndex<ranks.length-1) result.push(files[fileI] + ranks[rankIndex+1]);
        }
        //to the right three squares
        if(fileIndex<files.length-1) {
            var fileI = fileIndex+1;
            if(rankIndex>0) result.push(files[fileI] + ranks[rankIndex-1]);
            result.push(files[fileI] + ranks[rankIndex]);
            if(rankIndex<ranks.length-1) result.push(files[fileI] + ranks[rankIndex+1]);
        }
        //up
        if(rankIndex<ranks.length-1) result.push(files[fileIndex] + ranks[rankIndex+1]);
        //down
        if(rankIndex>0) result.push(files[fileIndex] + ranks[rankIndex-1]);
        
        //update the lightest attacking piece map
        var attackingMap;
        if(color == WHITE) attackingMap = lightestAttackingPieceMapWhite;
        else attackingMap = lightestAttackingPieceMapBlack;
        $.each(result, function(index, value) {
            //if none attacking yet
            if(attackingMap[value]==null || attackingMap[value]>100) {
               attackingMap[value] = 100; //100 for king
            }
        });
        
        return result;
    }
    
    function getQueenTerritory(fileIndex, rankIndex, color) {
        
        //This is just a combination of rook and bishop squares.
        var bishopResult = getBishopTerritory(fileIndex, rankIndex, color, false);
        var rookResult = getRookTerritory(fileIndex, rankIndex, color, false);
        var result = bishopResult.concat(rookResult);
        
        //update the lightest attacking piece map
        var attackingMap;
        if(color == WHITE) attackingMap = lightestAttackingPieceMapWhite;
        else attackingMap = lightestAttackingPieceMapBlack;
        $.each(result, function(index, value) {
            //if none attacking yet
            if(attackingMap[value]==null || attackingMap[value]>9) {
               attackingMap[value] = 9; //9 for Queen
            }
        });
        
        return result;
    }
    
    function getRookTerritory(fileIndex, rankIndex, color, attackedPieceMarking) {
        var result = [];
        //Four Directions
        
        //going right
        var fileI = fileIndex;
        while(true) {
            if(fileI>=files.length-1) break;
            fileI++;
            //Add to list
            var square = files[fileI] + ranks[rankIndex];
            result.push(square);
            //If there is a piece on this square, break out
            var piece = chess.get(square);
            if(piece && ((piece.type!='r' && piece.type!='q') || piece.color!=color)) break;
        }
        
        //going left
        fileI = fileIndex;
        while(true) {
            if(fileI<=0) break;
            fileI--;
            //Add to list
            var square = files[fileI] + ranks[rankIndex];
            result.push(square);
            //If there is a piece on this square, break out
            var piece = chess.get(square);
            if(piece && ((piece.type!='r' && piece.type!='q') || piece.color!=color)) break;
        }
        
        //going up
        var rankI = rankIndex;
        while(true) {
            if(rankI>=ranks.length-1) break;
            rankI++;
            var square = files[fileIndex] + ranks[rankI];
            result.push(square);
            //if there is a piece on this square, breakout
            var piece = chess.get(square);
            if(piece && ((piece.type!='r' && piece.type!='q') || piece.color!=color)) break;
        }
        
        //going down
        rankI = rankIndex;
        while(true) {
            if(rankI<=0) break;
            rankI--;
            var square = files[fileIndex] + ranks[rankI];
            result.push(square);
            //if there is a piece on this square, breakout
            var piece = chess.get(square);
            if(piece && ((piece.type!='r' && piece.type!='q') || piece.color!=color)) break;
        }
        
        if(attackedPieceMarking==false) return result;
        
        //update the lightest attacking piece map
        var attackingMap;
        if(color == WHITE) attackingMap = lightestAttackingPieceMapWhite;
        else attackingMap = lightestAttackingPieceMapBlack;
        $.each(result, function(index, value) {
            //if none attacking yet
            if(attackingMap[value]==null || attackingMap[value]>5) {
               attackingMap[value] = 5; //5 for Rook
            }
        });
        
        return result;
    }
    
    //Find all the squares attacked by this bishop on this file and this rank
    function getBishopTerritory(fileIndex, rankIndex, color, attackedPieceMarking) {
        var result = [];
        //Four directions
        //First one, going upward and right, and second one, going downward and right, inside the loop
        var fileI = fileIndex;
        var rankUp = rankIndex;
        var rankDown = rankIndex;
        while(true){
            
            //If last file, break out.
            if(fileI>=files.length-1) break;
            
            fileI++;
            //If not the last rank, do some shit
            if(rankUp<ranks.length-1) {
                rankUp++;
                var square = files[fileI] + ranks[rankUp];
                //Add this square to the list
                result.push(square);
                //If there is a piece on this square, short circuit this part from further executions by making the value of rankUp = 100 because no one will create a board that big haha.
                var piece = chess.get(square);
                if(piece && ((piece.type != 'q' && piece.type !='b') || piece.color!=color)) rankUp=100;
            }
            
            //If not the first rank, do some shit
            if(rankDown>0) {
                rankDown--;
                var square = files[fileI] + ranks[rankDown];
                //Add this square to the list
                result.push(square);
                //If there is a piece on this square, short circuit this part from further executions by making the value of rankDown = 0 because that'll do pig, that'll do.
                var piece = chess.get(square);
                if(piece && ((piece.type != 'q' && piece.type !='b') || piece.color!=color)) rankDown = 0;
            }
        }
        //Second one, going left and upward and left and downward
        fileI = fileIndex;
        rankUp = rankIndex;
        rankDown = rankIndex;
        while(true){
            //If the first file, break out
            if(fileI<=0) break;
            
            fileI--;
            //If not the last rank, do some shit
            if(rankUp<ranks.length-1) {
                rankUp++;
                var square = files[fileI] + ranks[rankUp];
                //Add this square to the list
                result.push(square);
                //If there is a piece on this square, short circuit this part from further executions by making the value of rankUp = 100 because no one will create a board that big haha.
                var piece = chess.get(square);
                if(piece && ((piece.type != 'q' && piece.type !='b') || piece.color!=color)) rankUp=100;
            }
            
            //If not the first rank, do some shit
            if(rankDown>0) {
                rankDown--;
                var square = files[fileI] + ranks[rankDown];
                //Add this square to the list
                result.push(square);
                //If there is a piece on this square, short circuit this part from further executions by making the value of rankDown = 0 because that'll do pig, that'll do.
                var piece = chess.get(square);
                if(piece && ((piece.type != 'q' && piece.type !='b') || piece.color!=color)) rankDown = 0;
            }
        }
        
        if(attackedPieceMarking==false) return result;
        
        //update the lightest attacking piece map
        var attackingMap;
        if(color == WHITE) attackingMap = lightestAttackingPieceMapWhite;
        else attackingMap = lightestAttackingPieceMapBlack;
        $.each(result, function(index, value) {
            //if none attacking yet
            if(attackingMap[value]==null || attackingMap[value]>3) {
               attackingMap[value] = 3; //3 for Knight and Bishop
            }
        });
        
        return result;
    }
});
