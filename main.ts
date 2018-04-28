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
                if(childRelevantSubtree) {
                    childCount++;
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
console.log(findArticulationPoints(
    3,
    3,
    [
        [true, true, true],
        [false, true, false],
        [true, true, true]
    ]
))
console.log(findArticulationPoints(
    3,
    3,
    [
        [true, true, true],
        [true, false, true],
        [true, true, true]
    ]
))
console.log(findArticulationPoints(
    3,
    3,
    [
        [false, true, true],
        [true, false, true],
        [true, true, true]
    ],
    [
        [false, false, true],
        [false, false, false],
        [true, false, false]
    ],
))

































