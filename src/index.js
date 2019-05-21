import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { isFulfilled } from 'q';
import { SSL_OP_NO_TICKET } from 'constants';

//const GameStateContext = React.createContext();

function Square(props) {
    const square = props.square;
    return (
        <button
            className={`square 
            ${props.won? 'square-won':'sss'} 
            square-${square.openned?square.value:0}
            ${square.value==='B' && square.openned?'openned-bomb':''}
            `}
            onClick={props.onClick}
            onContextMenu={props.onContextMenu}>
            { props.state==='Dead' || square.openned? square.value: 
                square.marked? '!' : '?'}
        </button>
    );
    
}

function Timer(props) {
    const [seconds, setSeconds] = useState(0);
    useEffect(()=>{
        if (props.state === 'New') {
            setSeconds(0); 
            return;
        } else if (props.state === 'Dead' || props.state === 'Win') {
            return;
        }
        
        let timerID = setInterval(()=>tick(),1000);
        let tick = ()=>{
            setSeconds((prevSeconds)=>prevSeconds+1);
        }

        return ()=> {
            clearInterval(timerID);
        }
    })

    return (<span>Time:{seconds}</span>)
}

//class Board extends React.Component {
function Board(props) {
    /*constructor(props) {
        super(props);
        this.size = props.size;
        this.bombs = props.bombs;
    }*/

    /*function renderSquare(i, isBomb) {
        return <Square
            value={this.props.squares[i]}
            key={i}
            won={this.props.lines && this.props.lines.indexOf(i) >= 0}
            onClick={() => this.props.onClick(i)} 
            />;
    }
    */

    //render() {

    console.log('render board');
    let rows = []
    for (var i = 0; i< props.size; i++) {
        rows.push(i);
    }
    //let i=0;
    //const rows = Array(props.size).fill(i++);

    return( <div>{
        rows.map (i=>
            <div key={i}>
                <div className="board-row">{
                rows.map ((j) =>
                    {
                        const squareIdx = i*props.size+j;
                        //return this.renderSquare(squareIdx
                        //    , this.bombs.includes(squareIdx));
                        return(<Square
                            square={props.squares[squareIdx]}
                            key={squareIdx}
                            won={props.lines 
                                && props.lines.indexOf(i) >= 0}
                            onClick={(e) => props.onClick(e,squareIdx)} 
                            onContextMenu={(e)=> props.onContextMenu(e,squareIdx)}
                            state={props.state}
                            />);
                    }
                )
                }</div>
            </div>
            )
    }</div>);

    //}
}

const createBoard = (bombCount, size) => {
    const bombs = [];
    const boardCount = size **2;
    console.log('bombs start:' + boardCount);
    for (let i =0; i< bombCount; i++) {
        console.log('gen bomb');
        let nextBomb = Math.floor((Math.random()*boardCount));
        while(bombs.includes(nextBomb)) {
            nextBomb = Math.floor((Math.random()*boardCount));
        }
        bombs.push(nextBomb);              
    }
    bombs.sort();
    console.log('bombs:' + bombs);

    const board = Array(boardCount).fill().map(x=>{return {value:null, openned:false};});
    for (const i of bombs) {
        console.log('bomb:'+i);
        const b = board[i];
        b.value = 'B';
        const nbs = neighbours(i, size);
        console.log(`neighbours[${i}]:${nbs}`);
        for (const nb of nbs) {
            if (board[nb].value !== 'B') {
                if (!board[nb].value) {
                    board[nb].value = 1;
                } else {
                    board[nb].value = board[nb].value*1+1;
                }
            }
        }
    }

    return {bombs:bombs, board:board};

    //this.board = board;
    //console.log(this.board);
}

const neighbours = (i, size) => {
    let out = [];
    const leftEdge = i % size ===0;
    const rightEdge = (i+1) % size ===0;

    if (i >= size) {
        let j = i - size;
        if (!leftEdge) {
            out.push(j-1);
        }
        out.push(j);
        if (!rightEdge) {
            out.push(j+1);
        }
    }
    if (!leftEdge) {
        out.push(i-1);
    }
    if (!rightEdge) {
        out.push(i+1);
    }
    if (i < size **2 - size) {
        let j = i + size*1;
        if (!leftEdge) {
            out.push(j-1);
        }
        out.push(j);
        if (!rightEdge) {
            out.push(j+1);
        }
    }

    return out;
}


//class Game extends React.Component {
const Game = (props) => {
    /*constructor(props) {
        super(props);
        this.state = {

        
            moves: [{}],
            stepNumber: 0,
            xIsNext: true,
            asc: false,

        };

        this.createBombs(this.props.bombCount);
        
        this.state.history = [];
        this.state.history[0] = {squares:this.board};
    }*/
    console.log('render game');
    
    //const [moves, setMoves] = useState([{}]);
    //const [stepNumber, setStepNumber] = useState(0);
    const [{bombs,board}, setBoard] = useState(()=>
        createBoard(props.bombCount, props.size));
    //const [history, setHistory] = useState([{squares:board}]);
    const [state, setState] = useState('New');

    const [bombCount, setBombCount] = useState (props.bombCount);
    const [openCount, setOpenCount] = useState (props.size**2 - props.bombCount);

    const newGameClick = ()=> {
        setBoard ( createBoard(props.bombCount, props.size));
        setState('New');
        setBombCount(props.bombCount);   
        setOpenCount(props.size**2 - props.bombCount);  
    }
    
    const handleClick = (e,i) => {
        console.log(`clicked:${i}`);
        if (state === 'Dead' || state ==='Win'|| board[i].openned) return;

        if(bombs.includes(i)) {
            setState('Dead');
        } else if (state !== 'Playing') {
            setState('Playing');
        }



        let oc = 0;
        setBoard(({bombs,board:prevBoard})=>{
            const nextBoard = prevBoard.slice();
            const open = (x) =>{
                nextBoard[x].openned = true;
                oc ++;
                if (!nextBoard[x].value) {
                    neighbours(x, props.size)
                    .map(j=>!nextBoard[j].openned?open(j):null);
                }
            }

            console.log(`prevboard:${showBoard(prevBoard)}`);
            open(i);

            console.log(`nextboard:${showBoard(nextBoard)}`);
            return {bombs:bombs,board:nextBoard};
        });

        setOpenCount((prevOpenCount)=>prevOpenCount-oc);

        if (oc === openCount) {
            setState('Win');
        }

    }

    const handleContextMenu = (e,i) => {
        console.log(`context menu:${i}`);
        e.preventDefault();

        if (state === 'Dead' || state === 'Win') return;

        setBoard(({bombs,board:prevBoard})=>{
            const nextBoard = prevBoard.slice();

            const open = (x) =>{
                nextBoard[x].marked = !nextBoard[x].marked;
            }

            open(i);
            return {bombs:bombs,board:nextBoard};
        });

        setBombCount((prevBombCount)=>
            board[i].marked? prevBombCount*1-1:prevBombCount*1+1
        );

    }

    const showBoard = (board) => {
        return board.map(b=>`${b.value}, ${b.openned}`).join(',');
    }
    /*
    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        });
    }

    toogle() {
        this.setState({asc: !this.state.asc});
    }*/

    //render() {
    //    const history = this.state.history;
    //const current = history[stepNumber];
 
    /*const moves = history.map((step,move)=> {
        const desc = move?
        `Go to move #  ${move} , (
            ${this.state.moves[move].col}
            , ${this.state.moves[move].row})`:
        'Go to game start';

        const style = (move==this.state.stepNumber) 
        ? {'fontWeight': 'bold'}
        : {};

        return (
            <li key={move}>
                <button 
                onClick={()=> this.jumpTo(move)}
                style = {style}
                >{desc}</button>
            </li>
        )
    });

    const movesDisplay = this.state.asc ? moves : moves.slice(0).reverse();
    */

    console.log('render game end');
    return (
        <div className="game">
            <div className="game-board">
                <Board
                    squares={board}
                    onClick={handleClick} 
                    onContextMenu={handleContextMenu}
                    size={props.size}
                    bombs={bombs}
                    state={''}
                    />
            </div>
            <div className="game-info">
                <button onClick={newGameClick}>New Game</button>
                <div>{state}</div>
                <div>bombs: {bombCount}</div>
                {
                //<button onClick={()=>this.toogle()}>toggle</button>
                //<ol reversed={!this.state.asc}>{movesDisplay}</ol>
                }
                <Timer state={state}/>
            </div>
        </div>
    );
    //}
}

// ========================================

ReactDOM.render(
    <Game size='5' bombCount="2"/>,
    document.getElementById('root')
);
