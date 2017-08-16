const fs = require('fs');
const path = require('path');
const nodeWav = require('node-wav');
const Promise = require('bluebird');
const fsReadFile = Promise.promisify(fs.readFile);
const AutoencoderDataGenerator = require('./autoencoder');
const TrainingDataReader = require('./training-ex-writers/TrainingDataReader');

const testMarkersPath = path.join(__dirname, './spec/markers.mid');
const testMarkersWavPath = path.join(__dirname, './spec/markers.wav');
const testWavFilePath = path.join(__dirname, './spec/test.wav');

describe('AutoencoderDataGenerator', function () {
	describe('createTrainingData', function () {
		beforeAll(function (done) {
			this.expectedOutputPath = testWavFilePath + '.ndat';
			this.expectedLengthOut = 3;
			this.expectedSampleRateOut = 44100;
			this.expectedExampleLength = this.expectedSampleRateOut * this.expectedLengthOut;
			this.expectedNumExamples = 10;

			const outputDir = path.dirname(this.expectedOutputPath);

			if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
			if (fs.existsSync(this.expectedOutputPath)) fs.unlinkSync(this.expectedOutputPath);

			const generator = new AutoencoderDataGenerator({
				lengthOut: this.expectedLengthOut,
				sampleRateOut: this.expectedSampleRateOut,
				desiredNumExamples: this.expectedNumExamples
			});

			return generator
				.createTrainingData(testWavFilePath, testMarkersPath)
				.then(done)
				.catch(done.fail);
		});

		it('writes example data file to correct location', function () {
			expect(fs.existsSync(this.expectedOutputPath)).toBeTruthy();
		});

		describe('data', function () {
			beforeAll(function (done) {
				buildExpectedExamples(testWavFilePath, testMarkersWavPath, this.expectedExampleLength, this.expectedNumExamples)
					.then(expectedExamples => {
						this.expectedExamples = expectedExamples;
					})
					.then(done)
					.catch(done.fail);
			});

			it(`writes raw feature set data correctly`, function () {
				const { X: featureSets } = TrainingDataReader.fromFile(this.expectedOutputPath);

				expect(featureSets.length).toBe(this.expectedExamples.length);
				this.expectedExamples.forEach(({ X: expectedFeatureSet }, i) => {
					expect(featureSets[i]).toEqual(expectedFeatureSet);
				});
			});

			it('writes label data correctly', function () {
				const { y: labelSets } = TrainingDataReader.fromFile(this.expectedOutputPath);

				expect(labelSets.length).toBe(this.expectedExamples.length);
				this.expectedExamples.forEach(({ y: expectedLabelSet }, i) => {
					expect(labelSets[i]).toEqual(expectedLabelSet);
				});
			});
		});
	});
});

function buildExpectedExamples(waveFilePath, markerFilePath, numFeatures, desiredNumExamples) {
	return Promise
		.all([
			decodeMedia(waveFilePath),
			decodeMedia(markerFilePath)
		])
		.then(([audioData, markerData]) => {
			const neededSpace = numFeatures * desiredNumExamples;
			const overlap = (neededSpace - audioData.length) / (desiredNumExamples - 1);
			const exampleOffset = Math.floor(numFeatures - overlap);
			const numExamples = Math.floor((audioData.length - numFeatures + exampleOffset) / exampleOffset);

			const examples = [];

			for (let i = 0, l = numExamples; i < l; i++) {
				const startPos = i * exampleOffset;
				const endPos = startPos + numFeatures;
				const features = audioData.slice(startPos, endPos);
				const labels = markerData.slice(startPos, endPos);
				examples.push({ X: features, y: labels });
			}

			return examples;
		});
}

function decodeMedia(filePath) {
	return fsReadFile(filePath)
		.then(nodeWav.decode)
		.then(d => d.channelData[0]);
}
