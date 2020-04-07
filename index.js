const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 3;
const cellsVertical = 3;
const width = window.innerWidth;
const height = window.innerHeight;

//length/width of one cell
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;

const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);


//Walls
const walls = [
    //top
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    //bottom
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    //left
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    //right
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);

const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
};

//create grid

const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsVertical - 1).fill(false));

const horizontals = Array(cellsHorizontal - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const movement = (row, column) => {
    //if cell visited at [row, column], then return
    if (grid[row][column]) {
        return;
    }

    //Mark cell as visited
    grid[row][column] = true;
    
    //assemble randomly ordered list of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);
    
    //for each neighbor
    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;
    
    //check if neighbor is out of bounds
        if(nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal){
            continue;
        }
    
    //if we have visited that neighbor, continue to next neighbor
        if(grid[nextRow][nextColumn]) {
            continue;
        }
    
    //remove a wall
        if(direction === 'left') {
            verticals[row][column - 1] = true;
        } else if(direction === 'right') {
            verticals[row][column] = true;
        } else if(direction === 'up') {
            horizontals[row - 1][column] = true;
        } else if(direction === 'down') {
            horizontals[row][column] = true;
        }
        movement(nextRow, nextColumn);
    }


    
    //visit next cell
}

movement(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open) {
            return;
        }

        const wall  = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'white'
                }
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            5,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'white'
                }
            }
        );
        World.add(world, wall);
    });
})

//end goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .7,
    unitLengthY * .7,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'green'
        }
    }
);
World.add(world, goal);

//ball marker
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
    label: 'ball',
    render: {
        fillStyle: 'orange'
    }
});
World.add(world, ball);

document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;
    if(event.keyCode === 38 || event.keyCode === 87) {
        Body.setVelocity(ball, { x, y: y - 5 });
    }
    if(event.keyCode === 39 || event.keyCode === 68) {
        Body.setVelocity(ball, { x: x + 5, y });
    }
    if(event.keyCode === 40 || event.keyCode === 83) {
        Body.setVelocity(ball, { x, y: y + 5 });
    }
    if(event.keyCode === 37 || event.keyCode === 65) {
        Body.setVelocity(ball, { x: x - 5, y});
    } 
});

//Detect win || contact

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];

        if(
            labels.includes(collision.bodyA.label) && 
            labels.includes(collision.bodyB.label)
            ) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if(body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            });
        }
    });
});