const fs = require('fs');

function defaultTransformer(audioData) {
	return audioData;
}

class TrainingExWriter {
	constructor(audioData, exampleMarkers) {
		this._audioData = audioData;
		this._exampleMarkers = exampleMarkers;
		this._transformers = [defaultTransformer];
	}

	transform(transformer) {
		if (typeof transformer !== 'function') throw new Error('Transformer must be a function');
		this._transformers.push(transformer);
		return this;
	}

	toFile(outputPath, exampleLength) {
		const XFilePath = `${outputPath}_X.dat`;
		const yFilePath = `${outputPath}_y.dat`;

		console.info(`Writing ${this._exampleMarkers.length} markers to ${yFilePath}`);
		console.info(`Writing training examples of sample length ${exampleLength} to ${XFilePath}`);

		const fdX = fs.openSync(XFilePath, 'w');
		const fdy = fs.openSync(yFilePath, 'w');

		this._transformers.forEach(transformer => {
			const transformedAudioData = transformer(this._audioData);

			this._exampleMarkers.forEach(marker => {
				const X = Buffer.from(transformedAudioData.slice(marker.pos, marker.pos + exampleLength).buffer);
				const y = Buffer.from(marker.y.buffer);

				fs.writeSync(fdX, X, 0, X.byteLength);
				fs.writeSync(fdy, y, 0, y.byteLength);
			});
		});

		fs.closeSync(fdX);
		fs.closeSync(fdy);

		console.info('Write completed successfully!');
	}
}

module.exports = TrainingExWriter;
