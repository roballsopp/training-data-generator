const fs = require('fs');

class TrainingDataHeader {
	constructor({
		numFeatures,
		featureHeight = 1,
		featureChannels = 1,
		numLabels,
		labelHeight = 1,
		labelChannels = 1,
		numExamples,
		featureFormat = TrainingDataHeader.FMT_FLOAT,
		labelFormat = TrainingDataHeader.FMT_FLOAT,
		labelOffset = 0
	}) {
		this.numFeatures = numFeatures;
		this.featureHeight = featureHeight;
		this.featureChannels = featureChannels;
		this.featureFormat = featureFormat;
		this.numLabels = numLabels;
		this.labelHeight = labelHeight;
		this.labelChannels = labelChannels;
		this.labelFormat = labelFormat;
		this.numExamples = numExamples;
		this.labelOffset = labelOffset;
	}

	toBuffer() {
		const buffer = Buffer.alloc(TrainingDataHeader.HEADER_SIZE);
		buffer.write(TrainingDataHeader.HEADER_ID, 0, 4);
		buffer.writeUInt32LE(this.numFeatures, 4);
		buffer.writeUInt32LE(this.featureHeight, 8);
		buffer.writeUInt16LE(this.featureChannels, 12);
		buffer.writeUInt16LE(this.featureFormat, 14);
		buffer.writeUInt32LE(this.numLabels, 16);
		buffer.writeUInt32LE(this.labelHeight, 20);
		buffer.writeUInt16LE(this.labelChannels, 24);
		buffer.writeUInt16LE(this.labelFormat, 26);
		buffer.writeUInt32LE(this.numExamples, 28);
		buffer.writeInt32LE(this.labelOffset, 32);
		return buffer;
	}

	static get HEADER_ID () { return 'NDAT'; }
	static get HEADER_SIZE () { return 36; }
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
			featureChannels: buffer.readUInt16LE(12),
			featureFormat: buffer.readUInt16LE(14),
			numLabels: buffer.readUInt32LE(16),
			labelHeight: buffer.readUInt32LE(20),
			labelChannels: buffer.readUInt16LE(24),
			labelFormat: buffer.readUInt16LE(26),
			numExamples: buffer.readUInt32LE(28),
			labelOffset: buffer.readInt32LE(32),
		});
	}
}

module.exports = TrainingDataHeader;
