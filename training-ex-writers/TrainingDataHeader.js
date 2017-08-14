const fs = require('fs');

class TrainingDataHeader {
	constructor({
								numFeatures,
								numLabels,
								numExamples,
								featureFormat = TrainingDataHeader.FMT_FLOAT,
								labelFormat = TrainingDataHeader.FMT_FLOAT,
								labelOffset = 0
	}) {
		this.numFeatures = numFeatures;
		this.featureFormat = featureFormat;
		this.numLabels = numLabels;
		this.labelFormat = labelFormat;
		this.numExamples = numExamples;
		this.labelOffset = labelOffset;
	}

	toBuffer() {
		const buffer = Buffer.alloc(TrainingDataHeader.HEADER_SIZE);
		buffer.write(TrainingDataHeader.HEADER_ID, 0, 4);
		buffer.writeUInt32LE(this.numFeatures, 4);
		buffer.writeUInt16LE(this.featureFormat, 8);
		buffer.writeUInt32LE(this.numLabels, 10);
		buffer.writeUInt16LE(this.labelFormat, 14);
		buffer.writeUInt32LE(this.numExamples, 16);
		buffer.writeInt32LE(this.labelOffset, 20);
		return buffer;
	}

	static get HEADER_ID () { return 'NDAT'; }
	static get HEADER_SIZE () { return 24; }
	static get FMT_FLOAT () { return 1; }
	static get FMT_INT32 () { return 2; }
	static get FMT_INT16 () { return 3; }
	static get FMT_INT8 () { return 4; }

	static fromFile(fd) {
		const buffer = Buffer.alloc(TrainingDataHeader.HEADER_SIZE);
		fs.readSync(fd, buffer, 0, TrainingDataHeader.HEADER_SIZE, 0);

		const id = buffer.toString('utf8', 0, 4);

		if (id !== TrainingDataHeader.HEADER_ID) throw new Error(`Unrecognized header id: ${id}`);

		return new TrainingDataHeader({
			numFeatures: buffer.readUInt32LE(4),
			featureFormat: buffer.readUInt16LE(8),
			numLabels: buffer.readUInt32LE(10),
			labelFormat: buffer.readUInt16LE(14),
			numExamples: buffer.readUInt32LE(16),
			labelOffset: buffer.readInt32LE(20)
		});
	}
}

module.exports = TrainingDataHeader;
