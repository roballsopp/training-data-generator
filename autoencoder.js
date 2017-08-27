const path = require('path');

const config = require('./default.config');
const Markers = require('./markers');
const Audio = require('./audio');
const { AutoencoderExampleBuilder, AutoencoderWriter } = require('./training-ex-writers');

class AutoencoderDataGenerator {
	constructor({
		outputDir,
		lengthOut = config.trainingExampleLength, // in seconds
		labelRatio = 1.0, // how many labels to features to you want? 1 means the same number of labels as features, 0.5 means half, etc
		desiredNumExamples = 5000
	}) {
		this._outputDir = outputDir;
		this._lengthOut = lengthOut;
		this._labelRatio = labelRatio;
		this._desiredNumExamples = desiredNumExamples;
	}

	createTrainingData(audioFilePath, markerFilePath) {
		const audioDir = path.dirname(audioFilePath);
		const midiMapFilePath = path.join(audioDir, 'map.js');

		return Promise
			.all([
				Audio.load(audioFilePath),
				Markers.fromFile(markerFilePath, midiMapFilePath)
			])
			.then(([wavFile, markers]) => {
				const numFeatures = Math.round(wavFile.sampleRate * this._lengthOut);
				const numLabels = Math.round(numFeatures * this._labelRatio);

				console.info(`Audio info - Sample Rate: ${wavFile.sampleRate}`);

				const exampleBuilder = new AutoencoderExampleBuilder(wavFile, markers, this._desiredNumExamples, numFeatures, numLabels);
				const writer = new AutoencoderWriter(exampleBuilder);

				const relativeAudioDir = path.relative(process.cwd(), audioDir);
				const outputFolder = this._outputDir ? path.join(this._outputDir, relativeAudioDir) : audioDir;
				const outputFilePath = path.join(outputFolder, path.basename(audioFilePath));

				return writer.toFile(outputFilePath);
			});
	}
}

module.exports = AutoencoderDataGenerator;
