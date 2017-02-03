const { ARTICULATIONS: labels } = require('../midi-map.config');

module.exports = [
	{ y: [labels.KICK], pos: 0 },
	{ y: [labels.KICK], pos: 11025 },
	{ y: [labels.SNARE_SIDESTICK], pos: 22050 },
	{ y: [labels.SNARE], pos: 33075 },
	{ y: [labels.SNARE], pos: 44100 },
	{ y: [labels.SNARE_RIMSHOT], pos: 55125 },
	{ y: [labels.TOM6], pos: 66150 },
	{ y: [labels.HIHAT_CLOSED], pos: 77175 },
	{ y: [labels.TOM5], pos: 88200 },
	{ y: [labels.HIHAT_PEDAL], pos: 99225 },
	{ y: [labels.TOM4], pos: 110250 },
	{ y: [labels.HIHAT_CLOSED], pos: 121275 },
	{ y: [labels.TOM3], pos: 132300 },
	{ y: [labels.TOM2], pos: 143325 },
	{ y: [labels.CRASH1], pos: 154350 },
	{ y: [labels.CRASH1], pos: 165375 },
	{ y: [labels.RIDE_BOW, labels.RIDE_EDGE], pos: 176400 },
	{ y: [labels.CHINA, labels.HIHAT_OPEN], pos: 187425 },
	{ y: [labels.RIDE_BELL, labels.HIHAT_CLOSED], pos: 198450 },
	{ y: [labels.CRASH1, labels.HIHAT_CLOSED], pos: 209475 },
	{ y: [labels.CRASH1, labels.HIHAT_CLOSED], pos: 220500 },
	{ y: [labels.COWBELL, labels.HIHAT_CLOSED], pos: 231525 },
	{ y: [labels.CRASH1, labels.HIHAT_CLOSED], pos: 242550 },
	{ y: [labels.CRASH1, labels.SNARE], pos: 253575 }
];
