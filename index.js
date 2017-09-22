#!/usr/bin/env node

const commander = require('commander');
const glob = require('glob');
const path = require('path');
const Promise = require('bluebird');

const config = require('./default.config');
const SingleTransientDataGenerator = require('./single-trans');
const AutoencoderDataGenerator = require('./autoencoder');

let generator;

commander
	.version('0.0.1')
	.option('-a, --audio [string]', 'Specify the path or glob to the audio file(s)', '/**/*.wav')
	.option('-m, --markers [string]', 'Specify the path to the marker midi file', '/markers.mid')
	.option('-o, --output-dir [string]', 'Specify the output directory for the data files')
	.option('-s, --offset [number]', 'Specify the offset used from each marker to save the actual example data', 0)
	// TODO: changing the sample rate is not supported, don't know why i made it seem like it is
	.option('-r, --sample-rate [number]', 'Specify the sample rate of the training examples', config.sampleRateOut);

commander
	.command('single-trans')
	.description('create training examples in which each example is a single transient')
	.option('-l, --example-length [number]', 'Specify the length (ms) of each training example', config.trainingExampleLength)
	.option('-b, --example-buffer [number]', 'Specify the distance (in samples) a negative training example must be from all positive examples', config.minNegativeExampleBuffer)
	.action(function(options) {
		const sampleRateOut = options.parent.sampleRate;
		const millisecondsOut = options.exampleLength;
		const sampleLengthOut = Math.round(sampleRateOut * (millisecondsOut / 1000));
		const markerOffset = -parseInt(options.parent.offset);
		const minNegativeExampleBuffer = options.exampleBuffer;
		const outputDir = options.parent.outputDir;

		generator = new SingleTransientDataGenerator({ outputDir, minNegativeExampleBuffer, sampleLengthOut, markerOffset });
	});

commander
	.command('autoencoder')
	.description('create training examples in which the number of features equals the number of labels')
	.option('--num-features [number]', 'Specify the length (samples) of each feature set', 1024)
	.option('--num-labels [number]', 'Specify the length of each label set', 1024)
	.option('--late-marker-window [number]', 'Specify how much of the end of each label set to zero out', 0)
	.option('--num-examples [number]', 'Specify the desired number of examples to extract from the audio', config.numExamples)
	.action(function(options) {
		const numFeatures = parseInt(options.numFeatures);
		const numLabels = parseInt(options.numLabels);
		const desiredNumExamples = parseInt(options.numExamples);
		// how far forward in time to pad the audio signal, to effectively make the markers mark earlier than the actual transients
		const markerOffset = parseInt(options.parent.offset);
		const lateMarkerWindow = parseInt(options.lateMarkerWindow);
		const outputDir = options.parent.outputDir;

		generator = new AutoencoderDataGenerator({ outputDir, numFeatures, numLabels, desiredNumExamples, markerOffset, lateMarkerWindow });
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
