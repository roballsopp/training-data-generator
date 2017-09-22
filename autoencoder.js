const path = require('path');

const config = require('./default.config');
const Markers = require('./markers');
const Audio = require('./audio');
const { AutoencoderExampleBuilder, AutoencoderWriter } = require('./training-ex-writers');

class AutoencoderDataGenerator {
	constructor({
		outputDir,
		numFeatures = config.trainingExampleLength, // in samples
		numLabels = numFeatures,
		desiredNumExamples = 5000,
		markerOffset = 0,
		lateMarkerWindow = 0
	}) {
		this._outputDir = outputDir;
		this._numFeatures = numFeatures;
		this._numLabels = numLabels;
		this._desiredNumExamples = desiredNumExamples;
		this._markerOffset = markerOffset;
		this._lateMarkerWindow = lateMarkerWindow;
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
				console.info(`Audio info - Sample Rate: ${wavFile.sampleRate}`);

				const exampleBuilder = new AutoencoderExampleBuilder(wavFile, markers, this._desiredNumExamples, this._numFeatures, this._numLabels, this._markerOffset, this._lateMarkerWindow);
				const writer = new AutoencoderWriter(exampleBuilder);

				const relativeAudioDir = path.relative(process.cwd(), audioDir);
				const outputFolder = this._outputDir ? path.join(this._outputDir, relativeAudioDir) : audioDir;
				const outputFilePath = path.join(outputFolder, path.basename(audioFilePath));

				return writer.toFile(outputFilePath);
			});
	}
}

module.exports = AutoencoderDataGenerator;
