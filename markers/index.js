const fs = require('fs');
const Promise = require('bluebird');
const _ = require('lodash');
const MIDIFile = require('midifile');
const MIDIEvents = require('midievents');
const { ARTICULATIONS, NUM_ARTICULATIONS } = require('./midi-map.config');
const fsReadFile = Promise.promisify(fs.readFile);

const MuS_PER_SECOND = 1000000; // number of microseconds in a second

class Markers {
	static fromFile(markerPath, mapPath) {
		if (!fs.existsSync(mapPath)) {
			console.warn(`No midi map found at ${mapPath}. Using default midi map`);
			mapPath = './default-midi-map.js';
		}

		console.info(`Loading markers from ${markerPath}...`);
		console.info(`Using midi map at ${mapPath}`);

		const midiMap = require(mapPath)(ARTICULATIONS);

		return fsReadFile(markerPath)
			.then(f => new MIDIFile(f.buffer))
			.then(m => new Markers(m.header.getTicksPerBeat(), m.getTrackEvents(0), midiMap))
	}

	static generateNegativeMarkers(positiveMarkers, minDistanceFromPositiveMarkers = 0) {
		console.info(`Generating negative markers...`);
		const negativeMarkers = [];

		positiveMarkers.forEach((curentPositiveMarker, i) => {
			if (positiveMarkers.length > i + 1) {
				const nextPositiveMarker = positiveMarkers[i + 1];
				const negativeMarker = Markers.createRandomBetween(curentPositiveMarker, nextPositiveMarker, minDistanceFromPositiveMarkers);

				if (negativeMarker) negativeMarkers.push(negativeMarker);
			}
		});

		console.info(`${negativeMarkers.length} negative markers generated`);
		return negativeMarkers;
	}

	static createRandomBetween(firstMarker, secondMarker, minDistanceFromMarkers = 0) {
		const distanceBetweenMarkers = secondMarker.pos - firstMarker.pos - (minDistanceFromMarkers * 2);
		const pos = distanceBetweenMarkers > 0 ? (Math.random() * distanceBetweenMarkers) + firstMarker.pos : null;

		return pos && { pos: Math.round(pos), y: new Int8Array(NUM_ARTICULATIONS) };
	}

	constructor(ticksPerBeat, events, midiMap) {
		this._ticksPerBeat = ticksPerBeat;
		this._events = events;

		if (!Array.isArray(midiMap)) throw new Error(`Invalid midi map. Expected array, got ${typeof midiMap}`);
		if (midiMap.length !== 128) throw new Error(`Invalid midi map. Expected length 128. Got length ${midiMap.length}`);

		this._midiMap = midiMap;
	}
	
	// build a map of the markers in the format:
	// {
	// 	[uint samplePosition]: new Int8Array([0, 0, 1, ... NUM_ARTICULATIONS])
	// 	[uint samplePosition]: new Int8Array([1, 1, 0, ... NUM_ARTICULATIONS])
	// 	...
	// }
	// where each Int8Array records which articulation(s) were hit at the samplePosition
	getSamplePosMap(sampleRate = 44100) {
		const markerMap = {};
		let currentSampPerBeat = 0;
		let elapsedSamples = 0;

		for (let i = 0, l = this._events.length; i < l; i++) {
			const evt = this._events[i];
			const numBeatsSinceLastEvt = evt.delta / this._ticksPerBeat;

			elapsedSamples += (numBeatsSinceLastEvt * currentSampPerBeat);

			if (evt.subtype === MIDIEvents.EVENT_META_SET_TEMPO) currentSampPerBeat = (evt.tempo / MuS_PER_SECOND) * sampleRate;
			else if (evt.subtype === MIDIEvents.EVENT_MIDI_NOTE_ON) {
				const markerPosition = Math.round(elapsedSamples);
				markerMap[markerPosition] = markerMap[markerPosition] || new Int8Array(NUM_ARTICULATIONS);
				// param1 is note number, param2 is velocity
				const mappedNote = this._midiMap[evt.param1]; // map 128 possible midi notes into NUM_ARTICULATIONS
				if (mappedNote !== ARTICULATIONS.NO_HIT) markerMap[markerPosition][mappedNote] = 1;
			}
		}
		
		return markerMap;
	}

	// build a list of the markers in the format:
	// [{
	// 	pos: uint samplePosition,
	// 	y: new Int8Array([1, 1, 0, ... NUM_ARTICULATIONS])
	// }, {
	// 	pos: uint samplePosition,
	// 	y: new Int8Array([1, 1, 0, ... NUM_ARTICULATIONS])
	// }, ...]
	// where y is an Int8Array that records which articulation(s) were hit at the samplePosition
	getSamplePosList(sampleRate = 44100) {
		const markerMap = this.getSamplePosMap(sampleRate);

		const markerArray = _(markerMap)
			.transform((markersArray, y, pos) => {
				markersArray.push({ pos: parseInt(pos), y });
				return markersArray;
			}, [])
			.sortBy('pos')
			.value();

		// Not exactly the number of midi events, since some happen simultaneously and are captured inside a single marker
		console.info(`${markerArray.length} markers loaded.`);
		return markerArray;
	}
}

module.exports = Markers;