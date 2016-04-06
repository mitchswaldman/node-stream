
var Transform = require('stream').Transform;
var inherits	= require('util').inherits;
var program = require('commander');
var _ = require("underscore");
var fileSystem = require("fs");

// For Node 0.8 users 
if (!Transform) {
 Transform = require('readable-stream/transform');
}

//Constructor logic includes Internal state logic. PatternMatch needs to consider it
//because it has to parse chunks that gets transformed
function PatternMatch(pattern){
	this.pattern = pattern;

	//Switching on object mode so when stream reads sensordata it emits single pattern match.
	Transform.call(
		this,
		{
			objectMode: true
		}
	);
	
}
// Extend the Transform class.
// --
// NOTE: This only extends the class methods - not the internal properties. As such we
// have to make sure to call the Transform constructor(above).

inherits(PatternMatch, Transform);

// Transform classes require that we implement a single method called _transform and
//optionally implement a method called _flush. You assignment will implement both.

PatternMatch.prototype._transform = function (chunk, encoding, getNextChunk){
	console.log(chunk.toString());
	var chunks = chunk.toString().split(this.pattern);
	if(chunks.length == 1){
		this.remaingCharacters = (this.remaingCharacters || "") + chunks[0];
	} else{
		this.remaingCharacters = chunks[chunks.length - 1];
		chunks.splice(chunks.length - 1);
		var that = this;
		_.each(chunks, function(ch){
			that.push(ch);
		})
		getNextChunk();
	}
}

//After stream has been read and transformed, the _flush method is called. It is a great
//place to push values to output stream and clean up existing data
PatternMatch.prototype._flush = function (flushCompleted)	{
	flushCompleted();
}

//That wraps up patternMatch module.
//Program module is for taking command line arguments

program
 .option('-p, --pattern <pattern>', 'Input Pattern such as . ,')
 .parse(process.argv);
// Create an input stream from the file system.

var inputStream = fileSystem.createReadStream( "input-sensor.txt" );

// Create a Pattern Matching stream that will run through the input and find matches
// for the given pattern at the command line - "." and “,”.
console.log("-------------------------Input-------------------------");
var patternStream = inputStream.pipe( new PatternMatch(program.pattern));
var matches = [];
// Read matches from the stream.
patternStream.on('readable', function(){
	var chunk;
	while(null !== (chunk = patternStream.read())){
		matches.push(chunk);
	}

});

patternStream.on('end', function(){
	console.log("-------------------------Output-------------------------");
	console.log(matches);
});



