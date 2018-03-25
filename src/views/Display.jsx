import React, { Component } from 'react';
import _ from 'lodash';

const aspectRatio = 1.77;

const allowedResolutions = [
    [960, 540],
    [1280, 720],
    [1920, 1080]
];

let getBestResolution = () => {
    let bestRes = _.reduce(allowedResolutions, (bestCandidate, candidate) => {
        if(candidate[0] < window.innerWidth && 
            candidate[1] < window.innerHeight &&
            candidate[0] > bestCandidate[0] &&
            candidate[1] > bestCandidate[1]) {
            return candidate;
        } else {
            return bestCandidate;
        }
    }, [0,0]);

    if(bestRes[0] === 0 || bestRes[1] === 0) {
        throw new Error('Screen/window too small to run AI Playground');
    }

    return {
        width: bestRes[0],
        height: bestRes[1]
    };
}

class Display extends Component {
    state = {
        error: null
    }

    componentDidMount() {
        this.initCanvas();
    }

    initCanvas() {
        let cvs = this.refs.canvasView;
        let ctx = cvs.getContext('2d');

        try {
            let {width, height} = getBestResolution();
        
            cvs.width = width;
            cvs.height = height;
    
            ctx.fillStyle = "#000";
            ctx.fillRect(0,0,width,height);

            this.props.game.run(ctx);
        } catch (ex) {
            console.trace(ex);
            this.setState({
                error: ex
            });
        }

    }

    render() { 
        return ( 
            <div className="Display">
                {this.state.error && <div className="Error">{this.state.error.toString()}</div>}
                <canvas ref="canvasView" />
            </div>
         );
    }
}
 
export default Display;