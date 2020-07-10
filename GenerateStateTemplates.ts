import * as cheerio from "cheerio";
import fs from "fs";

let stateCodes=[{"UID":1,"name":"Alabama"},{"UID":2,"name":"Alaska"},{"UID":4,"name":"Arizona"},{"UID":5,"name":"Arkansas"},{"UID":6,"name":"California"},{"UID":8,"name":"Colorado"},{"UID":9,"name":"Connecticut"},{"UID":10,"name":"Delaware"},{"UID":11,"name":"District of Columbia"},{"UID":12,"name":"Florida"},{"UID":13,"name":"Georgia"},{"UID":15,"name":"Hawaii"},{"UID":16,"name":"Idaho"},{"UID":17,"name":"Illinois"},{"UID":18,"name":"Indiana"},{"UID":19,"name":"Iowa"},{"UID":20,"name":"Kansas"},{"UID":21,"name":"Kentucky"},{"UID":22,"name":"Louisiana"},{"UID":23,"name":"Maine"},{"UID":24,"name":"Maryland"},{"UID":25,"name":"Massachusetts"},{"UID":26,"name":"Michigan"},{"UID":27,"name":"Minnesota"},{"UID":28,"name":"Mississippi"},{"UID":29,"name":"Missouri"},{"UID":30,"name":"Montana"},{"UID":31,"name":"Nebraska"},{"UID":32,"name":"Nevada"},{"UID":33,"name":"New Hampshire"},{"UID":34,"name":"New Jersey"},{"UID":35,"name":"New Mexico"},{"UID":36,"name":"New York"},{"UID":37,"name":"North Carolina"},{"UID":38,"name":"North Dakota"},{"UID":39,"name":"Ohio"},{"UID":40,"name":"Oklahoma"},{"UID":41,"name":"Oregon"},{"UID":42,"name":"Pennsylvania"},{"UID":44,"name":"Rhode Island"},{"UID":45,"name":"South Carolina"},{"UID":46,"name":"South Dakota"},{"UID":47,"name":"Tennessee"},{"UID":48,"name":"Texas"},{"UID":49,"name":"Utah"},{"UID":50,"name":"Vermont"},{"UID":51,"name":"Virginia"},{"UID":53,"name":"Washington"},{"UID":54,"name":"West Virginia"},{"UID":55,"name":"Wisconsin"},{"UID":56,"name":"Wyoming"}];


//const REGEXP_FIRST_COORD = /m\d+.?d+[ ]*d+.?d+/;
const REGEXP_FIRST_COORD = /m\d+.?\d+[ ]*\d+.?\d+/;

class pathOriginInfo
{

	constructor(public x: number, public y: number, public stringDef : string, public id : string, public fullPath : string)
	{
	
	}
	
	public shiftPath(coords : { x: number, y: number})
	{
		let newPos = "m" + (this.x - coords.x) + " "+(this.y-coords.y);
		let newPath = this.fullPath.replace(this.stringDef,newPos);
		//console.log(newPath);
		return (newPath);
		
	}
}

function generateState(id : number,name : string, data : string)
{
	let $=cheerio.load(data);
	let idCode = (id < 10) ? "c0" + id : "c" + id;
	let counties = $("[id*='"+idCode+"']");
	
	let myGroup = $("<g></g>");
	for(let countyIdx=0;countyIdx<counties.length;countyIdx++)
	{
		myGroup.append(counties.eq(countyIdx));	
	}
	myGroup.attr("stateID",id.toString());
	myGroup.attr("name",name);
	
	let paths=myGroup.find("path");
	
	let minPair = {x:10000, y:10000};
	let maxPair = {x:0, y:0};
	let pathInfoList = new Array<pathOriginInfo>();
	for(let pathIdx=0;pathIdx<paths.length;pathIdx++)
	{
		let curPath=paths.eq(pathIdx);
		let definition = curPath.attr("d") as string;
		let pathID = curPath.attr("id");
		console.log(pathID);
		let match = definition.match(REGEXP_FIRST_COORD);
		if(match!==null)
		{
			let coordString : string = match[0] as string;
			let coords = coordString.substring(1).split(" ");
			let pathInfo = new pathOriginInfo(parseFloat(coords[0]),parseFloat(coords[1]),coordString,pathID as string,definition);
			if((pathInfo.x<minPair.x)) { minPair.x = pathInfo.x;}
			if((pathInfo.y<minPair.y))  { minPair.y = pathInfo.y;}
			if((pathInfo.x>=maxPair.x)) { maxPair.x = pathInfo.x;}
			if((pathInfo.y>=maxPair.y))  { maxPair.y = pathInfo.y;}

			pathInfoList.push(pathInfo);
		}	
	}
	
	if(id===2)
	{
		// Alaska needs to shift"
		minPair.x=minPair.x-40;
	}	
	for(let pathIdx=0;pathIdx<paths.length;pathIdx++)
	{
		let pathInfo=pathInfoList[pathIdx];
		let elem=myGroup.find("#"+pathInfo.id);

		elem.attr("d",pathInfo.shiftPath({x:minPair.x-20,y:minPair.y-20}));
		
		elem.attr("data-bind","{class: countyClasses."+pathInfo.id+"}")
		let title = elem.find("title");
		title.attr("data-bind","{text: countyText."+pathInfo.id + "}")
	}
	console.log(minPair);
	console.log(maxPair);
	
	let myContainer = $("<div></div>");
	myContainer.append(myGroup);
	let fullFile = "<svg  version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:cc=\"http://creativecommons.org/ns#\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">" + "  <style> path {fill:#d0d0d0;stroke:#000;stroke-width:.17829;} </style> "
	fullFile+=myContainer.html() + "</svg>";
	let fileName = "c:/git/VisSystem/templates/states/" + id + ".htm";
	fs.writeFileSync(fileName,fullFile);
}
function generateIndividualStates()
{
	let myFile : string = "./sourceFiles/USCountiesMap.svg";
	let data= fs.readFileSync(myFile).toString();
	for(let stateIdx=0;stateIdx<stateCodes.length;stateIdx++) // Change stateIdx<1 to length 
	{
		let curState = stateCodes[stateIdx];
		generateState(curState["UID"],curState["name"],data);
	}
	
}
generateIndividualStates();
