enum CellState{
    Open,
    Blocked,
    Forced,
}

type Cell = {x: number; y: number};

class CellSet {
    private cellToIndex: number[][] = [];
    cells: Cell[] = [];

    contains(cell: Cell):boolean {
        return this.cellToIndex[cell.x]?.[cell.y] !== undefined;
    }

    add(cell: Cell) {
        if(cell === undefined)
            throw new Error();
        const index = this.cellToIndex[cell.x]?.[cell.y];
        if (index === undefined) {
            setValue(this.cellToIndex, cell, this.cells.length);
            this.cells.push(cell);
        }
    }

    remove(cell: Cell) {
        const index = this.cellToIndex[cell.x]?.[cell.y];
        if (index !== undefined) {
            this.cellToIndex[cell.x][cell.y] = undefined;
            if (index < this.cells.length - 1) {
                const other = this.cells[index] = this.cells[this.cells.length - 1];
                this.cellToIndex[other.x][other.y] = index;
            }
            this.cells.pop();
        }
    }
}

function randomCell(cells: Cell[]) {
    return cells[Math.floor(Math.random() * cells.length)];
}

function setValue<T>(a: T[][], c: Cell, v: T) {
    let a2 = a[c.x];
    if (a2 === undefined) {
        a2 = a[c.x] = [];
    }
    a[c.x][c.y] = v;
}

function getValue<T>(a: T[][], c: Cell): T | undefined {
    return a[c.x]?.[c.y];
}

function weightedRandomOpenCell(openCells: CellSet, path: CellSet, wiggliness: number) {
    const openPathCells = path.cells.filter(c => openCells.contains(c));
    const pathWeight = openPathCells.length * wiggliness;
    const nonPathWeight = (openCells.cells.length - openPathCells.length) * 1;
    const totalWeight = pathWeight + nonPathWeight;
    var r = Math.random() * totalWeight;
    if (r <= pathWeight) {
        return randomCell(openPathCells);
    } else {
        // Pick a non path cell
        const nonPathCells = openCells.cells.filter(c => !path.contains(c));
        return randomCell(nonPathCells);
    }
}


function findPath(width: number, height: number, from: Cell, to: Cell, cellStates: CellState[][]) {
    // For wiggliness = 1, you you could use a simple depth first search here, as the choice of path doesn't matter.
    // But we use a randomized shortest path algorithm (Dijkstra's) as this is needed for other values of wiggliness.
    // I've customized it for the fact we have unit weights, which is easier than a full implementation.
    // The A* algorithm would also work here, and as usual, would be more efficient


    // Find the cells adjacent to a given cell that are not out of bounds or blocked.
    function getNeighbours(cell: Cell): Cell[] {
        const {x, y} = cell;
        const n = [];
        if (x > 0) n.push({x: x - 1, y});
        if (x < width - 1) n.push({x: x + 1, y});
        if (y > 0) n.push({x, y: y - 1});
        if (y < height - 1) n.push({x, y: y + 1});
        return n.filter(c => cellStates[c.x][c.y] !== CellState.Blocked);
    }

    let distances: number[][] = [];
    let currentCells: Cell[] = [from];
    let currentDist: number = 0;
    let nextCells: Cell[] = [];
    setValue(distances, from, 0);
    while(true) {
        // Process all the cells at currentDist
        for (const cell of currentCells) {
            for (const neighbour of getNeighbours(cell)) {
                if(getValue(distances, neighbour) !== undefined) continue;
                nextCells.push(neighbour);
                setValue(distances, neighbour, currentDist + 1);
            }
        }
        currentCells = nextCells;
        nextCells = [];
        currentDist += 1;
        if(getValue(distances, to) !== undefined) break;
        if (currentCells.length == 0) return null;
    }
    // We've found all cells at distance up to currentDist from the start.
    // Now pick a random path back to base
    const path: CellSet = new CellSet();
    let c = to;
    path.add(c);
    while(currentDist > 0) {
        const ns = getNeighbours(c);
        const nsTowardsStart = ns.filter(x => getValue(distances, x) === currentDist - 1)
        c = randomCell(nsTowardsStart);
        path.add(c);
        currentDist -= 1;
    }
    return path;
}

function randomPath(width: number, height: number, from: Cell, to: Cell, wiggliness: number = 1) {
    const cellStates: CellState[][] = [];
    const openCells: CellSet = new CellSet();

    // Initialization
    for (let x=0; x < width; x++) {
        cellStates[x] = [];
        for (let y = 0; y < height; y++) {
            openCells.add({x,y});
            cellStates[x][y] = CellState.Open;
        }
    }
    openCells.remove(from);
    openCells.remove(to);
    cellStates[from.x][from.y] = CellState.Forced;
    cellStates[to.x][to.y] = CellState.Forced;

    function find_path(): CellSet | null {
        return findPath(width, height, from, to, cellStates);
    }
    // Main algorithm
    let witness = find_path();
    while (true) {
        // Exit if no Open cells remaining
        if (openCells.cells.length === 0) {
            return witness;
        }
        // Pick a random Open cell
        let c;
        if (wiggliness == 1) {
            c = randomCell(openCells.cells);
        } else {
            c = weightedRandomOpenCell(openCells, witness, wiggliness);
        }
        // Set c to Blocked
        cellStates[c.x][c.y] = CellState.Blocked;
        openCells.remove(c);
        
        if (witness.contains(c)){
            const newPath = find_path();
            if (newPath === null) {
                // Set c to Forced
                cellStates[c.x][c.y] = CellState.Forced;
            } else {
                witness = newPath;
            }
        }
    }
}