const fs = require('fs');
const numeric = require('numeric');
const Promise = require('bluebird');
const nodeWav = require('node-wav');
const fsReadFile = Promise.promisify(fs.readFile);

module.exports = {
	load,
	reversePolarity
};

function load(filepath) {
	if (!fs.existsSync(filepath)) return Promise.reject(`Cannot find audio file at ${filepath}`);

	console.info(`Reading wav from ${filepath}...`);

	return fsReadFile(filepath)
		.then(nodeWav.decode)
		.then(waveFile => {
			console.info('Read wave successfully!');
			return waveFile;
		});
}

function reversePolarity(X) {
	console.info('Reversing polarity...');
	const newX = X.slice();

	for (let i = 0, l = newX.length; i < l; i++) {
		newX[i] *= -1;
	}
	console.info('Complete');
	return newX;
}