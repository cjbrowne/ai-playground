import React, { Component } from 'react';
import _ from 'lodash';

import Display from './views/Display';

import AI from './ai/AI';
import Game from './game/Game';

const AI_UPDATE_FREQUENCY_MS = 100;
// each AI gets 5 seconds to try to score as high as possible
const AI_TURN_LENGTH_MS = 5000;

// the number of ais per generation
const aiPerGeneration = 10;

// input neurons
const inputNeurons = 4000;
// middle neurons
const middleNeurons = 2;
// output neurons
const outputNeurons = 1;

class App extends Component {

  lastAIUpdateTimestamp = 0;

  lastAITurnTimestamp = 0;

  generations = [[]];
  
  currentAI = new AI(0, AI.randomGenome(), inputNeurons, middleNeurons, outputNeurons);
  generation = 0

  constructor() {
    super();
    this.state = {
      currentOutput: "n/a",
      currentInput: "n/a",
      currentMiddle: "n/a",
      error: null
    }
    this.game = new Game();

    let tick = (timestamp) => {
      this.setState({
        currentOutput: _.join(_.map(this.currentAI.outputLayer, n=>n.value.toFixed(2)), ','),
        currentMiddle: _.join(_.map(this.currentAI.middleLayer, n=>n.value.toFixed(2)), ','),
        currentInput: _.join(_.map(this.currentAI.inputLayer, n=>n.value.toFixed(2)), ',')
      });
      
      if(timestamp - this.lastAIUpdateTimestamp > AI_UPDATE_FREQUENCY_MS) {
        try {
          this.game.updateAI(this.currentAI);
        } catch (ex) {
          this.setState({
            error: ex.toString()
          });
        }
      }

      if(timestamp - this.lastAITurnTimestamp > AI_TURN_LENGTH_MS) {
        if(this.generations[this.generation].length >= aiPerGeneration) {
          this.generation++;
          this.generations[this.generation] = [];
        }
        this.generations[this.generation].push(this.currentAI);
        if(this.generation === 0) {
          this.currentAI = new AI(this.generation, AI.randomGenome(), inputNeurons, middleNeurons, outputNeurons);
        } else {
          let lastGenByScore =  _.sortBy(this.generations[this.generation-1], 'score');
          let lastGenEvolved = _.slice(lastGenByScore, 0, lastGenByScore.length / 2);
          // TODO: currently possible that mum and dad are the same AI (we should remove that possibility)
          let mum = lastGenEvolved[Math.floor(Math.random() * lastGenEvolved.length)];
          let dad = lastGenEvolved[Math.floor(Math.random() * lastGenEvolved.length)];

          this.currentAI = dad.reproduce(mum);
        }
        // reset the game field for the new AI
        this.game.reset();
        this.lastAITurnTimestamp = timestamp;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }



  render() {
    let genomeString = (genomeArray) => {
      let alphabet = "abcdefghijklmnopqrstuvwxyz";
      return _.map(genomeArray, (gene) => {
        return alphabet[Math.round(gene * alphabet.length)];
      });
    }

    return (
      <div className="App">
        <div className="ColumnLeft">
          <div className="Error">
            <h1>Notices</h1>
            {this.state.error}
          </div>
          <div className="AIInfo">
            <h1>AI Info</h1>
            <ul className="AIInfoList">
              <li>Generation: {this.generation}</li>
              <li>Genome Length: {AI.GENOME_LENGTH}</li>
              <li>Current Genome: <br />{genomeString(this.currentAI.genome)}</li>
              <li>Current Input: <br/>{this.state.currentInput}</li>
              <li>Input Weights: <br/>{_.join(_.map(this.currentAI.inputLayer, (n) => n.weight.toFixed(2)), ',')}</li>
              <li>Current Middle Layer: <br/>{this.state.currentMiddle}</li>
              <li>Middle Weights: <br/>{_.join(_.map(this.currentAI.middleLayer, (n) => n.weight.toFixed(2)), ',')}</li>
              <li>Current Output: <br />{this.state.currentOutput}</li>
              <li>Output Weights: <br/>{_.join(_.map(this.currentAI.outputLayer, (n) => n.weight.toFixed(2)), ',')}</li>
              <li>Score: {this.currentAI.score}</li>
            </ul>
          </div>
        </div>
        <div className="ColumnCenter">
          <Display ai={this.ai} game={this.game} />
        </div>
        <div className="ColumnRight">
        </div>
      </div>
    );
  }
}

export default App;
