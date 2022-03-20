function setupDemo2(imagePath: string)
{
    // Setup form
    let wigglinessInput = <HTMLElement>document.getElementById('wiggliness');
    wigglinessInput.onchange = () => redraw();
    // Setup canvas
    let canvas = <HTMLCanvasElement>document.getElementById('canvas');
    let ctx = canvas.getContext("2d");
    let loadCount = 0;
    function onLoadOne() {
        if(++loadCount == 3)
            onLoaded();
    }
    let path = imagePath ? imagePath : "";
    let floorTiles = new Image();
    floorTiles.addEventListener("load", onLoadOne);
    floorTiles.src = path + "floor_tiles.png";
    let grass = new Image();
    grass.addEventListener("load", onLoadOne);
    grass.src = path + "grass.png";
    let sign = new Image();
    sign.addEventListener("load", onLoadOne);
    sign.src = path + "sign.png";
    ctx.fillText("Loading...", 0, 40);
    canvas.onclick = onCanvasClick;

    function onLoaded()
    {
        redraw();
    }

    // UI routines

    // Size of walls
    let margin = 0;
    let tileSize = 32;
    let width = 20;
    let height = 20;

    function redraw()
    {
        // Recompute path
        const wiggliness = wigglinessInput.value / 100;
        let walkable: boolean[][] = [];
        for(let x=0;x<width;x++)
        {
            walkable[x] = [];
            for(let y=0;y<height;y++)
                walkable[x][y] = true;
        }
        let path = randomPath(width, height, {x:1,y:1}, {x:width-2,y:height-2}, wiggliness);
        for(let x=0;x<width;x++)
        {
            for(let y=0;y<height;y++)
                walkable[x][y] = path.contains({x,y});;
        }

        regenPerlin();

        // Draw everything
        ctx.fillStyle = "#000000";
        ctx.fillRect(margin, margin, tileSize * width, tileSize * height);

        function get(x: number, y: number) : number
        {
            if(x < 0 || x >= width || y < 0 || y >= height)
                return 0;
            return walkable[x][y] ? 1 : 0;
        }

        for(let x=0;x<width;x++)
        for(let y=0;y<height;y++)
        {
            if(get(x,y))
            {
                // Draw a path tile
                let topLeft = get(x-1, y-1);
                let top = get(x, y-1);
                let topRight = get(x+1, y-1);
                let left = get(x-1, y);
                let right = get(x+1, y);
                let bottomLeft = get(x-1, y+1);
                let bottom = get(x, y+1);
                let bottomRight = get(x+1, y+1)

                let i1 = top && left && topLeft ? 4 : left + 2 * top;
                let i2 = top && right && topRight ? 4 : right + 2 * top;
                let i3 = bottom && left && bottomLeft ? 4 : left + 2 * bottom;
                let i4 = bottom && right && bottomRight ? 4 : right + 2 * bottom;
                // A bit of stylistic variation
                if(i1==0 && Math.random() < 0.5) i1 = 5;
                if(i2==0 && Math.random() < 0.5) i2 = 5;
                if(i3==0 && Math.random() < 0.5) i3 = 5;
                if(i4==0 && Math.random() < 0.5) i4 = 5;

                //ctx.fillStyle = "#FFFFFF";
                //ctx.fillRect(x * tileSize + margin, y * tileSize + margin, tileSize, tileSize);
                let h = tileSize / 2;
                ctx.drawImage(floorTiles, i1 * h, h * 0, h, h, x * tileSize + margin + 0, y * tileSize + margin + 0, h, h);
                ctx.drawImage(floorTiles, i2 * h, h * 1, h, h, x * tileSize + margin + h, y * tileSize + margin + 0, h, h);
                ctx.drawImage(floorTiles, i3 * h, h * 2, h, h, x * tileSize + margin + 0, y * tileSize + margin + h, h, h);
                ctx.drawImage(floorTiles, i4 * h, h * 3, h, h, x * tileSize + margin + h, y * tileSize + margin + h, h, h);
            }
            else
            {
                // Draw a patch of grass
                let h = tileSize / 2;
                let frequency = 4;
                let depth = 8;
                let roughness = 0.4;

                for(let dx = 0; dx < 1; dx += 0.5) {
                    for (let dy = 0; dy < 1; dy += 0.5) {
                        let p = perlin((x + dx) / frequency, (y + dy) / frequency);
                        p = Math.floor(p * depth + 1.5) + (Math.random() - 0.5) * roughness;
                        if(p < 0) p = 0;
                        if(p > 2) p = 2;
                        let o = h * p;
                        ctx.drawImage(grass, o, 0, h, h, (x + dx) * tileSize + margin + 0, (y + dy) * tileSize + margin + 0, h, h);
                    }
                }
            }
        }
    }


    function onCanvasClick(this: HTMLElement, event: MouseEvent)
    {
        let x = Math.floor((event.offsetX - margin)/tileSize);
        let y = Math.floor((event.offsetY - margin)/tileSize);
        if(x >= 0 && x < width && y >= 0 && y < width)
        {
            redraw();
        }
    }

    return {
        redraw,
    }
}

// Simple perlin noise for pretty grass
let gradient: [number, number][][]

function regenPerlin()
{
    gradient = [];
    for(let x=0; x < 10;x++) {
        gradient[x] = [];
        for(let y=0; y < 10;y++) {
            let angle = Math.random();
            let s = Math.sin(angle);
            let c = Math.cos(angle);
            gradient[x][y] = [s, c];
        }
    }
}


// Function to linearly interpolate between a0 and a1
// Weight w should be in the range [0.0, 1.0]
function lerp(a0: number, a1: number, w: number) {
    return (1.0 - w)*a0 + w*a1;
}

// Computes the dot product of the distance and gradient vectors.
function dotGridGradient(ix: number, iy: number, x: number, y: number): number
{
    let dx = x - ix;
    let dy = y - iy;
    return (dx*gradient[iy][ix][0] + dy*gradient[iy][ix][1]);
}

// Compute Perlin noise at coordinates x, y
function perlin(x: number, y: number) {

    // Determine grid cell coordinates
    let x0 = Math.floor(x);
    let x1 = x0 + 1;
    let y0 = Math.floor(y);
    let y1 = y0 + 1;

    // Determine interpolation weights
    // Could also use higher order polynomial/s-curve here
    let  sx = x - x0;
    let sy = y - y0;

    // Interpolate between grid point gradients
    let n0 = dotGridGradient(x0, y0, x, y);
    let n1 = dotGridGradient(x1, y0, x, y);
    let ix0 = lerp(n0, n1, sx);
    n0 = dotGridGradient(x0, y1, x, y);
    n1 = dotGridGradient(x1, y1, x, y);
    let ix1 = lerp(n0, n1, sx);
    let value = lerp(ix0, ix1, sy);

    return value;
}