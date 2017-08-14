const path = require('path');

const config = require('./default.config');
const Markers = require('./markers');
const Audio = require('./audio');
const { AutoencoderExampleBuilder, AutoencoderWriter } = require('./training-ex-writers');

class AutoencoderDataGenerator {
	constructor({
								outputDir,
								lengthOut = config.trainingExampleLength, // in seconds
								sampleRateOut = config.sampleRateOut,
								desiredNumExamples = 5000
	}) {
		this._outputDir = outputDir;
		this._sampleLengthOut = Math.round(sampleRateOut * lengthOut);
		this._desiredNumExamples = desiredNumExamples;
	}

	createTrainingData(audioFilePath, markerFilePath) {
		return Audio
			.load(audioFilePath)
			.then(wavFile => {
				const audioDir = path.dirname(audioFilePath);
				const midiMapFilePath = path.join(audioDir, 'map.js');
				return Markers
					.fromFile(markerFilePath, midiMapFilePath, wavFile.sampleRate)
					.then(markers => {
						const audioData = wavFile.channelData[0];
						const exampleBuilder = new AutoencoderExampleBuilder(audioData, markers, this._desiredNumExamples, this._sampleLengthOut);
						const writer = new AutoencoderWriter(exampleBuilder);

						const cwdParentDir = path.join(process.cwd(), '..');
						const relativeAudioDir = path.relative(cwdParentDir, audioDir);
						const outputFolder = this._outputDir ? path.join(this._outputDir, relativeAudioDir) : audioDir;
						const outputFilePath = path.join(outputFolder, path.basename(audioFilePath));

						writer.toFile(outputFilePath);
					});
			});
	}
}

module.exports = AutoencoderDataGenerator;
