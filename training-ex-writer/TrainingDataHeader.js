const fs = require('fs');

class TrainingDataHeader {
	constructor({numFeatures, numLabels, numExamples, labelOffset = 0}) {
		this.numFeatures = numFeatures;
		this.numLabels = numLabels;
		this.numExamples = numExamples;
		this.labelOffset = labelOffset;
	}

	toBuffer() {
		const buffer = Buffer.alloc(20);
		buffer.write('NDAT', 0, 4);
		buffer.writeUInt32LE(this.numFeatures, 4);
		buffer.writeUInt32LE(this.numLabels, 8);
		buffer.writeUInt32LE(this.numExamples, 12);
		buffer.writeUInt32LE(this.labelOffset, 16);
		return buffer;
	}

	static get HEADER_ID () { return 'NDAT'; }
	static get HEADER_SIZE () { return 20; }

	static fromFile(fd) {
		const buffer = Buffer.alloc(20);
		fs.readSync(fd, buffer, 0, 20, 0);

		const id = buffer.toString('utf8', 0, 4);

		if (id !== 'NDAT') throw new Error(`Unrecognized header id: ${id}`);

		return new TrainingDataHeader({
			numFeatures: buffer.readUInt32LE(4),
			numLabels: buffer.readUInt32LE(8),
			numExamples: buffer.readUInt32LE(12),
			labelOffset: buffer.readUInt32LE(16)
		});
	}
}

module.exports = TrainingDataHeader;
