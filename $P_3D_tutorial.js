// Date         Author        Description
//---------------------------------------------
// Mar 30, 2015 Ethan Wessel : Worked on converting to 3D

//concatData: concatenates data together
//@param id: the id that will be concatenated with data
//@param data: the data
//@return: the string data concatenated together
function concatData(id, data){
  return id + ": " + data + "<br>";
}

//basicInfo: gets the basic info about the
//frame id, the number of hands, and the number of fingers
//@param frame: the frame object that has all the data
//@return frameString: string data that will be displayed
function displayFrameInfo(frame){
  var frameString = "";
  frameString += concatData("frame_id", frame.id);
  frameString += concatData("num_hands", frame.hands.length);
  frameString += concatData("num_fingers", frame.fingers.length);

  output.innerHTML = frameString;
}

//outputData: outputs data to the output string in the html
function resultOutput(){
  var outputResults = "";
  if(result != undefined){
    outputResults += "Gesture: " + result.Name + "<br>Score: " + result.Score + "<br>";
  }
  recognizerOutput.innerHTML = outputResults;
}

function showAvailableGestures(){
  
  var outputString = "# of Training Gestures: " + PDollarRecognizer.NumOfPointClouds() + "<br>";
  
  if(PDollarRecognizer.NumOfPointClouds() == 0){
    outputString += "No Gestures";
  }
  else{   
    outputString += "Gesture Names: <br>";
    var gestureNames = PDollarRecognizer.AvailableGestures();
    for(var i = 0; i < gestureNames.length; i++){
      outputString += gestureNames[i] + " x " + gestureNames[gestureNames[i]] + "<br>";
    }
  }
  
  availableGestures.innerHTML = outputString;
}

//captureHandPoints: generates a hand point from frame data
//@param frame: the frame that has the data for the handpoint
function captureHandPoints(frame){

  //will only show one hand for now
  if(frame.hands.length > 0){
    var palmPos = frame.hands[0].palmPosition;
    var thumbPos = frame.hands[0].fingers[0].dipPosition;
    var indexPos = frame.hands[0].fingers[1].dipPosition;
    var midPos = frame.hands[0].fingers[2].dipPosition;
    var ringPos = frame.hands[0].fingers[3].dipPosition;
    var pinkyPos = frame.hands[0].fingers[4].dipPosition;
    
    //capture fingers into their own point array
    palmHandPoints.push(new Point(palmPos[0], palmPos[1], palmPos[2], handID));
    thumbFingerPoints.push(new Point(thumbPos[0], thumbPos[1], thumbPos[2], thumbID));
    indexFingerPoints.push(new Point(indexPos[0], indexPos[1], indexPos[2], indexID));
    middleFingerPoints.push(new Point(midPos[0], midPos[1], midPos[2], middleID));
    ringFingerPoints.push(new Point(ringPos[0], ringPos[1], ringPos[2], ringID));
    pinkyFingerPoints.push(new Point(pinkyPos[0], pinkyPos[1], pinkyPos[2], pinkyID));
  }
}

//convertPointCloudToGraphPoints: converts the point clouds to points that can
//be plotted on the point graph
//@param pointCloud: the point cloud that we want to be viewing
//@return graphPoints: the graph points that are in the correct format for
//the scatter plot to view
function convertPointCloudToGraphPoints(pointCloud){
  
  var graphPoints = new Array();
  if(pointCloud.length != 0){
    for(var i = 0; i < pointCloud['Points'].length; i++){
      var points = [pointCloud['Points'][i].X,
                    pointCloud['Points'][i].Y,
                    pointCloud['Points'][i].Z];
      graphPoints.push(points);
    }
  }
  return graphPoints;
}

//homogenizeFingerPoints: takes all the various finger and hand points and
//essentially essentially bucket sorts them into handPoints
function homogenizeFingerPoints(){
  handPoints = handPoints.concat(palmHandPoints);
  handPoints = handPoints.concat(thumbFingerPoints);
  handPoints = handPoints.concat(indexFingerPoints);
  handPoints = handPoints.concat(middleFingerPoints);
  handPoints = handPoints.concat(ringFingerPoints);
  handPoints = handPoints.concat(pinkyFingerPoints);
}

//clearPoints: clears all the fingerpoints and graph points temp arrays
function clearPoints(){
  palmHandPoints = new Array();
  thumbFingerPoints = new Array();
  indexFingerPoints = new Array();
  middleFingerPoints = new Array();
  ringFingerPoints = new Array();
  pinkyFingerPoints = new Array();
  handPoints = new Array();
  handPointsGraph = new Array();
}

function plotCloud(){
    if(handPoints.length == 0){
      //If we have no points to plot at all, set up an empty plot
      ScatterPlot(new Array());
    }
    else {
      if(chart == null){
        //If we have points to plot, but no plot set up
        handPointsGraph = convertPointCloudToGraphPoints(new PointCloud("pointsToGraph", handPoints));
        ScatterPlot(handPointsGraph);
      }
      else if(chart != null){    
        //If we have points to plot, but we already have a plot set up
        handPointsGraph = convertPointCloudToGraphPoints(new PointCloud("pointsToGraph", handPoints));
        setChart(handPointsGraph);
      }
    }
}

document.getElementById("record").addEventListener("click",
  function(){
    //turns off recording
    if(recordFlag){
      recordFlag = false;
      document.getElementById("record").textContent = "START Recording";
      output.innerHTML = "";
      
      homogenizeFingerPoints();
      plotCloud();
    }
    //turns on recording
    else{
      clearPoints();
      recordFlag = true;
      document.getElementById("record").textContent = "STOP Recording";
    }
  });

document.getElementById("addGesture").addEventListener("click",
  function(){
    //create point cloud here...
    var gestureName = document.getElementById("gestureName").value;

    //we must have a name and points to use
    if(gestureName != "" && handPoints.length != 0){
      PDollarRecognizer.AddGesture(gestureName, handPoints);

      //reset name and points
      clearPoints();
      //document.getElementById("gestureName").value = "";
    }
  });

/*
document.getElementById("plotCloud").addEventListener("click",
  function(){
    plotCloud();
  });
*/

document.getElementById("identifyGesture").addEventListener("click",
  function(){
    result = PDollarRecognizer.Recognize(handPoints);
  });

//===========================================================
//Leap.loop uses browser's requestAnimationFrame
var options = { enableGestures : true };
var name = "";
var recordFlag = false;

var handID = 0;
var thumbID = 1;
var indexID = 2;
var middleID = 3
var ringID = 4;
var pinkyID = 5;

//Arrays of points we're going to capture
var palmHandPoints = new Array();
var thumbFingerPoints = new Array();
var indexFingerPoints = new Array();
var middleFingerPoints = new Array();
var ringFingerPoints = new Array();
var pinkyFingerPoints = new Array();

var handPoints = new Array(); //temp used to hold points for the cloud
var handPointsGraph = new Array(); //temp used in the correct format to graph
var PDollarRecognizer = new PDollarRecognizer();
var result;   //the result of the identification of the gesture

//Main Leap Loop
Leap.loop(options, function(frame){
  if(recordFlag){
    displayFrameInfo(frame);
    captureHandPoints(frame);
  }
  resultOutput();
  showAvailableGestures();
});
