// Date         Author        Description
//---------------------------------------------
// Mar 30, 2015 Ethan Wessel : Worked on converting to 3D

//the normalized number of points when given any number of points
//Page 278 of paper discusses sampling rate
var NumPoints = 96; //8, 16, 32, 64, 96
var Origin = new Point(0,0,0,0); 	//the normalized origin

//Point Class: creats a point object
//@param x, y, z: the xyz coordinates of the point
//@param id: the id of the stroke
function Point(x, y, z, id)
{
	this.X = x;
	this.Y = y;
	this.Z = z;
	this.ID = id; // stroke ID to which this point belongs (1,2,...)

	//what should the id represent in the 3D space? Different parts of the hand?
}

//PointCloud class: a point-cloud template
//preprocesses and normalizes the point cloud
//@param name: name of the point cloud
//@param points: the points that make up the cloud
function PointCloud(name, points)
{
	this.Name = name;
	this.Points = Resample(points, NumPoints);
	this.Points = Scale(this.Points);
	this.Points = TranslateTo(this.Points, Origin);
}

//Result class
//@param name: the name of the point cloud that is matched
//@param score: the score that is given is relation to confidence that the
//result is actually the result
function Result(name, score)
{
	this.Name = name;
	this.Score = score;
}

// PDollarRecognizer class constants
function PDollarRecognizer() // constructor
{
	this.PointClouds = new Array();
	this.ListOfGestureNames = new Array();  //this is a 2D array, [gestureName, totalGestures]

	// The $P Point-Cloud Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), DeleteUserGestures()

	//Recognize: recognizes the input point cloud
	//@param points: the point that will be compared against the template points
	//@return Result: returns the result of a match or no match
	this.Recognize = function(points)
	{
		//normalize incoming points
		points = Resample(points, NumPoints);
		points = Scale(points);
		points = TranslateTo(points, Origin);

		var b = +Infinity;
		var u = -1;
		for (var i = 0; i < this.PointClouds.length; i++) // for each point-cloud template
		{
			var d = GreedyCloudMatch(points, this.PointClouds[i]);
			if (b > d) {
				b = d; // best (least) distance
				u = i; // point-cloud
			}
		}
		
		if(u == -1){
  		return new Result("No match.", 0.0);
		}
		else{
  		return new Result(this.PointClouds[u].Name, Math.max((2.0 - b) / 2.0, 0.0));
		}
		//return (u == -1) ? new Result("No match.", 0.0) : new Result(this.PointClouds[u].Name, Math.max((b - 2.0) / -2.0, 0.0));
	};

	//Add Gesture: adds the gesture to the list of point cloud templates
	//@param name: the name of the new point cloud
	//@param points: the new points that will be added
	//@return num: the number of the gestures the given name in the templates
	this.AddGesture = function(name, points)
	{
		var num = 0;
		for (var i = 0; i < this.PointClouds.length; i++) {
			if (this.PointClouds[i].Name == name)
				num++;
		}
	
    //add the point cloud
    this.PointClouds[this.PointClouds.length] = new PointCloud(name, points);
		
		//check gesture name count
		if(num == 0){
			//if there is no mention of a name at all in
			//the point clouds then we'll add it as a new name
  		this.ListOfGestureNames.push(name);
  		this.ListOfGestureNames[name] = 1;
		}
		else{
  		//increment the count because we already have a count going
  		this.ListOfGestureNames[name]++;
		}
		
		return num;
	}

	//Delete Gesture: removes all point clouds added
	//@return NumPointClouds: The total length of the original set
	this.DeleteUserGestures = function()
	{
		this.PointClouds.length = 0; //remove all point clouds
		return this.PointCloud.length;
	}

  //NumOfPointClouds: gets the total number of points clouds saved
  //@return PointClouds.length: the total number of point clouds in the set
	this.NumOfPointClouds = function(){
		return this.PointClouds.length;
	}
	
	this.AvailableGestures = function(){
  	return this.ListOfGestureNames;
	}
}
// Private helper functions from this point down

//GreedyCloudMatch: match two cloud points(points and template) by performing repeated alignments between their points
//@param points: points
//@param P: template
//@return min: the minimum alignment cost
function GreedyCloudMatch(points, P)
{
	var e = 0.50;
	var step = Math.floor(Math.pow(points.length, 1 - e));
	var min = +Infinity;
	for (var i = 0; i < points.length; i += step) {
		//The results of Greedy-X depend on the direction of matching
		var d1 = CloudDistance(points, P.Points, i);
		var d2 = CloudDistance(P.Points, points, i);
		min = Math.min(min, Math.min(d1, d2)); // min3
	}
	return min;
}

//Cloud Distance: obtains the total cloud distance by matching points together
//this method is called twice: points -> template and template -> points; Greedy-X algorithm
//@param pts1: points to compare
//@param pts2: template points
//@param start: the starting point of comparision
//@return sum: the sum of the cloud distance between the two clouds
function CloudDistance(pts1, pts2, start)
{
	var matched = new Array(pts1.length); // pts1.length == pts2.length
	for (var k = 0; k < pts1.length; k++)
		matched[k] = false;

	var sum = 0;
	var i = start;
	do
	{
		var index = -1;
		var min = +Infinity;

		//index j is matched to index i
		for (var j = 0; j < matched.length; j++)
		{
			if (!matched[j]) {
				var d = Distance(pts1[i], pts2[j]);
				if (d < min) {
					min = d;
					index = j;
				}
			}
		}
		//j was matched so mark it
		matched[index] = true;

		var weight = 1 - ((i - start + pts1.length) % pts1.length) / pts1.length; //calculate weight
		sum += weight * min; //the sum of all the points matched with an added weight
		i = (i + 1) % pts1.length; //increase i
	} while (i != start);
	return sum;
}

//Resample: resample a points path into n evenly spaced points
//@param points: the points to resample
//@param n: evently spaced points
//@return newpoints: the new resampled points
function Resample(points, n)
{
	var I = PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);

	for (var i = 1; i < points.length; i++)
	{
		if (points[i].ID == points[i - 1].ID)
		{
			//Euclidean Distance
			var d = Distance(points[i - 1], points[i]);
			if ((D + d) >= I)
			{
				var qx = points[i - 1].X + ((I - D) / d) * (points[i].X - points[i - 1].X);
				var qy = points[i - 1].Y + ((I - D) / d) * (points[i].Y - points[i - 1].Y);
				var qz = points[i - 1].Z + ((I - D) / d) * (points[i].Z - points[i - 1].Z);
				var q = new Point(qx, qy, qz, points[i].ID);
				newpoints[newpoints.length] = q; // append new point 'q'
				points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
				D = 0.0;
			}
			else D += d;
		}
	}

	// sometimes we fall a rounding-error short of adding the last point, so add it if so
	if (newpoints.length == n - 1){
		var pointX = points[points.length - 1].X;
		var pointY = points[points.length - 1].Y;
		var pointZ = points[points.length - 1].Z;
		var pointID = points[points.length - 1].ID;
		newpoints[newpoints.length] = new Point(pointX, pointY, pointZ, pointID);
	}
	return newpoints;
}

//Scale: scales with shape preservation
//@param points: the points to scale
//@return newpoints: the new scaled points
function Scale(points)
{
	var minX = +Infinity, maxX = -Infinity;
	var minY = +Infinity, maxY = -Infinity;
	var minZ = +Infinity, maxZ = -Infinity;

	for (var i = 0; i < points.length; i++) {
		//get Min of XYZ
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		minZ = Math.min(minZ, points[i].Z);

		//get Max of XYZ
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
		maxZ = Math.max(maxZ, points[i].Z);
	}
	var size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
	var newpoints = new Array();

	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - minX) / size;
		var qy = (points[i].Y - minY) / size;
		var qz = (points[i].Z - minZ) / size;
		var id = points[i].ID;
		newpoints[newpoints.length] = new Point(qx, qy, qz, id);
	}
	return newpoints;
}

//Translate To: translates points to the origin
//@param points: the points to translate
//@param p:
//@return newpoints: the new points translated to the origin
function TranslateTo(points, pt)
{
	var c = Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		var qz = points[i].Z + pt.Z - c.Z;
		var id = points[i].ID;
		newpoints[newpoints.length] = new Point(qx, qy, qz, id);
	}
	return newpoints;
}

//Centroid: calculates the geometric center of a two-dimensional region
//averge positions of all the points in the shape
//@param points: the points to use to find centroid
//@return new Point: the centroid point
function Centroid(points)
{
	var x = 0.0, y = 0.0, z = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
		z += points[i].Z;
	}
	x /= points.length;
	y /= points.length;
	z /= points.length;
	return new Point(x, y, z);
}

//Path Distance: average distance between corresponding points in two paths
//@param pts1: first set of points
//@param pts2: second set of points
//@return the average distance between two points
function PathDistance(pts1, pts2)
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}

//Path Length: length traversed by a point path
//@param points: the points
//@return d: the length traversed by a point path
function PathLength(points)
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
	{
		if (points[i].ID == points[i-1].ID)
			d += Distance(points[i - 1], points[i]);
	}
	return d;
}

//Distance: Euclidean distance between two points.
//To use 3D points add a third coordinate
//@param p1: point set 1
//@param p2: point set 2
//@return: the total Euclidean distance between the two points
function Distance(p1, p2)
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	var dz = p2.Z - p1.Z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
