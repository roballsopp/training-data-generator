#!/usr/bin/env node

const commander = require('commander');
const glob = require('glob');
const path = require('path');
const Promise = require('bluebird');

const config = require('./default.config');
const SingleTransientDataGenerator = require('./single-trans');

let generator;

commander
	.version('0.0.1')
	.option('-a, --audio [string]', 'Specify the path or glob to the audio file(s)', '/**/*.wav')
	.option('-m, --markers [string]', 'Specify the path to the marker midi file', '/markers.mid')
	.option('-o, --output-dir [string]', 'Specify the output directory for the data files')
	.option('-r, --sample-rate [number]', 'Specify the sample rate of the training examples', config.sampleRateOut);

commander
	.command('single-trans')
	.description('create training examples in which each example is a single transient')
	.option('-l, --example-length [number]', 'Specify the length (ms) of each training example', config.trainingExampleLength)
	.option('-s, --offset [number]', 'Specify the offset used from each marker to save the actual example data', 0)
	.option('-b, --example-buffer [number]', 'Specify the distance (in samples) a negative training example must be from all positive examples', config.minNegativeExampleBuffer)
	.action(function(options) {
		const sampleRateOut = options.parent.sampleRate;
		const millisecondsOut = options.exampleLength;
		const sampleLengthOut = Math.round(sampleRateOut * (millisecondsOut / 1000));
		const markerOffset = -parseInt(options.offset);
		const minNegativeExampleBuffer = options.exampleBuffer;
		const outputDir = options.parent.outputDir;

		console.info(`Output info - Length: ${sampleLengthOut} (${millisecondsOut} ms), Sample Rate: ${sampleRateOut}`);

		generator = new SingleTransientDataGenerator({ outputDir, minNegativeExampleBuffer, sampleLengthOut, markerOffset });
	});

commander
	.parse(process.argv);

const audioPath = path.join(process.cwd(), commander.audio);
const markerPath = path.join(process.cwd(), commander.markers);

glob(audioPath, function (err, files) {
	if (err) return errAndExit(err);

	const promise = files.reduce((prevOp, filepath) => {
		return prevOp.then(() => generator.createTrainingData(filepath, markerPath));
	}, Promise.resolve());

	promise
		.catch(err => console.error("ERROR", err))
});

function errAndExit(err) {
	console.error(err);
	process.exit(1);
}
