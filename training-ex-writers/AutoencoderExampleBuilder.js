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
	constructor(wavFile, markers, desiredNumExamples, numFeatures, numLabels = numFeatures) {
		this._audioBuffer = wavFile.channelData[0];

		// we might train the autoencoder to output a different number of labels than features for performance reasons
		const labelFeatureRatio = numLabels / numFeatures;
		// when we are calculating the positions of the markers, well need to use this ratio'd sample rate
		const labelSampleRate = labelFeatureRatio * wavFile.sampleRate;
		const labelBufferLength = Math.ceil(labelFeatureRatio * this._audioBuffer.length);
		const markersList = markers.getSamplePosList(labelSampleRate);

		this._labelBuffer = convertMarkersToLabelArray(markersList, labelBufferLength);
		// number of samples to use for each training example
		this._numFeatures = numFeatures;
		this._numLabels = numLabels;
		this._featureSetOffset = calcExampleOffset(numFeatures, desiredNumExamples, this._audioBuffer.length);
		this._labelSetOffset = this._featureSetOffset * labelFeatureRatio;
		this._numExamples = calcNumExamplesFromOffset(numFeatures, this._featureSetOffset, this._audioBuffer.length);
		this._currentExample = 0;

		console.info(`Example overlap is ${numFeatures - this._featureSetOffset}`);

		this.hasNext = this.hasNext.bind(this);
		this.getNextExample = this.getNextExample.bind(this);
		this.reset = this.reset.bind(this);
	}

	get numExamples () {
		return this._numExamples;
	};

	get numFeatures () {
		return this._numFeatures;
	};

	get numLabels () {
		return this._numLabels;
	}

	hasNext () {
		return this._currentExample < this._numExamples;
	};

	getNextExample () {
		const featureSetStartPos = this._currentExample * this._featureSetOffset;
		const featureSetEndPos = featureSetStartPos + this._numFeatures;
		const features = this._audioBuffer.slice(featureSetStartPos, featureSetEndPos);

		const labelSetStartPos = this._currentExample * this._labelSetOffset;
		const labelSetEndPos = labelSetStartPos + this._numLabels;
		const labels = this._labelBuffer.slice(labelSetStartPos, labelSetEndPos);

		this._currentExample++;

		return [features, labels];
	};

	reset () {
		this._currentExample = 0;
	}
}

module.exports = AutoencoderExampleBuilder;