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
		desiredNumExamples = 5000
	}) {
		this._outputDir = outputDir;
		this._numFeatures = numFeatures;
		this._numLabels = numLabels;
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
				console.info(`Audio info - Sample Rate: ${wavFile.sampleRate}`);

				const exampleBuilder = new AutoencoderExampleBuilder(wavFile, markers, this._desiredNumExamples, this._numFeatures, this._numLabels);
				const writer = new AutoencoderWriter(exampleBuilder);

				const relativeAudioDir = path.relative(process.cwd(), audioDir);
				const outputFolder = this._outputDir ? path.join(this._outputDir, relativeAudioDir) : audioDir;
				const outputFilePath = path.join(outputFolder, path.basename(audioFilePath));

				return writer.toFile(outputFilePath);
			});
	}
}

module.exports = AutoencoderDataGenerator;
