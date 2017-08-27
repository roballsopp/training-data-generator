const path = require('path');

const config = require('./default.config');
const Markers = require('./markers');
const Audio = require('./audio');
const { AutoencoderExampleBuilder, AutoencoderWriter } = require('./training-ex-writers');

class AutoencoderDataGenerator {
	constructor({
								outputDir,
								lengthOut = config.trainingExampleLength, // in seconds
								desiredNumExamples = 5000
	}) {
		this._outputDir = outputDir;
		this._lengthOut = lengthOut;
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
				const sampleLengthOut = Math.round(wavFile.sampleRate * this._lengthOut);

				console.info(`Output info - Length: ${sampleLengthOut} (${this._lengthOut}s), Sample Rate: ${wavFile.sampleRate}`);

				const markersList = markers.getSamplePosList(wavFile.sampleRate);
				const audioData = wavFile.channelData[0];
				const exampleBuilder = new AutoencoderExampleBuilder(audioData, markersList, this._desiredNumExamples, sampleLengthOut);
				const writer = new AutoencoderWriter(exampleBuilder);

				const relativeAudioDir = path.relative(process.cwd(), audioDir);
				const outputFolder = this._outputDir ? path.join(this._outputDir, relativeAudioDir) : audioDir;
				const outputFilePath = path.join(outputFolder, path.basename(audioFilePath));

				return writer.toFile(outputFilePath);
			});
	}
}

module.exports = AutoencoderDataGenerator;
