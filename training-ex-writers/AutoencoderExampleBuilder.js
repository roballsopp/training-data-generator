function convertMarkersToLabelArray(markers, length) {
	const labelBuffer = new Float32Array(length);

	for (let i = 0, l = markers.length; i < l; i++) {
		const marker = markers[i];
		labelBuffer[marker.pos] = 1;
	}

	return labelBuffer;
}

// calculate a position offset that evenly spaces examples through the available
// length of the audio, overlapping or spacing examples as necessary
function calcExampleOffset(numFeatures, numExamples, availableSpace) {
	const neededSpace = numFeatures * numExamples;
	const overlap = (neededSpace - availableSpace) / (numExamples - 1);
	const offset = numFeatures - overlap;

	if (offset < 1) {
		console.warn(`Not enough space available in audio for ${numExamples} unique examples.`);
		return 1;
	}

	return Math.floor(offset);
}

function calcNumExamplesFromOffset(numFeatures, exampleOffset, availableSpace) {
	return Math.floor((availableSpace - numFeatures + exampleOffset) / exampleOffset);
}

class AutoencoderExampleBuilder {
	constructor(audioBuffer, markers, desiredNumExamples, numFeatures) {
		this._audioBuffer = audioBuffer;
		this._labelBuffer = convertMarkersToLabelArray(markers, audioBuffer.length);
		// number of samples to use for each training example
		this._numFeatures = numFeatures;
		this._exampleOffset = calcExampleOffset(numFeatures, desiredNumExamples, audioBuffer.length);
		this._numExamples = calcNumExamplesFromOffset(numFeatures, this._exampleOffset, audioBuffer.length);
		this._currentExample = 0;

		console.info(`Example overlap is ${numFeatures - this._exampleOffset}`);

		this.hasNext = this.hasNext.bind(this);
		this.getNextExample = this.getNextExample.bind(this);
		this.reset = this.reset.bind(this);
	}

	get numExamples () {
		return this._numExamples;
	};

	get exampleLength () {
		return this._numFeatures;
	};

	hasNext () {
		return this._currentExample < this._numExamples;
	};

	getNextExample () {
		const startPos = this._currentExample * this._exampleOffset;
		const endPos = startPos + this._numFeatures;
		const features = this._audioBuffer.slice(startPos, endPos);
		const labels = this._labelBuffer.slice(startPos, endPos);
		this._currentExample++;
		return [features, labels];
	};

	reset () {
		this._currentExample = 0;
	}
}

module.exports = AutoencoderExampleBuilder;