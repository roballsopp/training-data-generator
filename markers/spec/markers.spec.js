const path = require('path');
const Markers = require('../index');
const { NUM_ARTICULATIONS } = require('../midi-map.config');
const expectedMarkersDefault = require('./expected-markers-default');
const expectedMarkersTest = require('./expected-markers-test');

const testMarkersPath = path.join(__dirname, './markers.mid');
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
					.fromFile(testMarkersPath)
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
					.fromFile(testMarkersPath, testMapPath)
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
});

function toOneHot(labels) {
	const oneHotArray = new Uint8Array(NUM_ARTICULATIONS);
	for (let i = 0, l = labels.length; i < l; i++) {
		const classIndex = labels[i];
		oneHotArray[classIndex] = 1;
	}
	return oneHotArray;
}