/* 

Handles dynamic elements of museumdraw task
Oct 26 2017

*/

// To integrate:
// HTML divs: Starting welcome page, age page (push age data), thank you page
// JS: clear and save sketchpad data (and push to online database after each trial)
// Convert onclick to also ontouch to work with ipad
// CSS: Make sure sizing works well on an iPad
// and much more...

// 0. Load dependencies
paper.install(window);
socket = io.connect();

// 1. Setup trial order and randomize it!
var stimListTest = [{"category": "rabbit", "video": "rabbit.mp4"},
{"category": "boat", "video": "boat.mp4"}]

var curTrial=0 // global variable, trial counter
var sessionId='stationPilot0_' + Date.now().toString()
var maxTrials = stimListTest.length-1; // 
var trialOrder = [];
for (var i = 0; i <= maxTrials; i++) {
   trialOrder.push(i);
}

// set global variables
var clickedSubmit=0;

//helpfuls
function shuffle (a) 
{ 
    var o = [];
    for (var i=0; i < a.length; i++) {
    o[i] = a[i];
    } 
    for (var j, x, i = o.length;
   i;
   j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x); 
    return o;
}
//global variables here
var trialOrder=shuffle(trialOrder)
var thisTrialIndex=trialOrder[curTrial] 

// for each time we start drawing
function startDrawing(){
  // resize canvas
    clickedSubmit=0; //reset this variable

    saveConsentData(); // save consent screen
		loadNextVideo(thisTrialIndex) // change video
		document.getElementById("cue").innerHTML = "Can you draw a "  + stimListTest[thisTrialIndex].category; // change cue
    
	 $('#WelcomeScreen').fadeOut('fast'); // fade out age screen
	 $('#mainExp').fadeIn('fast'); // fade in exp

    setTimeout(function() {showCue();},1000); 
    setTimeout(function() {hideCue();},5000);  // Take cues away after 5 - after video ends
    setTimeout(function() {showSubmit();},6000); // some minimum amount of time before "I'm done button"
		timestamp_cueOnset = new Date().getTime();
}

// show cue without canvas
function showCue() {	
	$('#cue').fadeIn('fast'); //text cue associated with trial
	$('#cueVideoDiv').show(); //show video div 
	playVideo();
}

// hide cue and show sketchpad canvas
function hideCue() {
	$('#cue').fadeOut('fast'); // fade out cue
	$('#cueVideoDiv').hide(); //show video html - this can be a variable later?
	 
   // change sketchpad so it is visible again; change style
   project.activeLayer.removeChildren(); // clear sketchpad  just in case they've drawn during video
   //
   var canvas = document.getElementById("sketchpad"),
         ctx=canvas.getContext("2d");
    canvas.width=600;
    canvas.height=600;
    canvas.style.height='600px';
    canvas.style.width='600px';
    canvas.style.border="solid 5px #999";
    canvas.style.top="15vh";
    //
  monitorProgress() // since we now have a timeout function
}

function monitorProgress(){
  console.log('starting monitoring')
  $('#progressBar').show();
  progress(20, 20, $('#progressBar')); // show progress bar
}

function showSubmit() {
	$('#submit_div').fadeIn('fast');
}

// video player functions
function playVideo(){
  videojs("cueVideo").ready(function(){ // need to wait until video is ready
  var player = this;
  player.play();
	});
}

function loadNextVideo(){
  var player=videojs('cueVideo');
  player.pause();
  var thisTrialIndex=trialOrder[curTrial] 
  console.log(stimListTest[thisTrialIndex].video)
  player.src({ type: "video/mp4", src: "videos/" + stimListTest[thisTrialIndex].video });
  player.load();
}

function saveConsentData(){
        console.log(' saving consent "form" to database')
        // save sketch png
        var dataURL = document.getElementById('sketchpad').toDataURL();
        dataURL = dataURL.replace('data:image/png;base64,','');
        var category = "consent"

        readable_date = new Date();
        current_data = {
            dataType: 'finalImage',
            sessionId: sessionId,
            imgData: dataURL,
            category: category,
            dbname:'kiddraw',
            colname:'stationPilot0',
            trialNum: curTrial,
            time: Date.now(),
            date: readable_date}; 

        // console.log(current_data);

        // send data to server to write to database
        socket.emit('current_data', current_data);
        project.activeLayer.removeChildren(); // clear sketchpad 
}


function automaticEnd(){

        console.log(' automatically triggered next trial ')
        // save sketch png
        var dataURL = document.getElementById('sketchpad').toDataURL();
        dataURL = dataURL.replace('data:image/png;base64,','');
        var thisTrialIndex=trialOrder[curTrial] 
        var category = stimListTest[thisTrialIndex].category;
        var age = $('#years').value;

        readable_date = new Date();
        current_data = {
            dataType: 'finalImage',
            sessionId: sessionId,
            imgData: dataURL,
            category: category,
            dbname:'kiddraw',
            colname:'stationPilot0',
            trialNum: curTrial,
            time: Date.now(),
            date: readable_date}; 

        // send data to server to write to database
        socket.emit('current_data', current_data);
        restartExperiment();
  };


function restartExperiment() {
	project.activeLayer.removeChildren(); // clear sketchpad 

  $('#progressBar').hide();
  $('#mainExp').fadeOut('fast'); // fade out sketchpad etc
  $('#submit_div').fadeOut('fast'); // fade out sketchpad etc
  $('#WelcomeScreen').fadeIn('fast'); // fade in welcome screen

  //reset canvas size to intro sizes for consent data
    var canvas = document.getElementById("sketchpad"),
         ctx=canvas.getContext("2d");
    canvas.width=400;
    canvas.height=225;
    canvas.style.width='400px';
    canvas.style.height='225px';
    canvas.style.border="none"
}

function progress(timeleft, timetotal, $element) {
    var progressBarWidth = timeleft * $element.width() / timetotal;
    var timeLeftOut = timeleft
    $element.find('div').animate({ width: progressBarWidth }, timeleft == timetotal ? 0 : 1000, "linear").html(Math.floor(timeleft/60) + ":"+ timeleft%60);
    console.log("clicked submit = " + clickedSubmit)
    console.log("time left = " + timeleft)
    if(timeleft > 0 & clickedSubmit==0) {
        setTimeout(function() {
            progress(timeleft - 1, timetotal, $element);
        }, 1000);
      }
    else if(timeleft == 0 & clickedSubmit==0){
      automaticEnd();
    }
  };


window.onload = function() { 

  $('#submit').click(function () {
    clickedSubmit=1;

    // save sketch png
    var dataURL = document.getElementById('sketchpad').toDataURL();
    dataURL = dataURL.replace('data:image/png;base64,','');
    var thisTrialIndex=trialOrder[curTrial] 
    var category = stimListTest[thisTrialIndex].category;

    readable_date = new Date();
    current_data = {
        dataType: 'finalImage',
        sessionId: sessionId,
        imgData: dataURL,
        category: category,
        dbname:'kiddraw',
        colname:'stationPilot0',
        trialNum: curTrial,
        time: Date.now(),
        date: readable_date}; 

    // send data to server to write to database
    socket.emit('current_data', current_data);
    restartExperiment();
  });

  // Drawing related tools
  paper.setup('sketchpad');

  // Create a simple drawing tool:
  var tool = new Tool();
  tool.minDistance = 10;
  var path, path2;     

  // Define a mousedown and mousedrag handler
  tool.onMouseDown = function(event) {
    path = new Path();      
    path.strokeColor = '#000000';
    path.strokeWidth = 10;
    path.add(event.point);
  }

  tool.onMouseDrag = function(event) {
    path.add(event.point);
  }

  tool.onMouseUp = function(event) {
    path.selected = false;
    path.simplify(10);
    finalPoint = path._segments.slice(-1)[0];

    // var jsonString = path.exportJSON({asString: true});
    var svgString = path.exportSVG({asString: true});
    var thisTrialIndex=trialOrder[curTrial] 
    var category = stimListTest[thisTrialIndex].category;
    var readable_date = new Date();

    stroke_data = {
      dataType: 'stroke',
      sessionId: sessionId,
      svg: svgString,
      category: category,
      dbname:'kiddraw',
      colname:'stationPilot0',
      trialNum: curTrial,
      time: Date.now(),
      date: readable_date
    };

    // console.log(stroke_data);
    // send stroke data to server
    socket.emit('stroke',stroke_data);
    
  }

}




