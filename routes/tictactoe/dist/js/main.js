import './utils.js';
import { Room, serializeCommand } from './room.js';
import initMenu from './menu.js';
document.addEventListener('DOMContentLoaded', async () => {
    const table = document.getElementById('table');
    const curPlayerDiv = document.getElementById('cur-player');
    const gridDiv = document.getElementById('grid');
    initMenu();
    const menu = document.querySelector('.menu');
    const [settingsPage, roomPage, messagePage, restartPage] = menu.pages;
    const restartTitle = restartPage.children[0];
    const [restartButton, exitButton] = [...restartPage.children[1].children];
    const restartReadycheck = restartPage.children[2];
    const settings = settingsPage.values;
    const ROUND_ACC = 14;
    let winLine;
    let gridWidth;
    let gridHeight;
    let firstTurn;
    let player1;
    let player2;
    let grid;
    let divGrid;
    const c = (m) => (m === 1 ? 2 : 1);
    const clearGrid = () => {
        grid = [];
        divGrid = [];
        gridDiv.innerHTML = '';
        for (let y = 0; y < gridHeight; y++) {
            grid.push(new Array(gridWidth).fill(0));
            divGrid.push(new Array(gridWidth).fill(null));
        }
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const cell = document.createElement('div');
                divGrid[y][x] = cell;
                gridDiv.appendChild(cell);
            }
        }
        table.style.setProperty('--grid-x', `${gridWidth}`);
        table.style.setProperty('--grid-y', `${gridHeight}`);
        gridDiv.style.gridTemplateColumns = new Array(gridWidth).fill('auto').join(' ');
    };
    const checkTurnValidity = (cellCoords) => {
        const [x, y] = cellCoords;
        if (grid.length <= y)
            return false;
        if (grid[0].length <= x)
            return false;
        if (grid[y][x])
            return false;
        return true;
    };
    const isWinningTurn = (grid, turn, mark) => {
        const [x, y] = turn, m = mark, g = grid;
        const tL = x, tR = gridWidth - x - 1, tT = y, tB = gridHeight - y - 1;
        let [l, r, t, b, lt, rt, rb, lb] = [0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 1; i <= tL; i++) {
            if (g[y][x - i] !== m)
                break;
            l++;
        }
        for (let i = 1; i <= tR; i++) {
            if (g[y][x + i] !== m)
                break;
            r++;
        }
        for (let i = 1; i <= tT; i++) {
            if (g[y - i][x] !== m)
                break;
            t++;
        }
        for (let i = 1; i <= tB; i++) {
            if (g[y + i][x] !== m)
                break;
            b++;
        }
        for (let i = 1; i <= Math.min(tL, tT); i++) {
            if (g[y - i][x - i] !== m)
                break;
            lt++;
        }
        for (let i = 1; i <= Math.min(tR, tT); i++) {
            if (g[y - i][x + i] !== m)
                break;
            rt++;
        }
        for (let i = 1; i <= Math.min(tL, tB); i++) {
            if (g[y + i][x - i] !== m)
                break;
            lb++;
        }
        for (let i = 1; i <= Math.min(tR, tB); i++) {
            if (g[y + i][x + i] !== m)
                break;
            rb++;
        }
        const d = (a, b) => a + b + 1;
        return Math.max(d(lt, rb), d(rt, lb), d(l, r), d(t, b)) >= winLine;
    };
    const checkForWinner = (lastTurn, lastMark) => {
        if (isWinningTurn(grid, lastTurn, lastMark))
            return 1;
        if (grid.some(row => row.some(cell => cell === 0)))
            return 0;
        return 2;
    };
    class LocalPlayer {
        name;
        constructor(name) {
            this.name = name;
        }
        async init() { }
        async makeTurn() {
            let turn;
            while (true) {
                turn = await new Promise(res => {
                    const controller = new AbortController();
                    const signal = controller.signal;
                    divGrid.forEach((row, y) => {
                        row.forEach((div, x) => {
                            if (!grid[y][x]) {
                                div.addEventListener('pointerdown', (pe) => {
                                    controller.abort();
                                    const i = divGrid.flat().indexOf(pe.target);
                                    const x = i % divGrid[0].length;
                                    const y = Math.trunc(i / divGrid[0].length);
                                    res([x, y]);
                                }, { once: true, signal });
                            }
                        });
                    });
                });
                if (checkTurnValidity(turn))
                    break;
                console.warn('Invalid placement');
            }
            return turn;
        }
        update(turn, mark) {
            const [x, y] = turn;
            if (grid[y][x] && mark)
                throw new Error('Cell is occupied', { cause: `[${turn}]` });
            grid[y][x] = mark;
            const classList = divGrid[y][x].classList;
            if (mark)
                classList.add(mark - 1 ? 'circle' : 'cross');
            else
                classList.remove('circle', 'cross');
        }
    }
    class AIPlayer {
        #solve;
        #armSolver() {
            this.#solved = new Promise(res => { this.#solve = res; });
        }
        #solved = null;
        name;
        mark;
        firstMark;
        difficulty;
        _guessTree;
        _lastEnemyTurn;
        _currentBranch;
        constructor(name, mark, firstMark, difficulty) {
            this.name = name;
            this.mark = mark;
            this.firstMark = firstMark;
            this.difficulty = Math.clamp(difficulty, 0, 1);
        }
        async init() {
            this.calc();
        }
        async makeTurn() {
            await this.solved;
            const branch = this._currentBranch;
            let turn = branch[0];
            if (this._lastEnemyTurn)
                turn = branch.find(v => `${v.c}` === `${this._lastEnemyTurn}`).res[0];
            this._currentBranch = turn.res;
            if (checkTurnValidity(turn.c))
                return turn.c;
            throw new Error('Bot calculated invalid turn');
        }
        update(turn) {
            this._lastEnemyTurn = turn;
        }
        swapSides() {
            this.firstMark = c(this.firstMark);
        }
        async calc() {
            this.#armSolver();
            this._guessTree = [];
            this._lastEnemyTurn = null;
            this._currentBranch = null;
            this._guessTree = this._currentBranch = AIPlayer.makeResponses(grid, this.firstMark === this.mark, this.mark, this.difficulty);
            this.#solve();
        }
        static makeResponses(grid, botsTurn, botsMark, difficulty) {
            const m = botsMark;
            if (botsTurn) {
                //* Bot turn
                const botChoices = [];
                grid.forEach((row, y) => {
                    row.forEach((cell, x) => {
                        if (!cell) {
                            const guess = {
                                c: [x, y],
                                m,
                                wr: 0,
                                lr: 1
                            };
                            if (isWinningTurn(grid, [x, y], m)) { //* Bot wins now
                                guess.wr = 1;
                                guess.lr = 0;
                            }
                            else { //* Bot doesn't win
                                const newGrid = grid.map(v => v.slice());
                                newGrid[y][x] = m;
                                const res = AIPlayer.makeResponses(newGrid, false, c(m), difficulty);
                                guess.res = res;
                                if (!res.length) { //* Draw
                                    guess.wr = 0;
                                    guess.lr = 0;
                                }
                                else { //* More turns
                                    let wr = 0, lr = 0;
                                    res.forEach(guess => {
                                        wr += guess.wr;
                                        lr += guess.lr;
                                    });
                                    guess.wr = Math.dround(wr / res.length, ROUND_ACC);
                                    guess.lr = Math.dround(lr / res.length, ROUND_ACC);
                                }
                            }
                            botChoices.push(guess);
                        }
                    });
                });
                //* Selecting best turns
                if (!botChoices.length)
                    return null;
                let bestTurns = [botChoices[0]];
                const obligatory = [];
                for (let i = 1; i < botChoices.length; i++) {
                    const guess = botChoices[i];
                    if (Math.random() > difficulty) {
                        obligatory.push(guess);
                        continue;
                    }
                    const wr = bestTurns[0].wr;
                    const lr = bestTurns[0].lr;
                    if (guess.lr < lr)
                        bestTurns = [guess];
                    else if (guess.lr === lr) {
                        if (guess.wr > wr)
                            bestTurns = [guess];
                        else if (guess.wr === wr)
                            bestTurns.push(guess);
                    }
                }
                bestTurns.push(...obligatory);
                return [bestTurns[Math.floor(Math.random() * bestTurns.length)]];
            }
            else {
                //* Opponent turn
                const oppChoices = [];
                grid.forEach((row, y) => {
                    row.forEach((cell, x) => {
                        if (!cell) {
                            const guess = {
                                c: [x, y],
                                m: m,
                                wr: 0,
                                lr: 1
                            };
                            const newGrid = grid.map(v => v.slice());
                            newGrid[y][x] = m;
                            if (!isWinningTurn(grid, [x, y], m)) {
                                const res = AIPlayer.makeResponses(newGrid, true, c(m), difficulty);
                                if (res) { //* Next turn
                                    guess.res = res;
                                    guess.wr = res[0].wr;
                                    guess.lr = res[0].lr;
                                }
                                else { //* Draw
                                    guess.lr = 0;
                                }
                            }
                            oppChoices.push(guess);
                        }
                    });
                });
                return oppChoices;
            }
        }
        get solved() {
            return this.#solved;
        }
    }
    class RemotePlayer {
        #listeners = [];
        #messageStack = [];
        #restartVoted;
        #armRestartVote() {
            let trigger;
            this.#restartVoted = new Promise(res => {
                trigger = res;
            });
            this.once('vote_restart', trigger);
        }
        #err(name, c) {
            this._room.send(`decline:invalid ${name} command`);
            return new Error(`Opponent sent invald ${name} command`, {
                cause: serializeCommand(c)
            });
        }
        name;
        _room;
        constructor(name, room) {
            this.name = name;
            this._room = room;
            room.on('message', e => {
                if (!this.#listeners.some((l, i) => {
                    if (l[0] !== e.name)
                        return false;
                    this.#listeners.splice(i, 1);
                    l[1](e);
                    return true;
                }))
                    this.#messageStack.push(e);
            });
            room.once('exit', async () => {
                restartTitle.innerText = 'Opponent left';
                restartReadycheck.innerText = '';
                restartButton.remove();
                menu.active = 3;
                menu.style.opacity = '1';
                menu.style.removeProperty('display');
            });
        }
        init = () => new Promise(res => {
            this.#armRestartVote();
            if (this.isHost) {
                res(this._room.send({
                    name: 'start',
                    args: [
                        `${gridWidth}`,
                        `${gridHeight}`,
                        `${winLine}`,
                        `${+!firstTurn}`
                    ]
                }));
                clearGrid();
            }
            else
                this.once('start', c => {
                    const a = c.args;
                    if (a?.length < 4)
                        throw this.#err('start', c);
                    gridWidth = Math.clamp(+c.args[0], 3, 7);
                    gridHeight = Math.clamp(+c.args[1], 3, 7);
                    winLine = Math.clamp(+c.args[2], 3, Math.min(gridWidth, gridHeight));
                    firstTurn = !!+c.args[3];
                    clearGrid();
                    res();
                });
        });
        makeTurn = () => new Promise(res => {
            this.once('turn', c => {
                const a = c.args;
                if (a?.length < 2)
                    throw this.#err('turn', c);
                const x = +a[0], y = +a[1];
                if (!checkTurnValidity([x, y]))
                    throw this.#err('turn', c);
                res([x, y]);
            });
        });
        update(turn) {
            const [x, y] = turn;
            this._room.send(`turn:${x}:${y}`);
        }
        restart() {
            if (this._room.opponent) {
                this._room.send('vote_restart');
                return true;
            }
            return false;
        }
        once(name, cb) {
            if (!this.#messageStack.some((m, i) => {
                if (m.name !== name)
                    return false;
                this.#messageStack.splice(i, 1);
                cb(m);
                return true;
            }))
                this.#listeners.push([name, cb]);
        }
        get isHost() {
            if (this._room.state < 3)
                throw new Error('Room is not connected');
            return this._room.state === Room.HOST;
        }
        get restartVoted() {
            return this.#restartVoted;
        }
    }
    const runGame = async () => {
        menu.backdrop = true;
        menu.active = 3;
        menu.style.display = 'none';
        menu.style.opacity = '1';
        if (!(player2 instanceof RemotePlayer))
            clearGrid();
        await player1.init();
        await player2.init();
        table.style.display = '';
        let playerXTurn = firstTurn;
        const player = (main = true) => playerXTurn === main ? player1 : player2;
        const m = () => playerXTurn === firstTurn ? 1 : 2;
        gameCycle: while (true) {
            const p = player();
            const cp = player(false);
            if (p === player1)
                curPlayerDiv.classList.remove('second');
            else
                curPlayerDiv.classList.add('second');
            curPlayerDiv.innerText = `${p.name}'s turn`;
            console.log(`${p.name}'s turn`);
            const turn = await p.makeTurn();
            if (p == player1 && !(player2 instanceof LocalPlayer))
                player1.update(turn, m());
            console.info(`Turn: [${turn}]`);
            cp.update(turn, m());
            switch (checkForWinner(turn, m())) {
                case 1:
                    console.log(`%c${p.name} won`, 'color:lime');
                    if (player() === player1)
                        restartTitle.classList.remove('second');
                    else
                        restartTitle.classList.add('second');
                    restartTitle.innerText = `${p.name} Won!`;
                    break gameCycle;
                case 2:
                    console.log('%cGame draw', 'color:yellow');
                    restartTitle.className = 'title second';
                    restartTitle.innerText = 'Draw!';
                    break gameCycle;
            }
            playerXTurn = !playerXTurn;
        }
        console.log('Game ended');
        //* -----------
        await sleep(200);
        menu.style.opacity = '1';
        menu.style.removeProperty('display');
        const resGame = () => {
            menu.style.opacity = '0';
            menu.style.display = 'none';
            firstTurn = !firstTurn;
            if (player2 instanceof AIPlayer)
                player2.swapSides();
            runGame();
        };
        if (player2 instanceof RemotePlayer) {
            player2.restartVoted.then(() => {
                restartReadycheck.innerText = 'opponent is ready';
            });
        }
        restartButton.addEventListener('pointerup', async () => {
            if (player2 instanceof RemotePlayer) {
                player2.restart();
                restartReadycheck.innerText = 'waiting for opponent';
                await player2.restartVoted;
            }
            restartReadycheck.innerText = '';
            resGame();
        }, { once: true });
    };
    {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('animod'))
            table.classList.add('animod');
        const options = (JSON.parse(localStorage.getItem('options')) ?? {
            p2: 'ai',
            diff: 1,
            grid: [3, 3],
            winLine: 3,
            first: true
        });
        const updateDisables = (v) => {
            if (v === 1) {
                settingsPage.options[1].disable = false;
                settingsPage.options[2].disable = true;
                settingsPage.options[3].disable = true;
            }
            else {
                settingsPage.options[1].disable = true;
                settingsPage.options[2].disable = false;
                settingsPage.options[3].disable = false;
            }
        };
        settingsPage.options[0].addEventListener('change', (e) => updateDisables(e.value));
        settings[0] = ['me', 'ai', 'net'].indexOf(options.p2);
        settings[1] = [0, 1, 2, 3].indexOf(options.diff);
        settings[2][0] = `${options.grid[0]}`;
        settings[2][1] = `${options.grid[1]}`;
        settings[3] = options.winLine - 3;
        settings[4] = +!options.first;
        updateDisables(settings[0]);
        const mainController = new AbortController();
        const mainSignal = mainController.signal;
        const updateWinLine = () => {
            const numArr = settings[2].map(parseFloat);
            const minVal = Math.min(...numArr);
            settingsPage.options[3].max = minVal - 3;
        };
        const [gridX, gridY] = settingsPage.options[2].options;
        gridX.addEventListener('input', () => {
            settings[2][0] = `${Math.clamp(+settings[2][0], 3, 7)}`;
            updateWinLine();
        });
        gridY.addEventListener('input', () => {
            settings[2][1] = `${Math.clamp(+settings[2][1], 3, 7)}`;
            updateWinLine();
        });
        updateWinLine();
        const mainListener = () => {
            Object.assign(options, {
                p2: ['me', 'ai', 'net'][settings[0]],
                diff: settings[1],
                grid: settings[2].map(parseFloat),
                winLine: Math.clamp(settings[3] + 3, 3, Math.min(...settings[2].map(parseFloat))),
                first: !settings[4]
            });
            if (+settings[2][0] < 3 || +settings[2][0] > 7) {
                gridX.classList.add('fail');
                return;
            }
            else
                gridX.classList.remove('fail');
            if (+settings[2][1] < 3 || +settings[2][1] > 7) {
                gridY.classList.add('fail');
                return;
            }
            else
                gridY.classList.remove('fail');
            localStorage.setItem('options', JSON.stringify(options));
            mainController.abort();
            winLine = options.winLine;
            [gridWidth, gridHeight] = options.grid;
            firstTurn = options.first;
            switch (options.p2) {
                case 'me':
                    clearGrid();
                    player1 = new LocalPlayer('Player 1');
                    player2 = new LocalPlayer('Player 2');
                    menu.active = 3;
                    runGame();
                    break;
                case 'ai':
                    winLine = 3;
                    gridWidth = 3;
                    gridHeight = 3;
                    clearGrid();
                    player1 = new LocalPlayer('Player');
                    player2 = new AIPlayer('Bot', 2, firstTurn ? 1 : 2, [.3, .55, .75, .95][options.diff]);
                    menu.active = 3;
                    runGame();
                    break;
                case 'net':
                    const room = new Room(`ws://${location.host}/game/rooms/`);
                    menu.active = 1;
                    const [roomMenuHost, roomMenuJoin] = roomPage.querySelectorAll('.button');
                    const [upperText, lowerText] = messagePage.querySelectorAll('.text');
                    const roomController = new AbortController();
                    const roomSignal = roomController.signal;
                    const resetLoader = () => {
                        upperText.classList.add('loading');
                        upperText.innerText = 'Loading';
                        lowerText.style.display = 'none';
                    };
                    const hideLoader = () => {
                        menu.active = 1;
                        resetLoader();
                    };
                    const updateLoadingMessage = (error, upper, lower) => {
                        upperText.classList.remove('loading', 'error');
                        lowerText.classList.remove('error');
                        if (error) {
                            upperText.classList.add('error');
                            lowerText.classList.add('error');
                        }
                        menu.active = 2;
                        upperText.innerHTML = upper;
                        if (lower) {
                            lowerText.innerHTML = lower;
                            lowerText.style.removeProperty('display');
                        }
                        else
                            lowerText.style.display = 'none';
                    };
                    const roomHostListener = async () => {
                        resetLoader();
                        menu.active = 2;
                        room.host().then(token => {
                            updateLoadingMessage(false, 'Share this id with your friend:', token);
                        }).catch(err => {
                            updateLoadingMessage(true, 'Error occured while trying to host:', err);
                            sleep(5000).then(hideLoader);
                        });
                    };
                    const roomJoinListener = () => {
                        const roomID = roomPage.values[0][0].toLowerCase();
                        const reject = () => {
                            hideLoader();
                            roomPage.options[0].classList.add('fail');
                        };
                        if (!/^[a-z0-9]{6}$/.test(roomID))
                            return reject();
                        menu.active = 2;
                        room.join(roomID).then(status => {
                            if (status === 'room is full') {
                                updateLoadingMessage(true, 'Room is full');
                                sleep(1000).then(reject);
                            }
                            else if (status === 'room id is invalid') {
                                reject();
                            }
                        }).catch(err => {
                            updateLoadingMessage(true, 'Error occured while trying to join:', err);
                            sleep(5000).then(hideLoader);
                        });
                    };
                    roomMenuHost.addEventListener('pointerup', roomHostListener, { signal: roomSignal });
                    roomMenuHost.addEventListener('keyup', e => {
                        if (e.key === 'Enter')
                            roomHostListener();
                    }, { signal: roomSignal });
                    roomMenuJoin.addEventListener('pointerup', roomJoinListener, { signal: roomSignal });
                    roomMenuJoin.addEventListener('keyup', e => {
                        if (e.key === 'Enter')
                            roomJoinListener();
                    }, { signal: roomSignal });
                    room.ready.then(() => {
                        roomController.abort();
                        updateLoadingMessage(false, 'Game starts');
                        player1 = new LocalPlayer('Player 1');
                        player2 = new RemotePlayer('Player 2', room);
                        if (room.state === Room.GUEST) {
                            player1.name = 'Player 2';
                            player2.name = 'Player 1';
                        }
                        sleep(1000).then(() => {
                            menu.style.display = 'none';
                            runGame();
                        });
                    });
            }
        };
        const mainMenuButton = menu.querySelector('.button');
        mainMenuButton.addEventListener('pointerup', mainListener, { signal: mainSignal });
        mainMenuButton.addEventListener('keyup', e => {
            if (e.key === 'Enter')
                mainListener();
        }, { signal: mainSignal });
        exitButton.addEventListener('pointerup', () => location.reload());
        exitButton.addEventListener('keyup', e => {
            if (e.key === 'Enter')
                location.reload();
        });
    }
});
