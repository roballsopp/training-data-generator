const path = require('path');

const config = require('./default.config');
const Markers = require('./markers');
const Audio = require('./audio');
const { SingleTransientWriter } = require('./training-ex-writers');

class SingleTransientDataGenerator {
	constructor({
								outputDir,
								minNegativeExampleBuffer = config.minNegativeExampleBuffer,
								sampleLengthOut = Math.round(config.sampleRateOut * (config.trainingExampleLength / 1000)),
								markerOffset = 0
	}) {
		this._outputDir = outputDir;
		this._minNegativeExampleBuffer = minNegativeExampleBuffer;
		this._sampleLengthOut = sampleLengthOut;
		this._markerOffset = markerOffset;
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
				const positiveMarkers = markers.getSamplePosList(wavFile.sampleRate);
				const negativeMarkers = Markers.generateNegativeMarkers(positiveMarkers, this._minNegativeExampleBuffer);
				const allMarkers = positiveMarkers.concat(negativeMarkers);

				const audioData = wavFile.channelData[0];

				const writer = new SingleTransientWriter(audioData, allMarkers);

				const cwdParentDir = path.join(process.cwd(), '..');
				const relativeAudioDir = path.relative(cwdParentDir, audioDir);
				const outputFolder = this._outputDir ? path.join(this._outputDir, relativeAudioDir) : audioDir;
				const outputFilePath = path.join(outputFolder, path.basename(audioFilePath));

				return writer
					.transform(Audio.reversePolarity)
					.toFile(outputFilePath, this._sampleLengthOut, this._markerOffset);
			});
	}
}

module.exports = SingleTransientDataGenerator;
