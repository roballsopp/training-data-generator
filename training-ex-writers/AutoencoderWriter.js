const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const TrainingDataHeader = require('./TrainingDataHeader');

class AutoencoderExWriter {
	constructor(exampleBuilder) {
		this._exampleBuilder = exampleBuilder;
	}

	toFile(outputPathName) {
		const outputDir = path.dirname(outputPathName);
		mkdirp.sync(outputDir);
		const outputFilePath = `${outputPathName}.ndat`;
		const numExamplesToBeWritten = this._exampleBuilder.numExamples;
		const numFeatures = this._exampleBuilder.numFeatures;
		const numLabels = this._exampleBuilder.numLabels;

		console.info(`Writing ${numExamplesToBeWritten} training examples of feature length ${numFeatures}, and label length ${numLabels} to ${outputFilePath}`);

		const fd = fs.openSync(outputFilePath, 'w');

		const header = new TrainingDataHeader({
			numFeatures: numFeatures,
			numLabels: numLabels,
			numExamples: numExamplesToBeWritten,
			featureFormat: TrainingDataHeader.FMT_FLOAT,
			labelFormat: TrainingDataHeader.FMT_FLOAT,
			labelOffset: 0
		});

		const headerBuf = header.toBuffer();

		fs.writeSync(fd, headerBuf, 0, headerBuf.byteLength);

		this._exampleBuilder.reset();

		while (this._exampleBuilder.hasNext()) {
			const [X, y] = this._exampleBuilder.getNextExample();

			fs.writeSync(fd, Buffer.from(X.buffer), 0, X.byteLength);
			fs.writeSync(fd, Buffer.from(y.buffer), 0, y.byteLength);
		}

		fs.closeSync(fd);

		console.info('Write completed successfully!');
	}
}

module.exports = AutoencoderExWriter;
