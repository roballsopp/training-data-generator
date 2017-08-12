# training-data-generator
This takes an audio file and a midi file, chops up the audio at each midi note, and spits out a file of raw training examples and a matching file of labels according to the midi mapping

# Output File Spec
Everything is little-endian encoded, and packed without junk or padding. 
### Header
- **Header Id**, `4 bytes, string === 'NDAT'`
- **Number of features**, `4 bytes, uint`, how many input features there are in each training example
- **Feature Format**, `2 bytes, uint === [1, 2, 3, 4]`, format for each feature. `1` for float32, `2` for int32, `3` for int16, and `4` for int8
- **Number of Labels**, `4 bytes, uint`, how many output labels there are in each training example
- **Label Format**, `2 bytes, uint === [1, 2, 3, 4]`, format for each label. `1` for float32, `2` for int32, `3` for int16, and `4` for int8
- **Number of Examples**, `4 bytes, uint`, how many training examples there are
- **Label Offset**, `4 bytes, int`, how far the labels are offset from the location of the audio feature
### Body
Each training example consists of a feature set and a label set. Each label set immediately follows the feature set to which it belongs.

Given the following header:
```javascript
const header = {
	id: 'NDAT',
	numFeatures: 4,
	featureFormat: 1,
	numLabels: 3,
	labelFormat: 4,
	numExamples: 100
}
```
The body should be packed as follows:
![alt text][file_format]

[file_format]: /docs/file_format.png "NDAT body format"