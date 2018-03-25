import _ from 'lodash';

export default class Neuron {

    static TRIGGER_THRESHOLD = 0.5;

    outputs = []

    value = 0;

    inputs = []

    weight = 0

    constructor(weight) {
        this.weight = weight;
    }

    addInput(input) {
        this.inputs.push(input);
    }

    clearInput() {
        this.inputs = [];
        // recurse down the tree so we clear *all* inputs when clearInput is called
        _.each(this.outputs, (outputNeuron) => {
            outputNeuron.clearInput();
        });
    }

    trigger() {
        let input = _.mean(this.inputs);
        let v = (input * this.weight) + 0.005;

        _.each(this.outputs, (outputNeuron) => {
            outputNeuron.addInput(v);
            outputNeuron.trigger();
        });

        this.value = v;

        return v;
    }

}