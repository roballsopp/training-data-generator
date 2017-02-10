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

	toFile(outputPathName, exampleLength, markerOffset = 0) {
		const outputFilePath = `${outputPathName}.ndat`;
		const numExamplesToBeWritten = this._exampleMarkers.length * this._transformers.length;

		console.info(`Writing ${numExamplesToBeWritten} training examples of sample length ${exampleLength}, with marker offset ${markerOffset} to ${outputFilePath}`);

		const fd = fs.openSync(outputFilePath, 'w');

		// write blank buffer to move file write position
		fs.writeSync(fd, Buffer.alloc(TrainingDataHeader.HEADER_SIZE), 0, TrainingDataHeader.HEADER_SIZE);

		let numExamplesWritten = numExamplesToBeWritten;

		this._transformers.forEach(transformer => {
			const transformedAudioData = transformer(this._audioData);

			this._exampleMarkers.forEach(marker => {
				const start = (markerOffset + marker.pos) * transformedAudioData.BYTES_PER_ELEMENT;
				const length = exampleLength * transformedAudioData.BYTES_PER_ELEMENT;

				if (start < 0) return numExamplesWritten--;

				// data in transformedAudioData is stored in whatever byte order the machine natively uses
				// this whole file format counts on little endian, which this machine happens to be, but
				// this will break the format on a BE machine
				const X = Buffer.from(transformedAudioData.buffer, start, length);
				const y = Buffer.from(marker.y.buffer);

				fs.writeSync(fd, X, 0, X.byteLength);
				fs.writeSync(fd, y, 0, y.byteLength);
			});
		});

		const header = new TrainingDataHeader({
			numFeatures: exampleLength,
			numLabels: NUM_ARTICULATIONS,
			numExamples: numExamplesWritten,
			labelOffset: markerOffset
		});

		const headerBuf = header.toBuffer();

		fs.writeSync(fd, headerBuf, 0, headerBuf.byteLength, 0);

		fs.closeSync(fd);

		console.info('Write completed successfully!');
		console.info(`${numExamplesToBeWritten - numExamplesWritten} examples dropped due to negative offset`);
	}
}

module.exports = TrainingExWriter;
