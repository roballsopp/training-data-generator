const path = require('path');
const fs = require('fs');
const Promise = require('bluebird');
const nodeWav = require('node-wav');
const fsReadFile = Promise.promisify(fs.readFile);
const Audio = require('../../audio');
const Markers = require('../../markers');
const SingleTransientWriter = require('../SingleTransientWriter');
const TrainingDataReader = require('../TrainingDataReader');

const testMarkersPath = path.join(__dirname, '../../spec/markers.mid');
const testWavFilePath = path.join(__dirname, '../../spec/test.wav');

describe('Single Transient Writer', function () {
	describe('toFile', function () {
		beforeAll(function (done) {
			this.expectedOutputPath = path.join(__dirname, '../../tmp/test');
			this.expectedExampleFilePath = this.expectedOutputPath + '.ndat';
			this.expectedExampleLength = 4000;
			this.expectedTransformers = [a => a, Audio.reversePolarity];

			const outputDir = path.dirname(this.expectedOutputPath);

			if (!fs.existsSync(outputDir))fs.mkdirSync(outputDir);
			if (fs.existsSync(this.expectedExampleFilePath)) fs.unlinkSync(this.expectedExampleFilePath);

			Promise
				.all([
					fsReadFile(testWavFilePath),
					Markers.fromFile(testMarkersPath, null)
				])
				.then(([waveFileBlob, markers]) => {
					const waveFile = nodeWav.decode(waveFileBlob);
					this.markers = markers.getSamplePosList(waveFile.sampleRate);
					this.audioData = waveFile.channelData[0];
					const writer = new SingleTransientWriter(this.audioData, this.markers);
					return writer
						.transform(Audio.reversePolarity)
						.toFile(this.expectedOutputPath, this.expectedExampleLength);
				})
				.then(done)
				.catch(done.fail);
		});

		it('writes example data file to correct location', function () {
			expect(fs.existsSync(this.expectedExampleFilePath)).toBeTruthy();
		});

		it(`writes raw example data correctly`, function () {
			const { X: exampleData } = TrainingDataReader.fromFile(this.expectedExampleFilePath);

			this.expectedTransformers.forEach((transformer, t) => {
				const transformedAudio = transformer(this.audioData);
				const transformerOffset = t * this.markers.length;
				this.markers.forEach((marker, i) => {
					const expectedAudio = transformedAudio.slice(marker.pos, marker.pos + this.expectedExampleLength);
					const actualAudio = exampleData[i + transformerOffset];
					expect(actualAudio).toEqual(expectedAudio);
				});
			});
		});

		it('writes label data correctly', function () {
			const { y: labelData } = TrainingDataReader.fromFile(this.expectedExampleFilePath);

			this.expectedTransformers.forEach((transformer, t) => {
				const transformerOffset = t * this.markers.length;
				this.markers.forEach(({ y: expectedLabels }, i) => {
					const actualLabels = labelData[i + transformerOffset];
					expect(actualLabels).toEqual(expectedLabels);
				});
			});
		});
	});
});
