const fs = require('fs');
const TrainingDataHeader = require('./TrainingDataHeader');
const { NUM_ARTICULATIONS } = require('../markers/midi-map.config');

class TrainingExWriter {
	constructor(audioData, exampleMarkers) {
		this._audioData = audioData;
		this._exampleMarkers = exampleMarkers;
		this._transformers = [a => a];
	}

	transform(transformer) {
		if (typeof transformer !== 'function') throw new Error('Transformer must be a function');
		this._transformers.push(transformer);
		return this;
	}

	toFile(outputPath, exampleLength, markerOffset = 0) {
		const XFilePath = `${outputPath}_X.dat`;
		const numExamplesToBeWritten = this._exampleMarkers.length * this._transformers.length;

		console.info(`Writing ${numExamplesToBeWritten} training examples of sample length ${exampleLength}, with marker offset ${markerOffset} to ${XFilePath}`);

		const fd = fs.openSync(XFilePath, 'w');

		const header = new TrainingDataHeader({
			numFeatures: exampleLength,
			numLabels: NUM_ARTICULATIONS,
			numExamples: numExamplesToBeWritten,
			labelOffset: markerOffset
		});

		const headerBuf = header.toBuffer();

		fs.writeSync(fd, headerBuf, 0, headerBuf.byteLength);

		this._transformers.forEach(transformer => {
			const transformedAudioData = transformer(this._audioData);

			this._exampleMarkers.forEach(marker => {
				const start = (markerOffset + marker.pos) * transformedAudioData.BYTES_PER_ELEMENT;
				const length = exampleLength * transformedAudioData.BYTES_PER_ELEMENT;

				if (start < 0) return;

				// data in transformedAudioData is stored in whatever byte order the machine natively uses
				// this whole file format counts on little endian, which this machine happens to be, but
				// this will break the format on a BE machine
				const X = Buffer.from(transformedAudioData.buffer, start, length);
				const y = Buffer.from(marker.y.buffer);

				fs.writeSync(fd, X, 0, X.byteLength);
				fs.writeSync(fd, y, 0, y.byteLength);
			});
		});

		fs.closeSync(fd);

		console.info('Write completed successfully!');
	}
}

module.exports = TrainingExWriter;
