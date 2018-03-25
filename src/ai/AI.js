import _ from 'lodash';

import Neuron from './Neuron';

export default class AI {
    genome = [];

    weights = [];

    generation = 0;

    score = 0;

    static GENOME_LENGTH = 42;
    static MUTATION_CHANCE = 0.2;
    static MUTATION_FACTOR = 0.01;

    inputLayer = [];
    middleLayer = [];
    outputLayer = [];

    constructor(generation, genome, inputLayerSize, middleLayerSize, outputLayerSize) {
        this.generation = generation;
        this.genome = genome;
        let neurons = _.map(_.range(inputLayerSize + middleLayerSize + outputLayerSize), (i) => {
            return new Neuron(genome[i % AI.GENOME_LENGTH]);
        });
        
        this.inputLayer = neurons.splice(0, inputLayerSize);
        this.middleLayer = neurons.splice(0, middleLayerSize);
        this.outputLayer = neurons.splice(0, outputLayerSize);

        _.each(this.inputLayer, (inputLayerNeuron, position) => {
            let chunkedMiddleLayer = _.chunk(this.middleLayer, 3);
            inputLayerNeuron.outputs = chunkedMiddleLayer[Math.floor(chunkedMiddleLayer.length / position)];
        });

        _.each(this.middleLayer, (middleLayerNeuron, position) => {
            middleLayerNeuron.outputs = this.outputLayer;
        });

    }

    combineGenome(otherGenome) {
        return _.map(this.genome, (gene, geneIndex) => {
            let mutation = 0;
            // mutation 
            if(Math.random() < AI.MUTATION_CHANCE) {
                // should be able to mutate positively or negatively
                mutation = (0.5 - Math.random()) * AI.MUTATION_FACTOR;
            }
            if(geneIndex / 2 === 0) {
                return _.clamp(this.genome[geneIndex] + mutation, 0, 1);
            } else {
                return _.clamp(otherGenome[geneIndex] + mutation, 0, 1);
            }
        });
    }

    reproduce(other) {
        return new AI(this.generation+1, this.combineGenome(other.genome), this.inputLayer.length, this.middleLayer.length, this.outputLayer.length);
    }


    static randomGenome() {
        return _.map(_.range(AI.GENOME_LENGTH), () => {
            return Math.random();
        });
    }

    executeTask(input) {
        // split the input array into chunks so we don't need to pass the *entire* input to every neuron
        let inputChunked = _.chunk(input, input.length / this.inputLayer.length);

        _.each(this.inputLayer, (inputNeuron, neuronIndex) => {
            inputNeuron.clearInput();
            _.each(inputChunked[neuronIndex], (inputItem) => {
                inputNeuron.addInput(inputItem);
                inputNeuron.trigger();
            });
        });
    }
}