const fs = require('fs');

class TrainingDataHeader {
	constructor({
								numFeatures,
								featureHeight = 1,
								numLabels,
								numExamples,
								featureFormat = TrainingDataHeader.FMT_FLOAT,
								labelFormat = TrainingDataHeader.FMT_FLOAT,
								labelOffset = 0
							}) {
		this.numFeatures = numFeatures;
		this.featureHeight = featureHeight;
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
		buffer.writeUInt32LE(this.featureHeight, 8);
		buffer.writeUInt16LE(this.featureFormat, 12);
		buffer.writeUInt32LE(this.numLabels, 14);
		buffer.writeUInt16LE(this.labelFormat, 18);
		buffer.writeUInt32LE(this.numExamples, 20);
		buffer.writeInt32LE(this.labelOffset, 24);
		return buffer;
	}

	static get HEADER_ID () { return 'NDAT'; }
	static get HEADER_SIZE () { return 28; }
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
			featureHeight: buffer.readUInt32LE(8),
			featureFormat: buffer.readUInt16LE(12),
			numLabels: buffer.readUInt32LE(14),
			labelFormat: buffer.readUInt16LE(18),
			numExamples: buffer.readUInt32LE(20),
			labelOffset: buffer.readInt32LE(24)
		});
	}
}

module.exports = TrainingDataHeader;
