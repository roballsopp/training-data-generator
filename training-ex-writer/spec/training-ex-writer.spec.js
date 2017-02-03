const path = require('path');
const fs = require('fs');
const Promise = require('bluebird');
const nodeWav = require('node-wav');
const fsReadFile = Promise.promisify(fs.readFile);
const Markers = require('../../markers');
const { NUM_ARTICULATIONS } = require('../../markers/midi-map.config');
const TrainingExWriter = require('../index');

const testMarkersPath = path.join(__dirname, '../../spec/markers.mid');
const testWavFilePath = path.join(__dirname, '../../spec/test.wav');

describe('Training Example Writer', function () {
	describe('toFile', function () {
		beforeAll(function (done) {
			this.expectedOutputPath = path.join(__dirname, '../../tmp/test');
			this.expectedExampleFilePath = this.expectedOutputPath + '_X.dat';
			this.expectedLabelFilePath = this.expectedOutputPath + '_y.dat';
			this.expectedExampleLength = 4000;

			const outputDir = path.dirname(this.expectedOutputPath);

			if (!fs.existsSync(outputDir))fs.mkdirSync(outputDir);
			if (fs.existsSync(this.expectedExampleFilePath)) fs.unlinkSync(this.expectedExampleFilePath);
			if (fs.existsSync(this.expectedLabelFilePath)) fs.unlinkSync(this.expectedLabelFilePath);

			fsReadFile(testWavFilePath)
				.then(nodeWav.decode)
				.then(waveFile => {
					return Promise
						.all([
							Markers.fromFile(testMarkersPath, null, waveFile.sampleRate),
							waveFile.channelData[0]
						]);
				})
				.then(([markers, audioData]) => {
					this.markers = markers;
					this.audioData = audioData;
					const writer = new TrainingExWriter(audioData, markers);
					return writer.toFile(this.expectedOutputPath, this.expectedExampleLength);
				})
				.then(done)
				.catch(done.fail);
		});

		it('writes example data file to correct location', function () {
			expect(fs.existsSync(this.expectedExampleFilePath)).toBeTruthy();
		});

		it('writes label data file to correct location', function () {
			expect(fs.existsSync(this.expectedLabelFilePath)).toBeTruthy();
		});

		it(`writes raw example data correctly`, function () {
			const exampleData = readFileAsFloat32Array(this.expectedExampleFilePath);

			this.markers.forEach((marker, i) => {
				const expectedAudio = this.audioData.slice(marker.pos, marker.pos + this.expectedExampleLength);
				const actualAudio = exampleData.slice(i * this.expectedExampleLength, (i + 1) * this.expectedExampleLength);
				expect(actualAudio).toEqual(expectedAudio);
			});
		});

		it('writes label data correctly', function () {
			const labelData = new Uint8Array(fs.readFileSync(this.expectedLabelFilePath));

			this.markers.forEach(({ y: expectedLabels }, i) => {
				const actualLabels = labelData.slice(i * NUM_ARTICULATIONS, (i + 1) * NUM_ARTICULATIONS);
				expect(actualLabels).toEqual(expectedLabels);
			});
		});
	});
});

function readFileAsFloat32Array(filePath) {
	const buffer = fs.readFileSync(filePath);
	const numSamples = buffer.length / Float32Array.BYTES_PER_ELEMENT;
	const examples = new Float32Array(numSamples);

	for (let i = 0; i < numSamples; i++) {
		examples[i] = buffer.readFloatLE(i * Float32Array.BYTES_PER_ELEMENT);
	}

	return examples;
}
