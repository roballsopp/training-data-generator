const fs = require('fs');
const TrainingDataHeader = require('./TrainingDataHeader');

module.exports = {
	fromFile
};

const formatToArrayType = {
	[TrainingDataHeader.FMT_FLOAT]: Float32Array,
	[TrainingDataHeader.FMT_INT32]: Int32Array,
	[TrainingDataHeader.FMT_INT16]: Int16Array,
	[TrainingDataHeader.FMT_INT8]: Int8Array,
};

function fromFile(filePath) {
	const fd = fs.openSync(filePath, 'r');
	const header = TrainingDataHeader.fromFile(fd);
	const featureBytes = formatToArrayType[header.featureFormat].BYTES_PER_ELEMENT;
	const labelBytes = formatToArrayType[header.labelFormat].BYTES_PER_ELEMENT;

	const trainingData = { X: [], y: [] };

	let readPos = TrainingDataHeader.HEADER_SIZE;

	for (let i = 0; i < header.numExamples; i++) {
		const featureBuffer = Buffer.alloc(header.numFeatures * featureBytes);
		const labelBuffer = Buffer.alloc(header.numLabels * labelBytes);

		fs.readSync(fd, featureBuffer, 0, featureBuffer.byteLength, readPos);
		readPos += featureBuffer.byteLength;

		fs.readSync(fd, labelBuffer, 0, labelBuffer.byteLength);
		readPos += labelBuffer.byteLength;

		trainingData.X.push(bufferToTypedArray(featureBuffer, header.featureFormat));
		trainingData.y.push(bufferToTypedArray(labelBuffer, header.labelFormat));
	}

	fs.closeSync(fd);

	return trainingData;
}

function bufferToTypedArray(buffer, fmt) {
	const ArrayType = formatToArrayType[fmt];
	const numSamples = buffer.length / ArrayType.BYTES_PER_ELEMENT;
	const examples = new ArrayType(numSamples);
	const readBuffer = getBufferReader(buffer, fmt);

	for (let i = 0; i < numSamples; i++) {
		examples[i] = readBuffer(i * ArrayType.BYTES_PER_ELEMENT);
	}

	return examples;
}

function getBufferReader(buffer, fmt) {
	switch (fmt) {
		case TrainingDataHeader.FMT_FLOAT: return p => buffer.readFloatLE(p);
		case TrainingDataHeader.FMT_INT32: return p => buffer.readInt32LE(p);
		case TrainingDataHeader.FMT_INT16: return p => buffer.readInt16LE(p);
		case TrainingDataHeader.FMT_INT8: return p => buffer.readInt8(p);
		default: throw new Error('Invalid format')
	}
}
