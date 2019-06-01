import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { isFulfilled } from 'q';
import { SSL_OP_NO_TICKET } from 'constants';

//const GameStateContext = React.createContext();

type SVB = {tag: "bomb", value: "B"};
type SVN = {tag: "number", value: number};
type SV = SVB | SVN;

interface SquareProps { 
    square:BoardItem;
    won: any; 
    onClick?: ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void) ; 
    onContextMenu?: ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void);
    state: GameState; 
}

const Square = (props: SquareProps) => {
    const square = props.square;
    return (
        <button
            className={`square 
            ${props.won? 'square-won':'sss'} 
            ${square.openned? 'square-openned':'square-closed'}
            square-${square.openned?square.sv.value:-1}
            ${square.sv.tag==="bomb" && square.openned?'openned-bomb':''}
            `}
            onClick={props.onClick}
            onContextMenu={props.onContextMenu}>
            { props.state===GameState.Dead || square.openned? square.sv.value: 
                square.marked? '!' : ''}
        </button>
    );
    
}

enum GameState {
    New = ':',
    Dead = 'Dead xxx',
    Win = 'Won !! :)',
    Playing = ':o'
}

const Timer = (props: { state: GameState; }) => {
    const [seconds, setSeconds] = useState(0);
    useEffect(()=>{
        if (props.state === GameState.New) {
            setSeconds(0); 
            return;
        } else if (props.state === GameState.Dead || props.state === GameState.Win) {
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

    return (<span className='counter'>{seconds}</span>)
}

interface BoardProps { 
    size: number; 
    squares: { [x: string]: any; }; 
    lines?: string; 
    onClick: (arg0: React.MouseEvent<HTMLButtonElement, MouseEvent>, arg1: any) => void; 
    onContextMenu: (arg0: React.MouseEvent<HTMLButtonElement, MouseEvent>, arg1: any) => void; 
    state: GameState; 
    bombs: number[];
}

//class Board extends React.Component {
const Board = (props: BoardProps) => {
 
    //console.log('render board');
    let rows: number[] = []
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
                                && props.lines.indexOf(String(i)) >= 0}
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

interface BoardItem {
    sv: SV;
    openned: boolean;
    marked: boolean;
}

interface Board {
    bombs: number[];
    board: BoardItem[];
}

const createBoard: (bombCount:number,size:number)=>Board
= (bombCount, size) => {
    const bombs:number[] = [];
    const boardCount = size **2;
    //console.log('bombs start:' + boardCount);
    for (let i =0; i< bombCount; i++) {
        //console.log('gen bomb');
        let nextBomb = Math.floor((Math.random()*boardCount));
        while(bombs.includes(nextBomb)) {
            nextBomb = Math.floor((Math.random()*boardCount));
        }
        bombs.push(nextBomb);              
    }
    bombs.sort();
    //console.log('bombs:' + bombs);

    const board:BoardItem[] = Array(boardCount).fill({}).map(
        _x=>{return {sv:{tag:"number",value:0}, openned:false, marked:false};});
    for (const i of bombs) {
        //console.log('bomb:'+i);
        const b = board[i];
        b.sv = {tag:"bomb",value:"B"};
        const nbs = neighbours(i, size);
        //console.log(`neighbours[${i}]:${nbs}`);
        for (const nb of nbs) {
          const v = board[nb].sv;
          switch (v.tag) {
                case "number": {
                    if (!v.value) {
                        v.value = 1;
                    } else {
                        v.value++;
                    }
                }    
            }
        }
    }

    return {bombs:bombs, board:board};

    //this.board = board;
    ////console.log(this.board);
}

const neighbours:(i:number, size:number)=>number[]
 = (i, size) => {
    let out:number[] = [];
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


const Game = (props: { bombCount: number; size: number; }) => {
    //console.log('render game');
    
    //const [moves, setMoves] = useState([{}]);
    //const [stepNumber, setStepNumber] = useState(0);
    const [{bombs,board}, setBoard] = useState(()=>
        createBoard(props.bombCount, props.size));
    //const [history, setHistory] = useState([{squares:board}]);
    const [state, setState] = useState(GameState.New);

    const [bombCount, setBombCount] = useState (props.bombCount);

    const newGameClick = ()=> {
        setBoard ( createBoard(props.bombCount, props.size));
        setState(GameState.New);
        setBombCount(props.bombCount);   
    }
    
    const handleClick = (_e: React.MouseEvent<HTMLButtonElement, MouseEvent>,i: number) => {
        //console.log(`clicked:${i}`);
        if (state === GameState.Dead || state ===GameState.Win|| board[i].openned) return;

        if(bombs.includes(i)) {
            setState(GameState.Dead);
        } else if (state !== GameState.Playing) {
            setState(GameState.Playing);
        }

        setBoard(({bombs,board:prevBoard})=>{
            const nextBoard = prevBoard.slice();
            const open = (x: number) =>{
                nextBoard[x].openned = true;
                //console.log('openning');
                if (!nextBoard[x].sv.value) {
                    neighbours(x, props.size)
                    .map(j=>!nextBoard[j].openned?open(j):null);
                }
            }

            //console.log(`prevboard:${showBoard(prevBoard)}`);
            open(i);

            if (!nextBoard.find(b=>!b.openned && b.sv.tag==='number')) {
                setState(GameState.Win)
            }

            //console.log(`nextboard:${showBoard(nextBoard)}`);
            return {bombs:bombs,board:nextBoard};
        });

     
    }

    const handleContextMenu = (e:React.MouseEvent<HTMLButtonElement, MouseEvent>,i: number) => {
        //console.log(`context menu:${i}`);
        e.preventDefault();

        if (state === GameState.Dead || state === GameState.Win) return;

        setBoard(({bombs,board:prevBoard})=>{
            const nextBoard = prevBoard.slice();

            const open = (x:number) =>{
                nextBoard[x].marked = !nextBoard[x].marked;
            }

            open(i);
            return {bombs:bombs,board:nextBoard};
        });

        setBombCount((prevBombCount)=>
            board[i].marked? prevBombCount*1-1:prevBombCount*1+1
        );

    }

    const showBoard = (board:BoardItem[]) => {
        return board.map(b=>`${b.sv.value}, ${b.openned}`).join(',');
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

    //console.log('render game end');
    return (
        <div className="game">
            <div className="game-info">
                <button onClick={newGameClick}>New Game</button>
                <div>{state}</div>
                <div style={{width:200, display:'inline-flex'}}>
                    <div style={{order:1, flexGrow:1}} className='counter'>{bombCount}</div>
                    <div style={{order:2, flexGrow:1}}> </div>
                    <div style={{order:3, flexGrow:1}}><Timer state={state} /></div>
                </div>
            </div>
            <div className="game-board">
                <Board
                    squares={board}
                    onClick={handleClick} 
                    onContextMenu={handleContextMenu}
                    size={props.size}
                    bombs={bombs}
                    state={state}
                    />
            </div>
        </div>
    );
    //}
}

// ========================================

ReactDOM.render(
    <Game size={20} bombCount={4}/>,
    document.getElementById('root')
);
