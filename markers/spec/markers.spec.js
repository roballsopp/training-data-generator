const path = require('path');
const Markers = require('../index');
const { NUM_ARTICULATIONS } = require('../midi-map.config');
const expectedMarkersDefault = require('./expected-markers-default');
const expectedMarkersTest = require('./expected-markers-test');

const testMarkersPath = path.join(__dirname, '../../spec/markers.mid');
const testMapPath = path.join(__dirname, './test-midi-map.js');

describe('Markers', function () {
	describe('fromFile', function () {
		it('fails when the file is not found', function (done) {
			Markers
				.fromFile('./not-a-file.file')
				.then(() => done.fail('Expected a failure, but operation succeeded.'))
				.catch(done);
		});

		describe('when using the default midi map', function () {
			beforeAll(function (done) {
				Markers
					.fromFile(testMarkersPath, null, 44100)
					.then(markers => {
						this.actualMarkers = markers;
					})
					.then(done)
					.catch(done.fail);
			});

			it(`finds the expected number of markers`, function () {
				expect(this.actualMarkers.length).toBe(expectedMarkersDefault.length);
			});

			expectedMarkersDefault.forEach(({pos: expectedPos, y: expectedLabels }, i) => {
				it(`calculates the correct position for marker ${i}`, function () {
					expect(this.actualMarkers[i].pos).toEqual(expectedPos);
				});

				it(`calculates the correct one hot labels for marker ${i}`, function () {
					expect(this.actualMarkers[i].y).toEqual(toOneHot(expectedLabels));
				});
			});
		});

		describe('when using a custom midi map', function () {
			beforeAll(function (done) {
				Markers
					.fromFile(testMarkersPath, testMapPath, 44100)
					.then(markers => {
						this.actualMarkers = markers;
					})
					.then(done)
					.catch(done.fail);
			});

			it(`finds the expected number of markers`, function () {
				expect(this.actualMarkers.length).toBe(expectedMarkersTest.length);
			});

			expectedMarkersTest.forEach(({pos: expectedPos, y: expectedLabels }, i) => {
				it(`calculates the correct position for marker ${i}`, function () {
					expect(this.actualMarkers[i].pos).toEqual(expectedPos);
				});

				it(`calculates the correct one hot labels for marker ${i}`, function () {
					expect(this.actualMarkers[i].y).toEqual(toOneHot(expectedLabels));
				});
			});
		});
	});

	describe('generateNegativeMarkers', function () {
		beforeAll(function (done) {
			this.expectedMinDistanceFromPositiveMarkers = 50;
			Markers
				.fromFile(testMarkersPath)
				.then(positiveMarkers => {
					this.expectedPositiveMarkers = positiveMarkers;
					return Markers.generateNegativeMarkers(positiveMarkers, this.expectedMinDistanceFromPositiveMarkers);
				})
				.then(negativeMarkers => {
					this.actualNegativeMarkers = negativeMarkers;
				})
				.then(done)
				.catch(done.fail);
		});

		it('generates one negative marker between all positive marker pairs', function () {
			for (let i = 0, l = this.expectedPositiveMarkers.length - 1; i < l; i++) {
				const currentPositiveMarker = this.expectedPositiveMarkers[i];
				const nextPositiveMarker = this.expectedPositiveMarkers[i+1];
				const currentPositiveMarkerPaddedPos = currentPositiveMarker.pos + this.expectedMinDistanceFromPositiveMarkers;
				const nextPositiveMarkerPaddedPos = nextPositiveMarker.pos + this.expectedMinDistanceFromPositiveMarkers;

				const negativeMarker = this.actualNegativeMarkers[i];

				expect(negativeMarker.pos).not.toBeLessThan(currentPositiveMarkerPaddedPos);
				expect(negativeMarker.pos).not.toBeGreaterThan(nextPositiveMarkerPaddedPos);
			}
		});

		it('sets all labels to 0 for each negative marker', function () {
			const expectedLabels = new Uint8Array(NUM_ARTICULATIONS);

			// almost certainly unnecessary, but i want to be dead sure they are 0
			expectedLabels.forEach((label, i) => {
				expectedLabels[i] = 0;
			});

			this.actualNegativeMarkers.forEach(negativeMarker => {
				expect(negativeMarker.y).toEqual(expectedLabels);
			});
		});

		it('sets pos to a whole number', function () {
			this.actualNegativeMarkers.forEach(negativeMarker => {
				expect(negativeMarker.pos % 1).toBe(0);
			});
		});
	});
});

function toOneHot(labels) {
	const oneHotArray = new Uint8Array(NUM_ARTICULATIONS);
	for (let i = 0, l = labels.length; i < l; i++) {
		const classIndex = labels[i];
		oneHotArray[classIndex] = 1;
	}
	return oneHotArray;
}