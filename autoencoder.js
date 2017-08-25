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
		return Audio
			.load(audioFilePath)
			.then(wavFile => {
				const audioDir = path.dirname(audioFilePath);
				const midiMapFilePath = path.join(audioDir, 'map.js');
				const sampleLengthOut = Math.round(wavFile.sampleRate * this._lengthOut);

				console.info(`Output info - Length: ${sampleLengthOut} (${this._lengthOut}s), Sample Rate: ${wavFile.sampleRate}`);

				return Markers
					.fromFile(markerFilePath, midiMapFilePath, wavFile.sampleRate)
					.then(markers => {
						const audioData = wavFile.channelData[0];
						const exampleBuilder = new AutoencoderExampleBuilder(audioData, markers, this._desiredNumExamples, sampleLengthOut);
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
