const fs = require('fs');

module.exports = {
	toFile
};

function toFile(filepath, audioData, exampleMarkers, exampleLength) {
	const XFilePath = `${filepath}_X.dat`;
	const yFilePath = `${filepath}_y.dat`;

	console.info(`Writing ${exampleMarkers.length} markers to ${yFilePath}`);
	console.info(`Writing training examples of sample length ${exampleLength} to ${XFilePath}`);

	const fdX = fs.openSync(XFilePath, 'w');
	const fdy = fs.openSync(yFilePath, 'w');

	exampleMarkers.forEach(marker => {
		const X = Buffer.from(audioData.slice(marker.pos, marker.pos + exampleLength).buffer);
		const y = Buffer.from(marker.y.buffer);

		fs.writeSync(fdX, X, 0, X.byteLength);
		fs.writeSync(fdy, y, 0, y.byteLength);
	});

	fs.closeSync(fdX);
	fs.closeSync(fdy);

	console.info('Write completed successfully!');
}