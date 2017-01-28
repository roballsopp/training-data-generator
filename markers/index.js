const fs = require('fs');
const Promise = require('bluebird');
const _ = require('lodash');
const { parseMidi } = require('midi-file');
const { ARTICULATIONS, NUM_ARTICULATIONS } = require('./midi-map.config');
const fsReadFile = Promise.promisify(fs.readFile);

module.exports = {
	fromFile,
	generateNegativeMarkers
};

function fromFile(markerPath, mapPath, sampleRate = 44100) {
	const midiMap = require(mapPath)(ARTICULATIONS);

	return fsReadFile(markerPath)
		.then(parseMidi)
		.then(midiFile => {
			const ticksPerBeat = midiFile.header.ticksPerBeat;
			const events = midiFile.tracks[0];

			const markers = {};
			let currentSampPerBeat = 0;
			let elapsedSamples = 0;

			for (let i = 0, l = events.length; i < l; i++) {
				const evt = events[i];
				const numBeatsSinceLastEvt = evt.deltaTime / ticksPerBeat;

				elapsedSamples += (numBeatsSinceLastEvt * currentSampPerBeat);

				if (evt.type === 'setTempo') currentSampPerBeat = (evt.microsecondsPerBeat / 1000000) * sampleRate;
				else if (evt.type === 'noteOn') {
					const markerPosition = Math.round(elapsedSamples);
					markers[markerPosition] = markers[markerPosition] || new Uint8Array(NUM_ARTICULATIONS);
					const mappedNote = midiMap[evt.noteNumber]; // map 128 possible midi notes into NUM_ARTICULATIONS
					markers[markerPosition][mappedNote] = 1;
				}
			}

			return _(markers)
				.transform((markersArray, y, pos) => {
					markersArray.push({ pos: parseInt(pos), y });
					return markersArray;
				}, [])
				.sortBy('pos')
				.value();
		});
}

function generateNegativeMarkers(positiveMarkers, minDistanceFromPositiveMarkers = 0) {
	const negativeMarkers = [];

	positiveMarkers.forEach((curentPositiveMarker, i) => {
		if (positiveMarkers.length > i + 1) {
			const nextPositiveMarker = positiveMarkers[i + 1];
			const negativeMarker = createRandomBetween(curentPositiveMarker, nextPositiveMarker, minDistanceFromPositiveMarkers);

			if (negativeMarker) negativeMarkers.push(negativeMarker);
		}
	});

	return negativeMarkers;
}

function createRandomBetween(firstMarker, secondMarker, minDistanceFromMarkers = 0) {
	const distanceBetweenMarkers = secondMarker.pos - firstMarker.pos - (minDistanceFromMarkers * 2);
	const pos = distanceBetweenMarkers > 0 ? (Math.random() * distanceBetweenMarkers) + firstMarker.pos : null;

	return pos && { pos, y: new Uint8Array(NUM_ARTICULATIONS) };
}