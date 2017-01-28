const fs = require('fs');
const Promise = require('bluebird');
const nodeWav = require('node-wav');
const fsReadFile = Promise.promisify(fs.readFile);
const fsWriteFile = Promise.promisify(fs.writeFile, { multiArgs: true });

const config = require('./default.config');
const Markers = require('./markers');
const TrainingExWriter = require('./training-ex-writer');

const sampleRateOut = config.sampleRateOut;
const millisecondsOut = config.trainingExampleLength;
const sampleLengthOut = Math.round(sampleRateOut * (millisecondsOut / 1000));
const minNegativeExampleBuffer = config.minNegativeExampleBuffer;

const audioPath = `${__dirname}/training_data/avatar/kit1/mono_dry.wav`;
const markerPath = `${__dirname}/training_data/avatar/avatar_markers.mid`;
const midiMapPath = `${__dirname}/training_data/avatar/kit1/map.js`;
const defaultMidiMapPath = `${__dirname}/markers/default-midi-map.js`;
const outputPath = `${__dirname}/training_data/avatar/kit1`;

console.info(`Output info - Length: ${sampleLengthOut} (${millisecondsOut} ms), Sample Rate: ${sampleRateOut}`);
console.info(`Reading wav from ${audioPath}...`);

fsReadFile(audioPath)
	.then(nodeWav.decode)
	.then(wavFile => {
		console.info(`Loading markers from ${markerPath}...`);
		return Markers.fromFile(markerPath, midiMapPath, wavFile.sampleRate)
			.then(positiveMarkers => {
				console.info(`${positiveMarkers.length} positive markers loaded.`);

				console.info(`Generative negative markers...`);
				const negativeMarkers = Markers.generateNegativeMarkers(positiveMarkers, minNegativeExampleBuffer);
				console.info(`${negativeMarkers.length} negative markers generated`);

				const allMarkers = positiveMarkers.concat(negativeMarkers);

				const audioData = wavFile.channelData[0];
				return TrainingExWriter.toFile(outputPath, audioData, allMarkers, sampleLengthOut);
			})
			.catch(err => console.error("ERROR", err));
	});

function saveTransientAt(channelData, samplePosition, fileName) {
	const sampleData = channelData.slice(samplePosition, samplePosition + sampleLengthOut);
	const buffer = nodeWav.encode([sampleData], { sampleRate: sampleRateOut, float: false, bitDepth: 24 });

	return fsWriteFile(fileName, buffer);
}