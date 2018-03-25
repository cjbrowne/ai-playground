import _ from 'lodash';

// tiles
const MAP_WIDTH = 128;
const MAP_HEIGHT = 72;

// pixels
const AI_WIDTH = 24;
const AI_HEIGHT = 24;

// colors
const foodColor = "#0f0";
const aiColor = "#00f";

// cell contents enum (ish)
const CELL_CONTENTS = {
    FOOD: Symbol('FOOD'),
    EMPTY: Symbol('EMPTY'),
    AI: Symbol('AI')
};

// configuration
const foodSpawnChance = 0.0001;
const playerSpawnPoint = (MAP_WIDTH * MAP_HEIGHT) / 2 + MAP_WIDTH / 2;
const MAP_UPDATE_FREQUENCY_MS = 1000;

// directional enum
const DIRECTIONS = {
    LEFT: Symbol('LEFT'),
    RIGHT: Symbol('RIGHT'),
    UP: Symbol('UP'),
    DOWN: Symbol('DOWN'),
    NONE: Symbol('NONE')
}

export default class Game {

    foodLocations = [];

    context = null;

    map = [];

    lastMapUpdateTimestamp = 0;

    aiIndex = playerSpawnPoint;

    run(context) {
        this.context = context;
        this.context.width = context.canvas.width;
        this.context.height = context.canvas.height;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = context.canvas.width;
        this.offscreenCanvas.height = context.canvas.height;

        this.offscreenContext = this.offscreenCanvas.getContext('2d');
        this.offscreenContext.width = this.offscreenCanvas.width;
        this.offscreenContext.height = this.offscreenCanvas.height;
        
        this.map = this.generateMap();

        requestAnimationFrame(this.tick.bind(this));
    }

    reset() {
        this.map = this.generateMap();
        this.aiIndex = playerSpawnPoint;
        this.foodLocations = [];
        this.lastMapUpdateTimestamp = 0;
    }

    generateMap() {
        let mapFirstPass = _.map(_.range(MAP_WIDTH * MAP_HEIGHT), (mapCellIndex) => {
            return {
                x: Math.round((mapCellIndex % MAP_WIDTH) * (this.context.width / MAP_WIDTH)),
                y: Math.round(Math.floor(mapCellIndex / MAP_WIDTH) * (this.context.height / MAP_HEIGHT)),
                index: mapCellIndex,
                contents: (
                    mapCellIndex == playerSpawnPoint ?
                        CELL_CONTENTS.AI :
                        (Math.random() < foodSpawnChance) ? CELL_CONTENTS.FOOD : CELL_CONTENTS.EMPTY)
            };
        });

        return _.map(mapFirstPass, (cell, index) => {
            cell.neighbours = {
                [DIRECTIONS.UP]: index - MAP_WIDTH > 0 ? mapFirstPass[index - MAP_WIDTH] : null,
                [DIRECTIONS.LEFT]: (index - 1) % MAP_WIDTH != MAP_WIDTH - 1 ? mapFirstPass[index - 1] : null,
                [DIRECTIONS.RIGHT]: (index + 1) % MAP_WIDTH != 0 ? mapFirstPass[index + 1] : null,
                [DIRECTIONS.DOWN]: (index + MAP_WIDTH) < MAP_HEIGHT * MAP_WIDTH ? mapFirstPass[index + MAP_WIDTH] : null
            }
            return cell;
        });
    }

    renderMap() {
        let c = this.offscreenContext;

        c.save();

        c.clearRect(0, 0, c.width, c.height);
       
        _.each(this.map, (cell) => {
            let cellWidth = c.width / MAP_WIDTH;
            let cellHeight = c.height / MAP_HEIGHT;
            
            switch(cell.contents) {
                case CELL_CONTENTS.AI:
                    c.fillStyle = aiColor;
                    break;
                case CELL_CONTENTS.FOOD:
                    c.fillStyle = foodColor;
                    break;
                case CELL_CONTENTS.EMPTY:
                default:
                    // skip the draw call if the cell is empty
                    return;
            }

            c.fillRect(cell.x, cell.y, cellWidth, cellHeight);
        });

        c.restore();
    }

    updateMap() {
        _.each(this.map, (cell) => {
            if(cell.contents === CELL_CONTENTS.AI) return;
            if(Math.random() < foodSpawnChance) {
                cell.contents = CELL_CONTENTS.FOOD;
            }
        })
    }

    updateAI(ai) {
        let input = _.map(this.map, (cell) => {
            switch(cell.contents) {
                case CELL_CONTENTS.EMPTY:
                    return 50;
                case CELL_CONTENTS.FOOD:
                    return 100;
                case CELL_CONTENTS.AI:
                    return 0;
            }
        });
        ai.executeTask(input);

        let direction = Math.floor(ai.outputLayer[0].value) % 4;
        // now we should have a number between 0 and 3 (inclusive).  From that we can determine which direction the AI "wants" to go in.
        let moveAndScore = (dir) => {
            let nextCell = this.peek(dir, this.aiIndex);

            if(nextCell.contents === CELL_CONTENTS.FOOD) {
                ai.score += 1;
            }

            this.aiIndex = this.move(CELL_CONTENTS.AI, this.aiIndex, dir);
        }
        
        switch(direction) {
            case 0:
                moveAndScore(DIRECTIONS.UP);
                break;
            case 1:
                moveAndScore(DIRECTIONS.RIGHT);
                break;
            case 2:
                moveAndScore(DIRECTIONS.DOWN);
                break;
            case 3:
                moveAndScore(DIRECTIONS.LEFT);
                break;
        }

    }

    peek(direction, index) {
        return this.map[index].neighbours[direction] || this.map[index];
    }

    move(contents, index, direction) {

        if(this.map[index].neighbours[direction] !== null) {
            this.map[index].neighbours[direction].contents = contents;
            this.map[index].contents = CELL_CONTENTS.EMPTY;
            return this.map[index].neighbours[direction].index;
        }

        return index;
    }

    tick(timestamp) {
        if(timestamp - this.lastMapUpdateTimestamp > MAP_UPDATE_FREQUENCY_MS) {
            this.updateMap();
            this.lastMapUpdateTimestamp = timestamp;
        }

        this.renderMap();

        this.context.save();
        this.context.fillRect(0, 0, this.context.width, this.context.height);
        // flip offscreen to onscreen
        this.context.drawImage(this.offscreenCanvas, 0, 0);
        this.context.restore();

        requestAnimationFrame(this.tick.bind(this));
    }
}