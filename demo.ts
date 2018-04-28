function setupDemo2(imagePath: string)
{
    // Setup canvas
    let canvas = <HTMLCanvasElement>document.getElementById('canvas');
    let endpointsInput = <HTMLInputElement>document.getElementById('endpoints');
    let countInput = <HTMLInputElement>document.getElementById('count');
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
    let exits: boolean[][] = [];
    for(let x=0;x<width;x++)
    {
        exits[x] = [];
        for(let y=0;y<height;y++) 
        {
            exits[x][y] = false;
        }
        
    }
    exits[3][3] = true;
    exits[width-4][height-4] = true;

    function redraw()
    {
        let count = countInput.valueAsNumber;
        let endpoints = endpointsInput.checked;
        countInput.hidden = endpoints;

        // Recompute path
        let walkable: boolean[][] = [];
        for(let x=0;x<width;x++)
        {
            walkable[x] = [];
            for(let y=0;y<height;y++)
                walkable[x][y] = true;
        }
        if (endpoints)
        {
            walkable = randomPath(width, height, walkable, exits)
        } else {
            walkable = randomConnectedSet(width, height, walkable, count)
        }


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
                let h = tileSize / 2;
                ctx.drawImage(grass, 0, 0, h, h, x * tileSize + margin + 0, y * tileSize + margin + 0, h, h);
                ctx.drawImage(grass, 0, 0, h, h, x * tileSize + margin + h, y * tileSize + margin + 0, h, h);
                ctx.drawImage(grass, 0, 0, h, h, x * tileSize + margin + 0, y * tileSize + margin + h, h, h);
                ctx.drawImage(grass, 0, 0, h, h, x * tileSize + margin + h, y * tileSize + margin + h, h, h);
            }
            if(endpoints && exits[x][y])
            {
                let h = tileSize / 2;
                ctx.drawImage(sign, 0, 0, h, h, x * tileSize + margin + h / 2, y * tileSize + margin + h / 2, h, h);
            }
        }
    }


    function onCanvasClick(this: HTMLElement, event: MouseEvent)
    {
        let x = Math.floor((event.offsetX - margin)/tileSize);
        let y = Math.floor((event.offsetY - margin)/tileSize);
        if(x >= 0 && x < width && y >= 0 && y < width)
        {
            let endpoints = endpointsInput.checked;
            if (endpoints) {
                exits[x][y] = !exits[x][y];
            }
            redraw();
        }
    }

    return {
        redraw,
    }
}