#!/usr/bin/env node

const commander = require('commander');
const glob = require('glob');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const nodeWav = require('node-wav');
const fsReadFile = Promise.promisify(fs.readFile);

const config = require('./default.config');
const Markers = require('./markers');
const TrainingExWriter = require('./training-ex-writer');

commander
	.version('0.0.1')
	.option('-a, --audio [string]', 'Specify the path or glob to the audio file(s)', '/**/*.wav')
	.option('-m, --markers [string]', 'Specify the path to the marker midi file', '/markers.mid')
	.option('-r, --sample-rate [number]', 'Specify the sample rate of the training examples', config.sampleRateOut)
	.option('-l, --example-length [number]', 'Specify the length (ms) of each training example', config.trainingExampleLength)
	.option('-b, --example-buffer [number]', 'Specify the distance (in samples) a negative training example must be from all positive examples', config.minNegativeExampleBuffer)
	.parse(process.argv);

const sampleRateOut = commander.sampleRate;
const millisecondsOut = commander.exampleLength;
const sampleLengthOut = Math.round(sampleRateOut * (millisecondsOut / 1000));
const minNegativeExampleBuffer = commander.exampleBuffer;
const audioPath = path.join(process.cwd(), commander.audio);
const markerPath = path.join(process.cwd(), commander.markers);

console.info(`Output info - Length: ${sampleLengthOut} (${millisecondsOut} ms), Sample Rate: ${sampleRateOut}`);

glob(audioPath, function (err, files) {
	if (err) return errAndExit(err);

	files.reduce((prevOp, filepath) => {
		return prevOp.then(() => createTrainingData(filepath, markerPath));
	}, Promise.resolve());
});

function createTrainingData(audioFilePath, markerFilePath) {
	if (!fs.existsSync(audioFilePath)) return errAndExit(`Cannot find audio file at ${audioFilePath}`);
	if (!fs.existsSync(markerFilePath)) return errAndExit(`Cannot find marker file at ${markerFilePath}`);

	const audioDir = path.dirname(audioFilePath);

	let midiMapFilePath = path.join(audioDir, 'map.js');
	if (!fs.existsSync(midiMapFilePath)) midiMapFilePath = path.join(__dirname, 'markers/default-midi-map.js');

	console.info(`Reading wav from ${audioFilePath}...`);

	return fsReadFile(audioFilePath)
		.then(nodeWav.decode)
		.then(wavFile => {
			console.info(`Loading markers from ${markerFilePath}...`);
			console.info(`Using midi map at ${midiMapFilePath}`);
			return Markers.fromFile(markerFilePath, midiMapFilePath, wavFile.sampleRate)
				.then(positiveMarkers => {
					console.info(`${positiveMarkers.length} positive markers loaded.`);

					console.info(`Generative negative markers...`);
					const negativeMarkers = Markers.generateNegativeMarkers(positiveMarkers, minNegativeExampleBuffer);
					console.info(`${negativeMarkers.length} negative markers generated`);

					const allMarkers = positiveMarkers.concat(negativeMarkers);

					const audioData = wavFile.channelData[0];

					const outputPath = path.join(audioDir, path.basename(audioFilePath));
					return TrainingExWriter.toFile(outputPath, audioData, allMarkers, sampleLengthOut);
				})
				.catch(err => console.error("ERROR", err));
		});
}

function errAndExit(err) {
	console.error(err);
	process.exit(1);
}
