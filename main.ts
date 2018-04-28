let neighbours = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1]
]

/**
 * Finds the articulation points of a 2d array, i.e. the cells that
 * if they were marked as unwalkable, would split the remaining cells into
 * separate components, i.e. untraversable.
 * If relevant is supplied, then we only return an articulation point if it would split
 * the relevant cells apart. Relevant cells are always articulartion points.
 */
function findArticulationPoints(width: number, height: number, walkable: boolean[][], relevant?: boolean[][]): boolean[][]
{
    let low: number[][] = [];
    let num: number = 1;
    let dfsNum: number[][] = [];
    let isArticulation: boolean[][] = [];
    // Initialize arrays
    for (let x=0; x < width; x++) {
        low[x] = new Array(height);
        dfsNum[x] = new Array(height);
        isArticulation[x] = new Array(height);
        for (let y=0; y < height; y++) {
            isArticulation[x][y] = false;
        }
    }

    function cutvertex(ux: number, uy: number): [number, boolean] {
        let childCount = 0;
        let isRelevant = relevant && relevant[ux][uy]
        if(isRelevant) {
            isArticulation[ux][uy] = true;
        }
        let isRelevantSubtree = isRelevant;
        low[ux][uy] = dfsNum[ux][uy] = num++;
        for(let [dx, dy] of neighbours) {
            let vx = ux + dx;
            let vy = uy + dy;
            if (vx < 0 || vx >= width || vy < 0 || vy >= height) continue;
            if (!walkable[vx][vy]) continue;
            // v is a neighbour of u
            let unvisited = !dfsNum[vx][vy];
            if (unvisited)
            {
                let [_, childRelevantSubtree] = cutvertex(vx, vy);
                childCount++;
                if(childRelevantSubtree) {
                    isRelevantSubtree = true;
                }
                if (low[vx][vy] >= dfsNum[ux][uy]) {
                    if (!relevant || childRelevantSubtree) {
                        isArticulation[ux][uy] = true
                    }
                }
                low[ux][uy] = Math.min(low[ux][uy], low[vx][vy]);
            } else {
                low[ux][uy] = Math.min(low[ux][uy], dfsNum[vx][vy]);
            }
        }
        return [childCount, isRelevantSubtree];
    }

    // Find starting point
    for (let x=0; x < width; x++) {
        for (let y=0; y < height; y++) {
            if (!walkable[x][y]) continue;
            if (relevant && !relevant[x][y]) continue;
            let [childCount, childRelevantSubtree] = cutvertex(x, y);
            isArticulation[x][y] = childCount > 1 || !!relevant;
            return isArticulation;
        }
    }
    // No relevant points, or no walkable points
    return isArticulation;
}

function chooseRandom(weights: number[], random?: () => number): number | null 
{
    random = random || Math.random
    let totalWeight = 0;
    for (let i=0; i < weights.length; i++) {
        totalWeight += weights[i]
    }
    if (totalWeight <= 0)
        return null;
    let r = random() * totalWeight;
    // Could do binary search here
    for (let i=0; i < weights.length; i++) {
        r -= weights[i]
        if(r < 0)
            return i;
    }
    // Unreachable
    throw new Error("Failed to choose a random point")
}

function chooseRandomPoint(width: number, height: number, weights: number[][], random?: () => number): [number, number] | null
{
    let linearWeights = [];
    for (let x=0; x < width; x++) {
        for (let y=0; y < height; y++) {
            linearWeights.push(weights[x][y]);
        }
    }
    let i = chooseRandom(linearWeights, random);
    if (i === null)
        return null;
    return [Math.floor(i / height), i % height];
}

function map2D<U, R>(width: number, height: number, values: U[][], f: (value: U) => R): R[][] 
{
    let results: R[][] = [];
    for (let x=0; x < width; x++) {
        results[x] = values[x].map(f);
    }
    return results;
}

function zipMap2D<U, V, R>(width: number, height: number, values1: U[][], values2: V[][], f: (value1: U, value2:V) => R): R[][] 
{
    let results: R[][] = [];
    for (let x=0; x < width; x++) {
        results[x] = [];
        for (let y=0; y < height; y++) {
            results[x][y] = f(values1[x][y], values2[x][y])
        }
    }
    return results;
}

/**
 * Returns a random minimal subset of walkable that is a connected set containing all of points.
 */
function randomPath(width: number, height: number, walkable: boolean[][], points: boolean[][], random?: () => number): boolean[][]
{
    let path: boolean[][] = [];
    for (let x=0; x < width; x++) {
        path[x] = new Array(width);
        for (let y=0; y < height; y++) {
            path[x][y] = walkable[x][y];
        }
    }
    while(true) {
        let artPoints = findArticulationPoints(width, height, path, points);
        let weights = zipMap2D(width, height, path, artPoints, (isPath, isArtPoint) => isPath && !isArtPoint ? 1.0 : 0.0);
        let chiselPoint = chooseRandomPoint(width, height, weights, random);
        if (chiselPoint === null) {
            break;
        }else{
            let [x, y] = chiselPoint;
            path[x][y] = false;
        }
    }
    return path;
}

/**
 * Returns a random connected subset of walkable with the given size.
 */
function randomConnectedSet(width: number, height: number, walkable: boolean[][], count: number, random?: () => number)
{
    let set: boolean[][] = [];
    let setCount = 0;
    for (let x=0; x < width; x++) {
        set[x] = new Array(width);
        for (let y=0; y < height; y++) {
            set[x][y] = walkable[x][y];
            if (walkable[x][y]) setCount++;
        }
    }
    while(setCount > count) {
        let artPoints = findArticulationPoints(width, height, set);
        let weights = zipMap2D(width, height, set, artPoints, (inSet, isArtPoint) => inSet && !isArtPoint ? 1.0 : 0.0);
        let chiselPoint = chooseRandomPoint(width, height, weights, random)
        if (chiselPoint === null) {
            break;
        }else{
            let [x, y] = chiselPoint;
            set[x][y] = false;
            setCount--;
        }
    }
    return set;
}