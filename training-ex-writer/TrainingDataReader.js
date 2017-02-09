const fs = require('fs');
const TrainingDataHeader = require('./TrainingDataHeader');

module.exports = {
	fromFile
};

function fromFile(filePath) {
	const fd = fs.openSync(filePath, 'r');
	const header = TrainingDataHeader.fromFile(fd);

	const trainingData = { X: [], y: [] };

	let readPos = TrainingDataHeader.HEADER_SIZE;

	for (let i = 0; i < header.numExamples; i++) {
		const featureBuffer = Buffer.alloc(header.numFeatures * 4);
		const labelBuffer = Buffer.alloc(header.numLabels * 1);

		fs.readSync(fd, featureBuffer, 0, featureBuffer.byteLength, readPos);
		readPos += featureBuffer.byteLength;

		fs.readSync(fd, labelBuffer, 0, labelBuffer.byteLength);
		readPos += labelBuffer.byteLength;

		trainingData.X.push(bufferToFloat32Array(featureBuffer));
		trainingData.y.push(new Uint8Array(labelBuffer.buffer));
	}

	fs.closeSync(fd);

	return trainingData;
}

function bufferToFloat32Array(buffer) {
	const numSamples = buffer.length / Float32Array.BYTES_PER_ELEMENT;
	const examples = new Float32Array(numSamples);

	for (let i = 0; i < numSamples; i++) {
		examples[i] = buffer.readFloatLE(i * Float32Array.BYTES_PER_ELEMENT);
	}

	return examples;
}
