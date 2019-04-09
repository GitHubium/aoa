/**

TODO:
- Convert class-like functions to classes? maybe
- Fix font issues
- Upload to GitHub


**/

MAXCANVASWIDTH = 1000;
MAXCANVASHEIGHT = 500;

var number_of_teams = 3;// 2 to 10

var notification, Airplane, me, Base, Person, plane, Explosion, buildMenu, teamStats, Tower, Turret, weaponScroller, simple, planeData, buyData, tutorial, pointer, factory;
var buyData, turretData, baseData, planeData, elevationData;
var emptyFunc = function() {};
var scene = 0;
var explosionCount = 0;
var framesPerSecond = 60;
var guiStuffs = [[], [], [], []];
var airObjects = [];
var infoBarObjects = []; // airplanes and buildings which have an HP/sheild status bar
var isMeInsideBase = false;
var fonts;
var teamColors;
var teamNames = [
  "Red Team",
  "Blue Team",
  "Green Team",
  "Team 4",
  "Team 5",
  "Team 6",
  "Team 7",
  "Team 8",
  "Team 9",
  "Team 10",
];
var downKeys = Object.create(null);

var cam, images, createInstances, cameraOverlay;

/** Tools (functions) **/
var X = function (cor, objectHt) { // Calculate on-screen position based on camera variables AND object drawn's height (which defaults to 0)
  objectHt = objectHt || 0;
  return (cor - cam.x) / (cam.ht - objectHt) + cam.hw;
};
var Y = function (cor, objectHt) {
  objectHt = objectHt || 0;
  return (cor - cam.y) / (cam.ht - objectHt) + cam.hh;
};
var S = function (size, objectHt) {
  objectHt = objectHt || 0;
  return size / (cam.ht - objectHt);
};
var RevX = function (pos, objectHt) {
  objectHt = objectHt || 0;
  return (pos - cam.hw) * (cam.ht - objectHt) + cam.x;
};
var RevY = function (pos, objectHt) {
  objectHt = objectHt || 0;
  return (pos - cam.hh) * (cam.ht - objectHt) + cam.y;
};
var RevS = function (size, objectHt) {
  objectHt = objectHt || 0;
  return size * (cam.ht - objectHt);
};
var cameraUpdate = function () {
  /* Mouse drag logic */
  if (cam.isFollowMode) {
    ///cam.followOffsetAngle = ((cam.hw-mouseX)*cos(me.rot)+(cam.hh-mouseY)*sin(me.rot) > 200) ? 180 : 0; // For mouse-behind-camera mode
    cam.followOffsetAngle = (mouseIsPressed && mouseButton === 3) ? 180 : 0;// If mouse middle button is pressed
    cam.x = me.x + RevS(cam.followOffsetDistance * cos(me.rot + cam.followOffsetAngle), me.ht); // Make camera follow player with specific offsets
    cam.y = me.y + RevS(cam.followOffsetDistance * sin(me.rot + cam.followOffsetAngle), me.ht);
  } else { // follow player
    if (mouseIsPressed && mouseButton === RIGHT) {
      cam.dragForceX = (pmouseX - mouseX) * cam.ht;
      cam.dragForceY = (pmouseY - mouseY) * cam.ht;
      cam.x += cam.dragForceX;
      cam.y += cam.dragForceY;
    } else {
      cam.x += cam.dragForceX;
      cam.y += cam.dragForceY;
      cam.dragForceX *= 0.7;
      cam.dragForceY *= 0.7;
    }
  }

  /* I/O key zoom logic */
  if (downKeys[73]) {
    cam.gotoHt += (me.ht-cam.gotoHt)*0.04;
  } else if (downKeys[79]) {
    cam.gotoHt -= (me.ht-cam.gotoHt)*0.04;
  }

  /* Smooth zoom logic */
  if (cam.ht < cam.gotoHt / 1.01) {
    cam.ht += (cam.gotoHt - cam.ht) * 0.4;
  } else if (cam.ht > cam.gotoHt * 1.01) {
    cam.ht -= (cam.ht - cam.gotoHt) * 0.4;
  } else {
    cam.ht = cam.gotoHt;
  }
};
var metersToHt = function (meters) {
  return meters / (1000 * cam.hw);
};
var htToMeters = function (ht) {
  return 1000 * ht * cam.hw;
};
var abbreviateNumber = function(value) {// Source: https://stackoverflow.com/questions/10599933
  var newValue = value;
  if (value >= 1000) {
    var suffixes = ["", "k", "m", "b","t"];
    var suffixNum = Math.floor( (""+value).length/3 );
    var shortValue = '';
    for (var precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat( (suffixNum !== 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
      var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
      if (dotLessShortValue.length <= 2) { break; }
    }
    if (shortValue % 1 !== 0) {shortValue = shortValue.toFixed(1);}
    newValue = shortValue+suffixes[suffixNum];
  }
  return newValue;
};
var buy = function(team, itemName, x, y, angle) {// Angle param is optional
  angle = angle || 90;
  var theItem = buyData[itemName];
  if (theItem.cost <= teamStats.points[team]) {// If team has enough points to build
    if (itemName.slice(0, 6) === "plane_") {///hmmm this whole section
      new Airplane(team, x, y, angle, itemName.slice(6));
    } else {
      new theItem.tempObjectReference(team, x, y);// Place the object on the ground
    }
    teamStats.points[team] -= theItem.cost;
  } else {// You don't have enough points
  if (team === 0) {// If it's your team
  notification.send("Not enough points to build "+itemName+" ("+Math.floor(teamStats.points[0])+"/"+theItem.cost+")", 4);
}

}
};


function cameraOverlay() {
  if (cam.invertCountdown > 0) {
    cam.invertCountdown --;
    filter(INVERT);
  }
};



function setup() {
  // Settings
  var cnv = createCanvas(min(MAXCANVASWIDTH, windowWidth), min(MAXCANVASHEIGHT, windowHeight));
  cnv.mouseWheel(mouseScroll);
  textAlign(CENTER, CENTER);
  angleMode("degrees");
  imageMode(CENTER);

  teamColors = [
    color(255, 0, 0), // red
    color(0, 70, 239), // blue
    color(130, 223, 0),
    color(205, 0, 179),
    color(0, 185, 154),
    color(243, 132, 0),
    color(57, 0, 227),
    color(9, 209, 0),
    color(190, 0, 64),
    color(0, 155, 247),
  ];

  fonts = {
    monoBold: loadFont("Fonts/MonoBold.ttf"),
    airalBold :loadFont("Fonts/ArialBold.ttf"),
    monoItalics: loadFont("Fonts/MonoItalics.ttf"),
    verdanaBold: loadFont("Fonts/VerdanaBold.ttf"),
    verdana: loadFont("Fonts/Verdana.ttf"),
    timeBold: loadFont("Fonts/TimeBold.ttf"),
    impact: loadFont("Fonts/Impact.ttf"),
  };


  cam = { // Camera variables
    ht: 0.1, // ht = height, the number of pixels high the camera is from the ground
    gotoHt: 0.0001, // Used for the smooth effect when zooming with the mouse scroll
    x: 0,
    y: 0,
    dragForceX: 0, // Used for the smooth effect when panning around the map
    dragForceY: 0, // ^
    hw: windowWidth/2, // hw = half width of canvas
    hh: windowHeight/2, // hh = half height of canvas
    followOffsetDistance: 200,
    followOffsetAngle: 0,
    isFollowMode: true,
    invertCountdown: 0,
  };
  images = {
    example: function () { // Declare image name and make function
      rect(10, 10, 100, 100);

      return get(0, 0, 100, 100); // x, y, width, height of the image
    },

    pauseMenuIcon: function() {
      stroke(255, 150);
      strokeWeight(4);
      for (var i = 0; i < 3; i ++) {
        line(2, 5+10*i, 27, 5+10*i);
      }

      return get(0, 0, 30, 30);
    },

    pauseMenuIconHover: function() {
      stroke(255);
      strokeWeight(4);
      for (var i = 0; i < 3; i ++) {
        line(2, 5+10*i, 27, 5+10*i);
      }

      return get(0, 0, 30, 30);
    },

    closeIcon: function() {
      stroke(0, 150);
      strokeWeight(4);
      line(5, 5, 15, 15);
      line(15, 5, 5, 15);

      return get(0, 0, 20, 20);
    },
    closeIconHover: function() {
      stroke(0);
      strokeWeight(4);
      line(5, 5, 15, 15);
      line(15, 5, 5, 15);
      return get(0, 0, 20, 20);
    },
    checkMarkIcon: function() {
      fill(51, 204, 51);
      ellipse(15, 15, 25, 25);
      stroke(0);
      stroke(255);
      strokeWeight(4);
      line(8, 15, 16, 21);
      line(26, 7, 16, 21);
      return get(0, 0, 30, 30);
    },
    grassGrid: function () {
      fill(50, 171, 78);
      for (var i = 0; i < 100; i += 10) {
        for (var j = 0; j < 100; j += 10) {
          if (i % 20 === j % 20) {
            rect(i, j, 10, 10);
          }
        }
      }
      return get(0, 0, 100, 100);
    },

    tower__: function (teamIndex) {
      var teamColor = teamColors[teamIndex];

      // building
      noStroke();
      var buildingColor = color(179);
      fill(buildingColor);
      rect(0, 0, 600, 300);
      fill(lerpColor(color(0), buildingColor, 0.8));
      rect(0, 300, 600, 300);

      // "BASE" text
      textFont("monospace Bold");//25
      fill(0, 0, 0);
      text(teamNames[teamIndex]+" Headquarters", 120, 37);

      // colored lines
      stroke(teamColor);
      strokeWeight(20);
      line(0, 200, 600, 200);
      stroke(lerpColor(color(0), teamColor, 0.8));
      line(0, 400, 600, 400);

      return get(0, 0, 600, 600);
    },

    base__: function (teamIndex) {
      var teamColor = teamColors[teamIndex];

      // building
      noStroke();
      var buildingColor = color(179);
      fill(buildingColor);
      rect(0, 0, 600, 300);
      fill(lerpColor(color(0), buildingColor, 0.8));
      rect(0, 300, 600, 300);

      // "BASE" text
      textFont("monospace Bold");//, 25));
      fill(0, 0, 0);
      text(teamNames[teamIndex]+" Hangar", 120, 37);

      // colored lines
      stroke(teamColor);
      strokeWeight(20);
      line(0, 200, 600, 200);
      stroke(lerpColor(color(0), teamColor, 0.8));
      line(0, 400, 600, 400);

      return get(0, 0, 600, 600);
    },

    turret__: function (teamIndex) {
      var teamColor = teamColors[teamIndex];

      // basic turret
      stroke(teamColor);
      strokeWeight(2);
      fill(127);
      rect(25, 25, 50, 50, 15);
      stroke(63);
      quad(70, 48, 70, 52, 95, 53, 95, 47);
      ellipse(50, 50, 40, 40);

      return get(0, 0, 100, 100);
    },

    planeTemplate: function () {
      /**

      Template for implementing an airplane drawing:

      plane`AirplaneName`: function() {

        `draw code here`

        return get(0, 0, `widthOfDrawing`, `heightOfDrawing`)
      },

      > > > Airplane must face eastward > > >

      **/
      fill(255, 255, 255);
      rect(0, 45, 100, 10);
      rect(70, 0, 15, 100);
      triangle(20, 50, 0, 30, 0, 70);

      return get(0, 0, 100, 100);
    },

    plane_f2a__: function (teamIndex) {
      var teamColor = teamColors[teamIndex];

      // propeller
      strokeCap(ROUND);
      stroke(130, 82, 1, 200);
      strokeWeight(5);
      line(197, 78, 197, 122);

      // propeller axle
      strokeCap(SQUARE);
      stroke(97, 97, 97);
      strokeWeight(4);
      line(196, 100, 193, 100);
      noStroke();

      // engine
      fill(199, 199, 199);
      rect(170, 85, 22, 30, 5);

      // main wing
      fill(lerpColor(color(0), teamColor, 0.8));
      rect(133, 0, 42, 200, 10);

      // body
      quad(160, 85, 160, 115, 30, 110, 30, 90);

      //fill(30, 0, 255);
      beginShape();
      vertex(71, 100);
      vertex(10, 50);
      vertex(10, 83);
      vertex(22, 100);
      vertex(10, 117);
      vertex(10, 150);
      vertex(71, 100);
      endShape();

      // tail
      quad(22, 100, 12, 101, 2, 100, 12, 97.2);
      rect(2, 98, 20, 2);

      // cross drawing on wings
      stroke(255, 255, 255);
      strokeWeight(2);
      fill(0, 0, 0);
      var nodes = [];
      var crossX = 154;
      for (var crossY = 50; crossY < 200; crossY += 100) {
        beginShape();
        for (var i = 0; i < 4; i++) {
          vertex(crossX + 15 * sin(i * 90 + 18), crossY + 15 * cos(i * 90 + 18));
          vertex(crossX + 4 * sin(i * 90 + 45), crossY + 4 * cos(i * 90 + 45));
          vertex(crossX + 15 * sin(i * 90 + 72), crossY + 15 * cos(i * 90 + 72));
        }
        vertex(crossX + 15 * sin(i * 90 + 18), crossY + 15 * cos(i * 90 + 18));
        endShape();
      }

      return get(0, 0, 200, 200);
    },

    plane_f2b__: function (teamIndex) {
      var teamColor = teamColors[teamIndex];

      // Created by: Charlie @CPL00

      //The underneath tail
      fill(150, 125, 63);
      rect(12, 86, 13, 28, 3);
      quad(6, 88, 6, 97, 13, 100, 13, 86);
      quad(6, 105, 6, 113, 13, 114, 13, 101);

      //Main body
      fill(150, 125, 63);
      rect(75, 90, 90, 20);
      quad(24, 97, 75, 90, 75, 110, 24, 105);
      stroke(0, 0, 0);
      line(73, 109, 73, 91);
      noStroke();

      //The engine
      fill(191, 191, 191);
      rect(162, 90, 8, 21);
      ellipse(170, 101, 5, 21);
      fill(158, 97, 32); //The propeller
      rect(172, 97, 3, 10);
      rect(174, 75, 3, 49);

      //The tail
      fill(69, 57, 28);
      rect(2, 100, 25, 2);
      stroke(0, 100);
      line(11, 113, 11, 101);
      line(11, 86, 11, 99);
      noStroke();

      //The cockpit
      fill(179, 80, 34);
      rect(116, 91, 26, 18);
      fill(48, 48, 48);
      ellipse(142, 100, 14, 18);

      //The wings
      fill(115, 94, 46);
      rect(119, 15, 46, 79);
      rect(119, 107, 46, 79);
      rect(137, 94, 25, 14);

      fill(115, 94, 46);
      rect(119, 9, 16, 12, 20);
      rect(123, 11, 41, 12, 20);
      rect(119, 181, 16, 12, 20);
      rect(123, 179, 41, 12, 20);

      //The wing details
      fill(255, 255, 255);
      ellipse(148, 33, 30, 30);
      fill(lerpColor(color(0), teamColor, 0.5));
      ellipse(148, 33, 28, 28);
      fill(255, 255, 255);
      ellipse(148, 33, 19, 19);
      fill(lerpColor(color(0), teamColor, 0.85));
      ellipse(148, 33, 8, 7);
      fill(255, 255, 255); //The bottom
      ellipse(148, 160, 30, 30);
      fill(lerpColor(color(0), teamColor, 0.5));
      ellipse(148, 160, 28, 28);
      fill(255, 255, 255);
      ellipse(148, 160, 19, 19);
      fill(lerpColor(color(0), teamColor, 0.85));
      ellipse(148, 160, 8, 7);

      //The wing lines
      stroke(0, 100);
      line(132, 190, 131, 108);
      line(131, 92, 131, 12);
      line(164, 73, 132, 73);
      line(164, 124, 132, 124);
      line(145, 46, 119, 47); //crossing lines
      line(143, 10, 143, 46);
      line(143, 147, 119, 147);
      line(143, 147, 143, 190);

      return get(0, 0, 200, 200);

    },

    plane_f3__: function (teamIndex) {
      var teamColor = teamColors[teamIndex];
      // Created by: DigitalDragon @DigitalDragon

      var plane = function (x, y, size, r) {
        push();
        translate(x, y);
        scale(size);
        rotate(r);
        translate(-281, -250);
        noStroke();
        fill(118, 96, 83);
        beginShape();
        vertex(243, 315);
        vertex(177, 315);
        vertex(164, 317);
        vertex(91, 328);
        vertex(73, 335);
        vertex(64, 345);
        vertex(66, 356);
        vertex(71, 362);
        vertex(81, 370);
        vertex(100, 380);
        vertex(132, 390);
        vertex(152, 395);
        vertex(177, 401);
        vertex(200, 405);
        vertex(230, 409);
        vertex(251, 412);
        vertex(262, 425);
        vertex(265, 435);
        vertex(266, 417);
        vertex(265, 376);
        vertex(243, 316);
        endShape();
        beginShape();
        vertex(297, 316);
        vertex(344, 315);
        vertex(404, 317);
        vertex(438, 320);
        vertex(457, 324);
        vertex(450, 382);
        vertex(405, 399);
        vertex(378, 404);
        vertex(369, 405);
        vertex(311, 413);
        vertex(303, 421);
        vertex(297, 435);
        vertex(298, 369);
        vertex(297, 317);
        endShape();
        beginShape();
        vertex(267, 272);
        vertex(295, 270);
        vertex(295, 281);
        vertex(266, 284);
        vertex(267, 272);
        endShape();
        beginShape();
        vertex(298, 321);
        vertex(266, 360);
        vertex(265, 438);
        vertex(267, 454);
        vertex(295, 453);
        vertex(298, 438);
        vertex(297, 427);
        vertex(298, 321);
        endShape();
        beginShape();
        vertex(288, 473);
        vertex(271, 508);
        vertex(275, 560);
        vertex(280, 597);
        vertex(287, 556);
        vertex(290, 531);
        vertex(294, 465);
        endShape();
        beginShape();
        vertex(272, 535);
        vertex(261, 538);
        vertex(257, 561);
        vertex(278, 561);
        vertex(272, 535);
        endShape();
        beginShape();
        vertex(276, 566);
        vertex(264, 569);
        vertex(246, 583);
        vertex(266, 583);
        vertex(276, 575);
        vertex(276, 568);
        endShape();
        beginShape();
        vertex(290, 535);
        vertex(305, 536);
        vertex(302, 548);
        vertex(287, 561);
        vertex(290, 535);
        endShape();
        beginShape();
        vertex(239, 542);
        vertex(223, 552);
        vertex(219, 560);
        vertex(217, 568);
        vertex(222, 575);
        vertex(227, 570);
        vertex(233, 557);
        vertex(239, 546);
        endShape();
        beginShape();
        vertex(287, 562);
        vertex(303, 566);
        vertex(304, 582);
        vertex(300, 583);
        vertex(292, 583);
        vertex(284, 574);
        vertex(284, 558);
        vertex(287, 562);
        endShape();
        beginShape();
        vertex(330, 556);
        vertex(339, 555);
        vertex(341, 563);
        vertex(341, 569);
        vertex(337, 574);
        vertex(327, 581);
        vertex(328, 561);
        vertex(330, 557);
        endShape();
        fill(192, 207, 163);
        beginShape();
        vertex(269, 271);
        vertex(270, 262);
        vertex(274, 251);
        vertex(282, 246);
        vertex(289, 251);
        vertex(292, 262);
        vertex(294, 272);
        vertex(267, 272);
        endShape();
        fill(60, 62, 25);
        beginShape();
        vertex(170, 316);
        vertex(146, 318);
        vertex(118, 321);
        vertex(95, 327);
        vertex(93, 334);
        vertex(103, 340);
        vertex(104, 347);
        vertex(100, 362);
        vertex(100, 364);
        vertex(107, 374);
        vertex(114, 376);
        vertex(122, 376);
        vertex(127, 374);
        vertex(139, 366);
        vertex(151, 353);
        vertex(164, 331);
        vertex(170, 317);
        endShape();
        beginShape();
        vertex(266, 316);
        vertex(242, 315);
        vertex(233, 332);
        vertex(227, 342);
        vertex(220, 347);
        vertex(216, 347);
        vertex(213, 337);
        vertex(216, 323);
        vertex(209, 323);
        vertex(204, 331);
        vertex(198, 349);
        vertex(192, 361);
        vertex(185, 367);
        vertex(172, 386);
        vertex(170, 395);
        vertex(175, 395);
        vertex(198, 383);
        vertex(209, 380);
        vertex(211, 385);
        vertex(209, 391);
        vertex(205, 399);
        vertex(202, 405);
        vertex(225, 409);
        vertex(229, 401);
        vertex(244, 386);
        vertex(257, 378);
        vertex(265, 377);
        vertex(266, 316);
        endShape();
        beginShape();
        vertex(296, 276);
        vertex(279, 282);
        vertex(272, 282);
        vertex(265, 281);
        vertex(266, 367);
        vertex(271, 360);
        vertex(281, 342);
        vertex(288, 335);
        vertex(294, 327);
        vertex(297, 321);
        vertex(296, 277);
        endShape();
        beginShape();
        vertex(400, 316);
        vertex(342, 315);
        vertex(343, 324);
        vertex(340, 333);
        vertex(335, 338);
        vertex(315, 347);
        vertex(310, 349);
        vertex(297, 354);
        vertex(297, 395);
        vertex(303, 394);
        vertex(315, 388);
        vertex(327, 381);
        vertex(331, 382);
        vertex(332, 387);
        vertex(323, 400);
        vertex(320, 402);
        vertex(315, 412);
        vertex(372, 405);
        vertex(372, 395);
        vertex(376, 383);
        vertex(390, 369);
        vertex(394, 363);
        vertex(395, 359);
        vertex(388, 355);
        vertex(381, 354);
        vertex(366, 361);
        vertex(359, 361);
        vertex(358, 356);
        vertex(358, 353);
        vertex(369, 338);
        vertex(398, 316);
        endShape();
        beginShape();
        vertex(451, 322);
        vertex(480, 330);
        vertex(495, 339);
        vertex(500, 347);
        vertex(498, 357);
        vertex(486, 369);
        vertex(465, 381);
        vertex(423, 394);
        vertex(403, 399);
        vertex(411, 389);
        vertex(420, 381);
        vertex(429, 378);
        vertex(440, 379);
        vertex(448, 375);
        vertex(447, 369);
        vertex(446, 362);
        vertex(449, 356);
        vertex(453, 352);
        vertex(453, 343);
        vertex(452, 342);
        vertex(448, 334);
        vertex(451, 322);
        endShape();
        beginShape();
        vertex(296, 444);
        vertex(285, 452);
        vertex(279, 454);
        vertex(268, 453);
        vertex(271, 514);
        vertex(275, 510);
        vertex(277, 499);
        vertex(280, 497);
        vertex(286, 490);
        vertex(291, 478);
        vertex(294, 471);
        vertex(296, 444);
        endShape();
        beginShape();
        vertex(266, 535);
        vertex(249, 538);
        vertex(238, 543);
        vertex(232, 557);
        vertex(227, 570);
        vertex(222, 575);
        vertex(233, 581);
        vertex(256, 584);
        vertex(262, 574);
        vertex(262, 574);
        vertex(276, 567);
        vertex(275, 561);
        vertex(268, 560);
        vertex(262, 554);
        vertex(263, 544);
        vertex(268, 536);
        endShape();
        beginShape();
        vertex(305, 536);
        vertex(305, 539);
        vertex(297, 552);
        vertex(287, 560);
        vertex(290, 563);
        vertex(299, 566);
        vertex(303, 570);
        vertex(301, 583);
        vertex(319, 582);
        vertex(328, 579);
        vertex(328, 561);
        vertex(333, 556);
        vertex(340, 556);
        vertex(333, 549);
        vertex(321, 541);
        vertex(305, 536);
        endShape();
        noFill();
        strokeWeight(1);
        stroke(60, 62, 25);
        bezier(96, 326, 86, 346, 114, 324, 100, 363);
        bezier(170, 316, 155, 361, 114, 396, 100, 363);
        bezier(242, 315, 217, 370, 209, 343, 216, 323);
        bezier(185, 367, 205, 355, 199, 318, 216, 323);
        bezier(185, 367, 132, 442, 241, 336, 202, 405);
        bezier(295, 277, 287, 279, 278, 284, 266, 281);
        bezier(297, 318, 294, 332, 287, 334, 279, 345);
        bezier(266, 366, 272, 362, 274, 353, 279, 345);
        bezier(265, 378, 262, 372, 228, 394, 226, 408);
        bezier(296, 443, 286, 455, 278, 455, 267, 453);
        bezier(294, 470, 287, 486, 286, 493, 277, 499);
        bezier(271, 514, 275, 510, 276, 506, 277, 499);
        bezier(240, 541, 231, 553, 232, 566, 223, 575);
        bezier(269, 535, 258, 548, 259, 560, 275, 561);
        bezier(275, 566, 265, 572, 259, 575, 256, 583);
        bezier(305, 537, 303, 555, 273, 561, 297, 565);
        bezier(301, 584, 303, 576, 306, 567, 297, 565);
        bezier(338, 555, 324, 556, 328, 569, 328, 579);
        bezier(297, 355, 311, 344, 348, 347, 342, 315);
        bezier(297, 395, 310, 393, 320, 383, 329, 381);
        bezier(315, 412, 319, 399, 339, 388, 329, 381);
        bezier(381, 354, 349, 375, 345, 349, 399, 316);
        bezier(381, 354, 419, 360, 365, 374, 372, 404);
        bezier(439, 379, 422, 374, 413, 386, 403, 399);
        bezier(439, 379, 460, 374, 435, 367, 453, 352);
        bezier(453, 322, 441, 338, 457, 339, 453, 352);
        stroke(80);
        bezier(266, 316, 0, 304, 0, 382, 250, 412);
        bezier(298, 316, 593, 304, 535, 393, 313, 412);
        bezier(280, 600, 262, 478, 277, 427, 250, 412);
        bezier(280, 600, 303, 484, 284, 427, 313, 412);
        bezier(297, 316, 300, 214, 258, 237, 266, 316);
        line(297, 316, 297, 437);
        line(266, 316, 265, 437);
        bezier(290, 535, 348, 536, 368, 588, 292, 583);
        bezier(272, 535, 214, 536, 188, 588, 267, 583);
        line(267, 583, 276, 575);
        line(292, 583, 284, 575);
        line(280, 540, 287, 556);
        line(280, 540, 274, 556);
        line(280, 540, 280, 600);
        line(252, 413, 252, 315);
        line(311, 413, 311, 315);
        line(179, 384, 252, 388);
        line(385, 384, 312, 388);
        line(178, 376, 178, 400);
        line(385, 376, 385, 401);
        line(106, 373, 179, 377);
        line(458, 373, 385, 377);
        line(106, 325, 106, 381);
        line(458, 325, 458, 382);
        line(223, 553, 236, 566);
        line(336, 552, 322, 566);
        line(274, 566, 236, 566);
        line(286, 566, 322, 566);
        line(298, 577, 312, 577);
        line(298, 577, 295, 583);
        line(312, 577, 315, 583);
        line(246, 577, 261, 577);
        line(261, 577, 264, 583);
        line(246, 577, 243, 583);
        ellipse(235, 355, 10, 20);
        ellipse(328, 355, 10, 20);
        ellipse(282, 438, 4, 12);
        noStroke();
        fill(28, 20, 69);
        ellipse(136, 350, 50, 50);
        ellipse(428, 350, 50, 50);
        fill(240, 156, 41);
        ellipse(271, 460, 7, 33);
        ellipse(292, 460, 7, 33);
        fill(28, 20, 69);
        ellipse(271, 460, 5, 25);
        ellipse(292, 460, 5, 25);
        fill(255);
        ellipse(271, 460, 3, 20);
        ellipse(292, 460, 3, 20);
        fill(160, 10, 32);
        ellipse(271, 460, 1, 15);
        ellipse(292, 460, 1, 15);
        ellipse(136, 350, 20, 20);
        ellipse(428, 350, 20, 20);
        stroke(80);
        fill(72, 71, 77);
        arc(265, 294, 10, 25, 181, 270);
        arc(265, 304, 10, 25, 181, 270);
        arc(265, 314, 10, 25, 181, 270);
        arc(296, 294, 10, 25, 270, 359);
        arc(296, 304, 10, 25, 270, 359);
        arc(296, 314, 10, 25, 270, 359);
        fill(176, 175, 174);
        arc(281, 390, 22, 20, 181, 359);
        arc(281, 373, 18, 20, 362, 539);
        (rect)(273, 403, 16, 20, 0, 0, 2, 2);
        (rect)(270, 390, 22, 20, 0, 0, 2, 2);
        noStroke();
        fill(0, 0, 0, 15);
        ellipse(281, 394, 6, 291);
        fill(0, 0, 0, 20);
        ellipse(281, 394, 3, 291);
        pop();
      };

      plane(178, 100, 0.456, 90);

      return get(0, 0, 200, 200);
    },

    weaponImgEmpty: function() {
      return get(0, 0, 2, 2);
    },

    weaponImgUnknown: function() {
      ///image(getImage("avatars/questionmark"), 10, 10, 20, 20);

      return get(0, 0, 20, 20);
    },

    weaponImgBullet: function() {
      stroke(50);
      strokeWeight(1);
      fill(50);
      rect(0, 4, 10, 12);
      ellipse(10, 10.5, 20, 12);

      return get(0, 0, 20, 20);
    },

    weaponImgBullet2: function() {
      noStroke();
      fill(196,189,167);
      ellipse(30, 10.5, 20, 5);
      fill(212,175,55);
      rect(0, 7, 26, 7);
      quad(26, 7, 26, 14, 29, 13, 29, 8);

      return get(0, 0, 40, 20);
    },
  };




  createInstances = function (gameType) {



    if (gameType === "tutorial") {
      factory.disabled = true;// Temporarily disabled
      tutorial.isOn = true;
      new Tower(0, 0, 0);
      me = new Person(-0.06, 0.01);
    } else if (gameType === "game") {
      factory.disabled = false;// Enabled the whole time
      tutorial.isOn = false;
      new Tower(0, 0.01, 0.02);
      me = new Person(0, 0);
    }

    for (var i = 1; i < number_of_teams; i ++) {// Spawn enemy khan towers
      var angle = 360*i/number_of_teams;
      new Tower(i, 1*cos(angle), 1*sin(angle));
    }

    frameCount = -5;// For teamStats AI spawning logic

  };

  var transparentImage = function( ximg ) {
    // Source: khanacademy.org/cs/-/4329014965

    var i = ximg;
    var w = i.width;
    var h = i.height;
    var g = createGraphics(w,h,'P2D'); //make another drawing board/canvas
    this.img = g; // holds modified image data
    this.width = i.width;
    this.height= i.height;

    g.beginDraw();
    g.background(255, 255, 255, 0); //fill it with a transparent color
    g.image(i); //draw the image on it
    g.endDraw();

    this.opacity = function( opacity )
    {
      opacity = opacity+0.0001 || 0.5;
      g.beginDraw();
      g.background(255, 255, 255, 0); //fill it with a transparent color
      g.image(i); //draw the image on it
      g.loadPixels();
      var p=g.imageData;
      p=p.data; //p[] now contains the pixel data of g, in RGBARGBA... format

      for(var j=p.length-1;j>0;j-=4){ //loop backwards through the pixel data by fours
        p[j]*= opacity; //multiply opacity byte
      }

      g.updatePixels(); //put pixel data back into g
      g.endDraw();
      return this;
    };

    // Draw image using original aspect ration with optional scaling in proportion.
    this.draw = function(x,y,size) {
      image(this.img, x, y, size, size);
    };

    return this;
  };



  /** Classes **/


  var Notification = function () {
    this.messages = [];
    this.typesColors = [null, color(255, 255, 255), color(255, 59, 59), color(0, 255, 0), color(255, 127, 0)];
    this.types = []; // 1 = normal (white), 2 = warning (red), 3 = good in game (green), 4 = bad in game (orange)
    this.timesLeft = []; // How much time before the notification fades out
    this.messageCountLimit = height / 25 - 1;

    this.send = function (newMessage, newType, newTimeLeft) {
      if (this.messages.length >= this.messageCountLimit) { // If messages are going off the screen (too many)

        // Search through messages for first non-important message (important means type=2)
        var found = false;
        for (var i = 0; i < this.messages.length; i++) {
          if (this.types[i] !== 2) {
            this.messages.splice(i, 1);
            this.types.splice(i, 1);
            this.timesLeft.splice(i, 1);
            found = true;
            break;
          }
        }

        // If all messages are important, delete the first one
        if (!found) {
          this.messages.splice(0, 1);
          this.types.splice(0, 1);
          this.timesLeft.splice(0, 1);
        }

      }
      newType = newType || 1; // newType is an optional parameter
      newTimeLeft = newTimeLeft || 240; // newTimeLeft is an optional parameter. Default is 4 seconds

      this.messages.push(newMessage);
      this.types.push(newType);
      this.timesLeft.push(newTimeLeft);

      return this;// For stacking .send().send().send()
    };

    this.update = function () {
      textAlign(LEFT, BOTTOM);
      textFont(fonts.monoBold, 13);

      for (var i = 0; i < this.messages.length; i++) {

        fill(0, 0, 0, min(170, this.timesLeft[i] * 10));
        rect(3, 3 + i * 25, 8 + this.messages[i].length * 8.3, 23, 4);
        fill(this.typesColors[this.types[i]], min(255, this.timesLeft[i] * 10));
        text(this.messages[i], 9, 23 + i * 25);
        this.timesLeft[i]--;
        if (this.timesLeft[i] <= 0) {
          this.messages.splice(i, 1);
          this.types.splice(i, 1);
          this.timesLeft.splice(i, 1);
        }
      }

      textAlign(CENTER, CENTER);
    };

  };

  var MenuButton = function (onScene, message, x, y, w, h, action, buttonColor) {// Color param is optional
    guiStuffs[onScene].push(this);

    this.message = message;
    this.posX = x;
    this.posY = y;
    this.w = w;
    this.h = h;
    this.x1 = x - w/2;
    this.y1 = y - h/2;
    this.action = action;
    this.mouseOver = false;
    this.buttonColor = buttonColor || color(255, 153, 0);
    this.transButtonColor = color(red(this.buttonColor), green(this.buttonColor), blue(this.buttonColor), 200);

    this.onMouseDown = function() {
      if (this.mouseOver) {
        this.action();
      }
    };

    this.onMouseUp = emptyFunc;

    this.update = function () {
      if (mouseY > this.y1*height && mouseY < (this.y1+this.h)*height && mouseX > this.x1*width && mouseX < (this.x1+this.w)*width) {
        this.mouseOver = true;
      } else {
        this.mouseOver = false;
      }
      if (this.mouseOver) {
        stroke(this.buttonColor);
        fill(this.transButtonColor);
      } else {
        stroke(255, 255, 255);
        fill(255, 255, 255, 200);
      }
      strokeWeight(5);
      rect(this.x1*width, this.y1*height, this.w*width, this.h*height);

      textFont(fonts.monoItalics, 180*this.h);
      fill(0, 0, 0);
      text(this.message, this.posX*width, this.posY*height);
      noStroke();
    };
  };

  var ImageLoader = function () { // Class that loads images one frame at a time
    this.imageIndex = 0; // Image index that is currently being generated
    this.imagesKeys = Object.keys(images); // The names of the images (e.g. sample)
    this.isWorking = true; // Is not done loading
    this.subTeamIndex = 0;

    this.update = function () {
      if (this.isWorking) {

        clear();
        var nameOfImage = this.imagesKeys[this.imageIndex]; // name of image

        if (nameOfImage.slice(-2) === "__") {// If last 2 characters are "__"

        if (this.subTeamIndex < number_of_teams) {// If not done drawing sub-teams

          images[nameOfImage+"team"+this.subTeamIndex] = images[nameOfImage](this.subTeamIndex);
          this.subTeamIndex ++;

        } else {// If done
          delete images[nameOfImage];// e.g. remove base__ from images but keep base__team0
          this.imageIndex ++;
          this.subTeamIndex = 0;
        }

      } else {
        images[nameOfImage] = images[nameOfImage]();
        this.imageIndex ++;
      }


      if (this.imageIndex >= this.imagesKeys.length) {
        this.isWorking = false;
      }

    } else {
      notification.send("All images loaded.");
      buildMenu.upgradeBuildOptions(0);
      tutorial.fixImages();
      scene++;
    }
    noStroke();
  };
};

var WeaponScroller = function () {
  this.y1 = 0;
  this.isMouseInside = false;
  this.x1 = width-80;
  this.descriptionBoxColor = color(219, 122, 37);

  this.onMouseScroll = function (scrollValue) {
    if (me.weapons.length !== 0) {
      if (scrollValue > 0) {
        if (me.weaponIndex2 === 0) {
          me.weaponIndex2 = (me.weapons.length >> 1) - 1;
        } else {
          me.weaponIndex2--;
        }
      } else {
        me.weaponIndex2++;
        if (me.weaponIndex2 >= me.weapons.length >> 1) {
          me.weaponIndex2 = 0;
        }
      }
    }
  };

  this.onMouseDown = function (mouseBut) {
    if (me.weapons.length !== 0 && !this.isMouseInside && !buildMenu.isMouseInside) {
      if (mouseBut === LEFT) {
        me.weapons[me.weaponIndex2*2].onMouseDown();
      } else if (mouseBut === RIGHT) {
        me.weapons[me.weaponIndex2*2+1].onMouseDown();
      }
    }
  };

  this.onMouseUp = function (mouseBut) {// Unfixable BUG here... mouseBut doesn't always yeild the correct value
  if (me.weapons.length !== 0 && !this.isMouseInside && !buildMenu.isMouseInside) {
    if (mouseBut === LEFT) {
      me.weapons[me.weaponIndex2*2].onMouseUp();
    }
    if (mouseBut === RIGHT) {
      me.weapons[me.weaponIndex2*2+1].onMouseUp();
    }
  }
};

this.meUpgradeOldWeaponsCleanup = function() {// Fixes laser and other bugs
  me.weaponIndex2 = 0;// Solves a bug
  for (var i = 0; i < me.weapons.length; i ++) {
    me.weapons[i].onMouseUp();
  }
  delete me.weapons;/// Not sure if this is required...
};

this.update = function () {
  if (me.weapons.length !== 0) {
    textFont(fonts.verdanaBold, 10);
    strokeWeight(1);

    var y2 = 20 * me.weapons.length;// Top edge of the grid thing y cordinate

    this.isMouseInside = mouseX >= this.x1 && mouseY < y2;

    var midIndex = me.weapons.length >> 1;
    var shouldBeIndex2 = Math.floor((mouseY) / 40);

    for (var i = 0; i < midIndex; i++) {

      // Draw boxes
      fill(230, 155 + this.isMouseInside * 100);
      var yCor = 40 * i;

      if (this.isMouseInside && shouldBeIndex2 === i) {// If mouseY is hovering over a row of boxes
        if (mouseX < this.x1+40) {// MouseX hovering over the first column of boxes
          stroke(this.descriptionBoxColor);
          rect(this.x1, yCor, 38, 38);
          stroke(0);
          rect(this.x1+40, yCor, 38, 38);
        } else {// MouseX hovering over the second column of boxes
          stroke(0);
          rect(this.x1, yCor, 38, 38);
          stroke(this.descriptionBoxColor);
          rect(this.x1+40, yCor, 38, 38);
        }
      } else {
        if (mouseIsPressed && this.isMouseInside) {
          me.weaponIndex2 = shouldBeIndex2;
        }
        stroke(0);
        rect(this.x1, yCor, 38, 38);
        rect(this.x1+40, yCor, 38, 38);
      }

      // Red overlay of the currently selected weapon set
      if (me.weaponIndex2 === i) {
        stroke(teamColors[0]);
        noFill();
        rect(this.x1-1, yCor-1, 80, 40);
      }

      // Draw image and stats
      image(me.weapons[i * 2].image, this.x1+19, yCor+20);
      image(me.weapons[i * 2 + 1].image, this.x1+59, yCor+20);
      noStroke();
      fill(50);
      textAlign(LEFT, BOTTOM);
      text(me.weapons[i * 2].statDamage, this.x1+2, yCor + 10);
      text(me.weapons[i * 2 + 1].statDamage, this.x1+41, yCor + 10);
      textAlign(RIGHT, BOTTOM);
      text(me.weapons[i * 2].statFireRate, this.x1+39, yCor + 36);
      text(me.weapons[i * 2 + 1].statFireRate, this.x1+78, yCor + 36);
      textAlign(CENTER, CENTER);// Reset textAlign to original
    }

    if (this.isMouseInside) {
      // Description box
      fill(180);// Gray color
      if (me.weaponIndex2 === shouldBeIndex2) {
        stroke(teamColors[0]);
      } else {
        stroke(this.descriptionBoxColor);
      }
      rect(this.x1-310, 10, 300, 100);// Box
      fill(0);
      var descripIndex1 = shouldBeIndex2 * 2 + Number(mouseX >= this.x1+40);// Number() converts boolean (true, false) into a number (1, 0)
      textFont(fonts.verdana, 15);
      text(me.weapons[descripIndex1].name, this.x1-155, 20);// Title
      textFont(fonts.verdanaBold, 20);
      text(me.weapons[descripIndex1].description, this.x1-155, 60);// Description
    }
    noStroke();
  } else {
    this.isMouseInside = false;
  }
};
};

var ProjectileTemplate = function(weaponSource) {// create instance of this when weapon is fired
  // Always the same
  this.isDead = false;
  airObjects.push(this);
  this.isVisible = true;
  this.weaponSource = weaponSource;
  this.planeObj = weaponSource.planeObj;
  this.x = this.planeObj.x;
  this.y = this.planeObj.y;
  this.ht = this.planeObj.ht;
  this.rot = this.planeObj.rot;

  // Projectile-specific
  this.radius = 0.002;
  this.vel = 0.002 + this.planeObj.vel;
  this.chX = this.vel * cos(this.rot);
  this.chY = this.vel * sin(this.rot);
  this.lifeLeft = 180; // 3 seconds
  this.hp = 1; // potential damage

  this.handlePlaneDeath = function(plane) {
    plane.hp -= this.hp;
    if (this.isAnti) {// If projectile is made out of anti-matter
      cam.invertCountdown = 2;
    }
    if (plane.hp <= 0) {
      if (plane.isDead) {// If plane was already destroyed on the exact same frame
        plane.myExplosion.generateMoreFire();
      } else {
        var explo = new Explosion(plane, 1);
        plane.isDead = true;
        plane.myExplosion = explo;
        if (this.planeObj === me) {// If you shot down the plane yourself
          notification.send("You shot down a " + plane.name, 3);
        }
      }
    }
    this.isDead = true;
  };

  this.update = function () {
    this.x += this.chX;
    this.y += this.chY;
    if (!--this.lifeLeft) { // decrement by 1, check for 0 value
      this.isDead = true;
    } else {
      // Collisions
      for (var j = infoBarObjects.length - 1; j >= 0; j--) {
        var plane = infoBarObjects[j];
        if (this.planeObj.team !== plane.team && // NO friendly fire
          Math.sqrt(sq(this.x - plane.x) + sq(this.y - plane.y)) < plane.radius + this.radius) {// it hit!
            this.handlePlaneDeath(plane);
            break;
          }
        }
      }
    };

    this.drawActualThing = function() {
      ellipse(0, 0, S(this.radius, this.ht), S(this.radius * 0.3, this.ht));
    };

    this.draw = function () {
      var displayedX = X(this.x, this.ht);
      var displayedY = Y(this.y, this.ht);
      if (displayedX > -10 && displayedX < width+10 && displayedY > -10 && displayedY < height+10) { // if projectile is in view
        this.isVisible = true;
        fill(0, 0, 0);
        push();
        translate(displayedX, displayedY);
        rotate(this.rot);
        this.drawActualThing();// Whether it be an image, ellipse, rect, etc
        pop();
      } else {
        this.isVisible = false;
      }
    };
  };

  var projectile = {
    BulletCenter: function (weaponSource) {
      ProjectileTemplate.call(this, weaponSource);
    },

    Bullet2Center: function (weaponSource) {
      ProjectileTemplate.call(this, weaponSource);
      this.hp = 5;
      this.vel = 0.001 + this.planeObj.vel;
      this.chX = this.vel * cos(this.rot);
      this.chY = this.vel * sin(this.rot);/// don't override twice HMMMMM
      this.image = images.weaponImgBullet2;

      this.drawActualThing = function () {
        image(this.image, 0, 0, S(this.radius*2, this.ht), S(this.radius, this.ht));
      };
    },

    BulletLeft: function(weaponSource) {
      ProjectileTemplate.call(this, weaponSource);
      this.x = this.planeObj.x + sin(this.planeObj.rot) * this.planeObj.radius * 0.5;
      this.y = this.planeObj.y - cos(this.planeObj.rot) * this.planeObj.radius * 0.5;
    },

    BulletRight: function(weaponSource) {
      ProjectileTemplate.call(this, weaponSource);
      this.x = this.planeObj.x - sin(this.planeObj.rot) * this.planeObj.radius * 0.5;
      this.y = this.planeObj.y + cos(this.planeObj.rot) * this.planeObj.radius * 0.5;
    },

    AntiBulletCenter: function (weaponSource) {
      ProjectileTemplate.call(this, weaponSource);
      this.hp = 100;
      this.isAnti = true;
      this.lifeLeft = 120; // 2 seconds


      this.draw = function () {// In a case like this this.isVisible is always true

        push();
        translate(X(this.x, this.ht), Y(this.y, this.ht));
        var zsize = S(this.radius, this.ht);
        var zsize2 = zsize*2;
        strokeWeight(zsize *0.05);
        rotate(this.rot);
        stroke(0);
        for (var i = 0; i < this.lifeLeft>>1; i ++) {// >>1 means divided by 2
          line(random(-zsize2, zsize2), random(-zsize2, zsize2), random(-zsize2, zsize2), random(-zsize2, zsize));
        }
        noStroke();
        fill(255);
        ellipse(0, 0, zsize, zsize*0.3);
        pop();
      };
    },

    Laser1: function(weaponSource) {
      ProjectileTemplate.call(this, weaponSource);
      this.on = false;// Laser has no effect when this is false
      this.radius = 0.0003;

      this.update = function () {
        if (this.planeObj.isDead) {// Remove laser if parent plane is dead
          this.isDead = true;
        }

        if (this.on) {
          this.x = this.planeObj.x;
          this.y = this.planeObj.y;
          this.rot = this.planeObj.rot;
          var chX = cos(this.rot);
          var chY = sin(this.rot);
          this.x2 = this.x + chX*100;// Range is infinite, but the laser is drawn at 100 kilometers
          this.y2 = this.y + chY*100;
          this.ht = this.planeObj.ht - 0.000001;

          // Circle(Plane)-Ray(Laser) Collisions
          var distance = Math.sqrt(sq(chX)+sq(chY));
          chX /= distance;
          chY /= distance;
          for (var j = infoBarObjects.length - 1; j >= 0; j--) {
            var plane = infoBarObjects[j];
            if (this.planeObj.team !== plane.team) {// if bullet isn't from the original

            // Equation from https://stackoverflow.com/questions/1073336
            var t = chX*(plane.x-this.x) + chY*(plane.y-this.y);
            var Ex = t*chX+this.x;
            var Ey = t*chY+this.y;
            var LECsq = sq(Ex-plane.x)+sq(Ey-plane.y);
            if (LECsq < sq(plane.radius)) {// Circle-Line intersection, now we have to check that we're shooting the laser in the right direction
            var planeAngle = atan2(plane.y-this.y, plane.x-this.x);
            var meAngle = this.rot % 360;
            if (meAngle > planeAngle+180) {
              meAngle -= 360;
            } else if (meAngle < planeAngle-180) {
              meAngle += 360;
            }
            if (abs(planeAngle-meAngle) < 90) {// If within 90 degrees of laser direction
              this.handlePlaneDeath(plane);
              this.isDead = false;// Laser can't die
            }
          }
        }
      }
    }
  };

  this.draw = function () {
    if (this.on) {
      stroke(0, 255, 0, 200);
      strokeWeight(S(this.radius));
      line(X(this.x, this.ht), Y(this.y, this.ht), X(this.x2, this.ht), Y(this.y2, this.ht));
      noStroke();

    }
  };

}

};

var WeaponTemplate = function(planeObj) { // Template class
  this.planeObj = planeObj;// Link with a source airplane/turret/etc


  this.onMouseDown = function () {
    new projectile.BulletCenter(this);
  };

  this.onMouseUp = emptyFunc;

  this.update = emptyFunc;
};

var weapon = {

  Empty: function(planeObj) {
    this.name = "Empty Slot";
    this.planeObj = planeObj;
    this.image = images.weaponImgEmpty;
    this.statDamage = "";
    this.statFireRate = "";

    this.onMouseDown = emptyFunc;// Do nothing

    this.onMouseUp = emptyFunc;// Do nothing

    this.update = emptyFunc;// Do nothing
  },

  ShooterManual: function(planeObj) {
    this.name = "Shooter";
    WeaponTemplate.call(this, planeObj);
    this.statDamage = 1;
    this.statFireRate = "M";
    this.image = images.weaponImgBullet;
  },

  ShooterAuto: function(planeObj) {
    this.name = "Auto Shooter";
    WeaponTemplate.call(this, planeObj);
    this.statDamage = 1;
    this.statFireRate = 3;
    this.image = images.weaponImgBullet;
    this.isShooting = false;

    this.onMouseDown = function () {
      this.isShooting = true;
    };

    this.onMouseUp = function () {
      this.isShooting = false;
    };

    this.update = function() {
      if (this.isShooting && frameCount % 3 === 0) {
        new projectile.BulletCenter(this);
      }
    };
  },

  ShooterAutoDouble: function(planeObj) {
    this.name = "Auto Double Shooter";
    WeaponTemplate.call(this, planeObj);
    this.statDamage = 1;
    this.statFireRate = 1.5;
    this.image = images.weaponImgBullet;
    this.isShooting = false;

    this.onMouseDown = function() {
      this.isShooting = true;
    };

    this.onMouseUp = function() {
      this.isShooting = false;
    };

    this.update = function() {
      if (this.isShooting && frameCount % 3 === 0) {
        new projectile.BulletLeft(this);
        new projectile.BulletRight(this);
      }
    };
  },

  Shooter2Manual: function(planeObj) {
    this.name = "Shooter ++";
    WeaponTemplate.call(this, planeObj);
    this.statDamage = 5;
    this.statFireRate = "M";
    this.image = images.weaponImgBullet2;

    this.onMouseDown = function () {
      new projectile.Bullet2Center(this);
    };
  },

  Shooter2Auto: function(planeObj) {
    this.name = "Auto Shooter ++";
    WeaponTemplate.call(this, planeObj);
    this.statDamage = 5;
    this.statFireRate = 3;
    this.image = images.weaponImgBullet2;
    this.isShooting = false;

    this.onMouseDown = function() {
      this.isShooting = true;
    };

    this.onMouseUp = function() {
      this.isShooting = false;
    };

    this.update = function() {
      if (this.isShooting && frameCount % 3 === 0) {
        new projectile.Bullet2Center(this);
      }
    };
  },


  AntiShooterManual: function(planeObj) {
    this.name = "Antimatter Shooter";
    WeaponTemplate.call(this, planeObj);
    this.statDamage = 100;
    this.statFireRate = "M";
    this.image = images.weaponImgUnknown;
    this.isShooting = false;

    this.onMouseDown = function() {
      new projectile.AntiBulletCenter(this);
    };
  },

  Laserer: function(planeObj) {
    this.name = "Laser";
    this.statDamage = 1;
    this.statFireRate = 1;
    this.planeObj = planeObj;
    this.laser = new projectile.Laser1(this);
    this.image = images.weaponImgUnknown;

    this.onMouseDown = function () {
      this.laser.on = true;
    };

    this.onMouseUp = function () {
      this.laser.on = false;
    };

    this.update = emptyFunc;
  },

  RandomShooter: function(planeObj) { // Template class
    this.name = "Random Shooter";
    this.statDamage = "?";
    this.statFireRate = "?";
    this.laser = new projectile.Laser1(this);
    this.image = images.weaponImgUnknown;

    this.projectilePossibilities = ["BulletCenter", "Bullet2Center", "BulletLeft", "BulletRight", "AntiBulletCenter"];// Lasers don't work
    this.numOfPossibilities = this.projectilePossibilities.length-0.000001;

    this.onMouseDown = function () {
      new projectile[this.projectilePossibilities[Math.floor(random(0, this.numOfPossibilities))]](this);
    };

    this.onMouseUp = function () {
    };

    this.update = function() {
    };
  },

};





SupportPillar = function(team, x, y, parentBuilding) {
  this.name = "Support Pillar";
  this.isDead = false;
  airObjects.push(this);
  infoBarObjects.push(this);
  this.team = team;
  this.x = x;
  this.y = y;
  this.parentBuilding = parentBuilding;
  this.ht = parentBuilding.ht-0.0000001;
  this.hp = this.hpMax = 50;
  this.radius = 0.0025;
  this.isVisible = parentBuilding.isVisible;
  this.zx = this.zy = this.gx = this.gy = 0;// Set by parentBuilding
  this.weapons = [];// Required property for weaponScroller to work
  this.driver = null;// Required property to jump inside pillars

  this.update = function() {
    this.isVisible = this.parentBuilding.isVisible;
  };

  this.onKeyUp = emptyFunc;

  this.onKeyDown = function() {
    if (keyCode === 13) {// if enter is pressed, player jumps out of pillar
      me = this.driver;
      this.hp /= 10;
      this.hpMax = this.hp;
      this.driver = null;
      me.isDead = false;
      airObjects.push(me);
    }
  };

  this.draw = function() {
    if (this.isVisible) {
      stroke(116, 119, 122);
      strokeWeight(S(this.radius*2));
      line(this.gx, this.gy, this.zx, this.zy);
      noStroke();
    }
  };

  this.infoBar = function () { // shows HP and height when to planes on map (don't override)
  fill(teamColors[this.team]);
  var hpBarLength = 40 * this.hp / this.hpMax;
  rect(this.zx - 20, this.zy - 20, hpBarLength, 2);
  fill(teamColors[this.team], 50);
  rect(this.zx + hpBarLength - 20, this.zy - 20, 40 - hpBarLength, 2);
};
};

Tower = function(team, x, y) {
  this.name = "Khan Academy Tower";
  this.isDead = false;
  teamStats.teamTower[team] = this;
  airObjects.push(this);
  infoBarObjects.push(this);
  this.team = team;
  this.x = x;
  this.y = y;
  ///this.image = getImage("avatars/leaf-green");
  this.image = loadImage("Images/questionmark.png");
  this.radius = 0.01;
  this.ht = metersToHt(18); // ~60 feet
  this.hp = this.hpMax = 1000;
  this.color1 = color(lerpColor(color(0), teamColors[this.team], 0.8), 100);
  this.color2 = color(teamColors[this.team], 100);

  this.update = function () {
    if (this.isVisible) {
      this.gx = X(this.x);// Ground-x
      this.gy = Y(this.y);// Ground-y
      this.gRadius = S(this.radius);// Ground-size
      this.zx = X(this.x, this.ht);// Top-x
      this.zy = Y(this.y, this.ht);// Top-y
      this.zRadius = S(this.radius, this.ht);// Top-size

      if (this.gx-this.gRadius > width || this.gx+this.gRadius < 0 || this.gy-this.gRadius > height || this.gy+this.gRadius < 0) {// if tower not in view
        this.isVisible = false;
      }
    } else {
      if (X(this.x-this.radius) < width && X(this.x+this.radius) > 0 && Y(this.y-this.radius) < height && Y(this.y+this.radius) > 0) {// if tower in view
        this.isVisible = true;
      }
    }
  };

  this.draw = function () {
    if (this.isVisible) {
      fill(144, 149, 153);

      ellipse(this.gx, this.gy, this.gRadius*2, this.gRadius*2);

      var angleTowerToPlayer = atan2(me.y-this.y, me.x-this.x)+90;
      var zChX = this.zRadius*cos(frameCount);
      var zChY = this.zRadius*sin(frameCount);
      var gChX = this.gRadius*cos(frameCount);
      var gChY = this.gRadius*sin(frameCount);
      fill(this.color1);
      quad(this.zx-zChX, this.zy-zChY,
        this.zx+zChX, this.zy+zChY,
        this.gx+gChX, this.gy+gChY,
        this.gx-gChX, this.gy-gChY
      );
      var zChX = this.zRadius*cos(-frameCount*1.3);
      var zChY = this.zRadius*sin(-frameCount*1.3);
      var gChX = this.gRadius*cos(-frameCount*1.3);
      var gChY = this.gRadius*sin(-frameCount*1.3);
      fill(this.color2);
      quad(this.zx-zChX, this.zy-zChY,
        this.zx+zChX, this.zy+zChY,
        this.gx+gChX, this.gy+gChY,
        this.gx-gChX, this.gy-gChY
      );

      stroke(23);
      fill(144, 149, 153, 100);
      strokeWeight(this.zRadius/64);
      ellipse(this.zx, this.zy, this.zRadius*1.9, this.zRadius*1.9);
      image(this.image, this.zx, this.zy, this.zRadius, this.zRadius);

      noStroke();
    }
  };

  this.infoBar = function() {
    fill(teamColors[this.team]);
    var hpBarLength = 40 * this.hp / this.hpMax;
    rect(this.zx - 20, this.zy - this.zRadius, hpBarLength, 2);
    fill(teamColors[this.team], 50);
    rect(this.zx + hpBarLength - 20, this.zy - this.zRadius, 40 - hpBarLength, 2);
  };
};

Base = function (team, x, y) {
  this.name = "Team "+team+" Hangar";
  this.isDead = false;
  airObjects.push(this);
  teamStats.teamBases[team].push(this);
  this.team = team;
  this.x = x;
  this.y = y;
  this.image = images["base__team" + team];
  this.ht = metersToHt(12.192); // 40 feet
  this.size = 0.1;
  this.x1 = this.x-this.size/2;
  this.x2 = this.x+this.size/2;
  this.y1 = this.y-this.size/2;
  this.y2 = this.y+this.size/2;
  this.isVisible = true;
  this.supports = [
    new SupportPillar(this.team, this.x1, this.y1, this),
    new SupportPillar(this.team, this.x2, this.y1, this),
    new SupportPillar(this.team, this.x1, this.y2, this),
    new SupportPillar(this.team, this.x2, this.y2, this)
  ];

  this.meCollide = function() {
    return me.ht < this.ht && me.x > this.x1 && me.x < this.x2 && me.y > this.y1 && me.y < this.y2;
  };

  this.update = function () {
    if (this.isVisible) {
      this.zx1 = X(this.x1, this.ht);
      this.zx2 = X(this.x2, this.ht);
      this.zy1 = Y(this.y1, this.ht);
      this.zy2 = Y(this.y2, this.ht);
      this.zSize = S(this.size, this.ht);
      this.gx1 = X(this.x1);
      this.gx2 = X(this.x2);
      this.gy1 = Y(this.y1);
      this.gy2 = Y(this.y2);
      this.gSize = S(this.size);
      this.supports[0].gx = this.gx1;///inherit from metaclass
      this.supports[0].gy = this.gy1;
      this.supports[1].gx = this.gx2;
      this.supports[1].gy = this.gy1;
      this.supports[2].gx = this.gx1;
      this.supports[2].gy = this.gy2;
      this.supports[3].gx = this.gx2;
      this.supports[3].gy = this.gy2;
      this.supports[0].zx = this.zx1;///inherit from metaclass
      this.supports[0].zy = this.zy1;
      this.supports[1].zx = this.zx2;
      this.supports[1].zy = this.zy1;
      this.supports[2].zx = this.zx1;
      this.supports[2].zy = this.zy2;
      this.supports[3].zx = this.zx2;
      this.supports[3].zy = this.zy2;

      fill(144, 149, 153);
      rect(this.gx1, this.gy1, this.gSize, this.gSize);
      noStroke();

      if (this.zx1 > width || this.zx2 < 0 || this.zy1 > height || this.zy2 < 0) {// if tower not in view
        this.isVisible = false;
      }
    } else {
      if (X(this.x1, this.ht) < width && X(this.x2, this.ht) > 0 && Y(this.y1, this.ht) < height && Y(this.y2, this.ht) > 0) {// if tower in view
        this.isVisible = true;
      }
    }

    // Check if supports are dead, if so, handle them
    for (var i = 0; i < this.supports.length; i ++) {
      var sup = this.supports[i];
      if (sup.isDead) {// This is called once before this object dies
        var pbs = this.supports;// Parent building supports
        var deadPillarCount = 0;
        for (var j = 0; j < pbs.length; j ++) {
          if (pbs[j].isDead) {
            deadPillarCount ++;
          }
        }
        if (deadPillarCount >= 2) {
          this.isDead = true;
        }
      }
    }

    // Check if hangar itself is dead, if so, make support pillars dead too so they are auto-removed from their lists
    if (this.isDead) {
      for (var i = 0; i < this.supports.length; i ++) {
        this.supports[i].isDead = true;
      }
      this.radius = this.size/2;
      var explo = new Explosion(this, 2);// Create hangar explosion, pillars explode in meCollide

    }
  };

  this.draw = function () {
    if (this.isVisible) {
      if (this.meCollide()) {
        isMeInsideBase = true;
        fill(0);
        rect(0, 0, this.zx1, 600);
        rect(this.zx2, 0, 600-this.zx2, 600);
        rect(this.zx1, 0, this.zx2+1-this.zx1, this.zy1);
        rect(this.zx1, this.zy2, this.zx2+1-this.zx1, 600-this.zy2);

      } else {
        image(this.image, X(this.x, this.ht), Y(this.y, this.ht), this.zSize, this.zSize);
      }
    }

  };
};

Turret = function(team, x, y) {
  this.name = "Team "+team+" Turret";
  this.isDead = false;
  airObjects.push(this);
  infoBarObjects.push(this);
  this.team = team;
  this.x = x;
  this.y = y;
  this.image = images["turret__team" + team];
  this.ht = metersToHt(0.5); // half a meter tall
  this.radius = 0.002;
  this.isVisible = true;
  this.rot = 0;
  this.vel = 0;// Bullet speed
  this.planeObj = this;// ProjectileTemplate requires this
  this.range = 0.3;// Turret range
  this.weapons = [new weapon.ShooterManual(this), new weapon.Empty(this)];
  this.weaponIndex2 = 0;

  this.searchTimer = this.searchReset = 63;// Search for enemy objects every ~1 second, not exactly 60 frames because of performance reasons
  this.fireTimer = this.fireRate = 20;// Fire
  this.pointAt = null;// null = pointing at nothing, otherwise this.pointAt is the object reference
  this.hp = this.hpMax = 10;
  this.driver = null;// null = no person inside, otherwise Player reference
  /// upgrade this (this.upgradeInto = SuperTurret)

  this.onKeyDown = function() {
    if (keyCode === 13) {// If enter is pressed, player jumps out of turret
      me = this.driver;
      this.driver = null;
      this.hp /= 10;// Reset HP
      me.hpMax = me.hp;
      me.isDead = false;
      airObjects.push(me);
    }
  };

  this.onKeyUp = emptyFunc;

  this.update = function() {

    if (this.driver === null) {// If no person inside
      // Search logic
      if (!--this.searchTimer) {// this is true every 63 frames
        var bestPlane = null;
        var bestDist = this.range;
        var distance;
        for (var i = 0; i < infoBarObjects.length; i ++) {
          var ibo = infoBarObjects[i];
          if (ibo.team !== this.team) {
            distance = Math.sqrt(sq(ibo.x-this.x)+sq(ibo.y-this.y));
            if (distance < bestDist) {
              bestPlane = ibo;
              bestDist = distance;
            }
          }
        }
        this.pointAt = bestPlane;
        this.searchTimer = this.searchReset;
      }


      if (this.pointAt !== null) {
        this.rot = atan2(this.pointAt.y-this.y, this.pointAt.x-this.x);
        if (!--this.fireTimer) {// this is true every 20 frames
          this.weapons[0].onMouseDown();
          this.fireTimer = this.fireRate;
        }
      }
    } else {
      this.rot = atan2(RevY(mouseY)-this.y, RevX(mouseX)-this.x);
    }

    this.weapons[0].update();// Only weapon in this case is in slot #0-0
  };

  this.draw = function() {
    this.displayedX = X(this.x, this.ht);
    this.displayedY = Y(this.y, this.ht);
    this.displayedRadius = S(this.radius, this.ht);
    if (this.displayedX + this.displayedRadius > 0 && this.displayedX - this.displayedRadius < width &&
      this.displayedY + this.displayedRadius > 0 && this.displayedY - this.displayedRadius < height) { // if plane is in view
        this.isVisible = true;
        push();
        translate(this.displayedX, this.displayedY);
        scale(this.displayedRadius * 4);
        rotate(this.rot);
        image(this.image, 0, 0, 1, 1);
        pop();
      }
    };

    this.infoBar = function () { // shows HP and height when to planes on map (don't override)
    fill(teamColors[this.team]);
    var hpBarLength = 40 * this.hp / this.hpMax;
    rect(this.displayedX - 20, this.displayedY - this.displayedRadius, hpBarLength, 2);
    fill(teamColors[this.team], 50);
    rect(this.displayedX + hpBarLength - 20, this.displayedY - this.displayedRadius, 40 - hpBarLength, 2);

  };
};

var AIAlgorithms = function (thePlane) {///wip
  if (thePlane.aiOff === undefined) {
    if (thePlane.ht <= 0) {// If plane on ground

      // AI-Initialize plane
      thePlane.aiNewTargetCountdown = thePlane.aiNewTargetReset = 67;
      thePlane.aiTarget = null;
      thePlane.aiShotsLimit = thePlane.aiShots = 10;
      thePlane.aiCanShoot = false;

      // Get plane off ground
      thePlane.velGoto = thePlane.velMax;
      if (thePlane.elevation === 0) {
        thePlane.bumpUp();
      }
    } else {// Plane is in air
      if (!--thePlane.aiNewTargetCountdown) {
        thePlane.weapons[1].onMouseUp();// Pause the auto-shooting
        var bestDist = 10;/// Range?
        var bestIndex = null;
        var boi;
        for (var i = 0; i < infoBarObjects.length; i ++) {
          boi = infoBarObjects[i];
          if (boi.team !== thePlane.team && boi.team !== null) {
            var distance = Math.sqrt(sq(boi.x-thePlane.x)+sq(boi.y-thePlane.y));
            if (distance < bestDist) {
              bestDist = distance;
              bestIndex = i;
            }
          }
        }
        if (bestIndex !== null) {
          if (bestDist < 0.5) {/// shooting range?
            thePlane.aiCanShoot = true;
          } else {
            thePlane.aiCanShoot = false;
          }
          thePlane.aiTarget = infoBarObjects[bestIndex];
        }
        thePlane.aiNewTargetCountdown = thePlane.aiNewTargetReset;

      }

      if (thePlane.aiTarget !== null) {
        if (thePlane.aiTarget.isDead) {// If target is dead, stop shooting its ghost
          thePlane.aiTarget = null;
          return;
        }
        var gotoRot = atan2(thePlane.y-thePlane.aiTarget.y, thePlane.x-thePlane.aiTarget.x)+180;
        var myRot = thePlane.rot;
        if (gotoRot < myRot-180){
          gotoRot += 360;
        } else if (gotoRot > myRot+180) {
          gotoRot -= 360;
        }
        if (myRot > gotoRot + thePlane.rotSpeedMax) {
          thePlane.rotSpeed = -thePlane.rotSpeedMax;
          ///thePlane.weapons[1].onMouseUp();// Pause the auto-shooting
        } else if (myRot < gotoRot - thePlane.rotSpeedMax) {
          thePlane.rotSpeed = thePlane.rotSpeedMax;
          ///thePlane.weapons[1].onMouseUp();// Pause the auto-shooting
        } else {
          thePlane.rot = gotoRot;
          thePlane.rotSpeed = 0;
          if (thePlane.aiCanShoot) {
            if (!--thePlane.aiShots) {// Plane gives up after a while shooting constantly at a single target
              thePlane.aiShots = thePlane.aiShotsLimit;
              thePlane.aiCanShoot = false;
              thePlane.weapons[1].onMouseUp();
            } else {
              thePlane.weapons[1].onMouseDown();// Start the auto-shooting
            }
          }
        }
      }
    }
  }

};

Airplane = function(team, x, y, rot, dataKey) {
  var dk = (dataKey === undefined) ? "f2a" : dataKey;// Set default to "f2a"

  // Fetch data and assign it to this
  var avoidOhNoes = this;
  avoidOhNoes = Object.assign(this, planeData[dk]);

  // Set image
  this.image = images["plane_"+dk+"__team"+team];
  if (this.upgradeSpecific === undefined) {
    this.updateSpecific = function () {};// Empty function
  }

  // Link weapons
  this.weapons = [];
  for (var i = 0; i < this.w.length; i ++) {
    this.weapons[i] = new weapon[this.w[i]](this);
  }

  // Always the same
  this.isDead = false;
  airObjects.push(this);
  infoBarObjects.push(this);
  this.team = team;
  this.x = x;
  this.y = y;
  this.rot = (rot === undefined) ? 0 : rot; // rot is airplane's rotation in degrees; default is 0
  this.velX = 0; // Vel (velocity) refers to plane speed in distance/time, rot (speed) refers to rotational turn rate
  this.velY = 0;
  this.velGoto = 0;
  this.vel = 0;
  this.elevation = 0;
  this.ht = 0;
  this.gotoHt = 0;
  this.gotoRotSpeed = 0;
  this.rotSpeed = 0; // stored rate of rotation when the player pushes LEFT or RIGHT
  this.hpMax = this.hp;
  this.isVisible = false; // if the plane is on the screen
  this.driver = null; // null = idle plane, {Person obj} = player controled, AI-1 = AI algorithm 1, AI-2 = AI algorithm 2, etc.
  this.weaponIndex2 = 0;

  this.bumpUp = function() {// Go UP in elevation
    if (this.vel * 2 > this.velMin) { // If plane's velocity if over half the minimum
    this.elevation += (this.elevation < this.elevationMax) ? 1 : 0;
    this.gotoHt = elevationData[this.elevation];
    if (this.ht === 0) { // If plane on ground and UP/W is pressed
      this.velGoto = this.velMax; // accelarate plane to max speed
      this.ht += elevationData.changeRate;
    }
  }
};

this.bumpDown = function() {// Go DOWN  in elevation
  this.elevation -= (this.elevation > 0) ? 1 : 0;
  this.gotoHt = elevationData[this.elevation];
};

this.update = function () {
  if (this.driver === null) {// Driver is computer-controlled
    AIAlgorithms(this);
  } else {// Driver is player-controlled
    this.rotSpeed += (this.gotoRotSpeed - this.rotSpeed) * this.rotSpeedConvergeRate;// Extra-smooth plane rotation, but AI can use this.rotSpeed = +/- this.rotSpeedMax;
  }

  // physics and movement
  this.velX = cos(this.rot) * this.vel;
  this.velY = sin(this.rot) * this.vel;
  this.x += this.velX;
  this.y += this.velY;
  this.vel += (this.velGoto - this.vel) * this.velConvergeRate;
  this.rot += this.rotSpeed;

  if (this.ht > this.gotoHt) {// Going down
    this.ht -= elevationData.changeRate*2;
    if (this.driver !== null) {
      cam.gotoHt -= elevationData.changeRate*2;// Adjust camera height with airplane
    }
  }
  if (this.ht <= 0) {
    this.ht = 0;
    if (this.velGoto !== this.velMin) {
      this.velGoto = 0;
    }
  }
  if (this.ht < this.gotoHt - elevationData.changeRate) {// Going up
    this.ht += elevationData.changeRate;
    if (this.driver !== null) {
      cam.gotoHt += elevationData.changeRate;// Adjust camera height with airplane
    }
  }

  // plane-specific physics/movement/controls
  this.updateSpecific();
  this.weapons[this.weaponIndex2*2].update();
  this.weapons[this.weaponIndex2*2+1].update();
};

this.onKeyDown = function (keyCode) { ////goal: more realistic plane liftoff
  if (keyCode === 38 || keyCode === 87) { // up arrow or W
    if (this.ht === 0) { // If plane is on the ground
      this.velGoto = this.velMin;
    } else {
      this.velGoto = this.velMax;
    }
  } else if (keyCode === 40 || keyCode === 83) { // down arrow or S
    this.velGoto = this.velMin;
  } else if (keyCode === 37 || keyCode === 65) { // left arrow or A
    this.gotoRotSpeed = -this.rotSpeedMax;
  } else if (keyCode === 39 || keyCode === 68) { // right arrow or D
    this.gotoRotSpeed = this.rotSpeedMax;
  } else if (keyCode === 69) { // E key
    this.bumpUp();
  } else if (keyCode === 81) { // Q key
    this.bumpDown();
  } else if (keyCode === 13) { // Enter key
    if (this.ht === 0) { // If plane's height is ground
    this.velGoto = 0; // Stop plane
    this.hp /= 10;// Reset HP
    me.hpMax = me.hp;
    me = this.driver;
    this.driver = null;
    me.isDead = false;
    airObjects.push(me);
    me.x = this.x;
    me.y = this.y;
  }
}
};

this.onKeyUp = function (keyCode) {
  if (keyCode === 38 || keyCode === 40 || keyCode === 87 || keyCode === 83) { // up, down, W, S
    this.velGoto = this.velNormal;
  } else if (keyCode === 37 || keyCode === 39 || keyCode === 65 || keyCode === 68) { // left, right, A, D
    this.gotoRotSpeed = 0;
  }
};

this.draw = function () { // don't override this
this.displayedX = X(this.x, this.ht);
this.displayedY = Y(this.y, this.ht);
this.displayedRadius = S(this.radius, this.ht);
if (this.displayedX + this.displayedRadius > 0 && this.displayedX - this.displayedRadius < width &&
  this.displayedY + this.displayedRadius > 0 && this.displayedY - this.displayedRadius < height) { // if plane is in view
    this.isVisible = true;
    push();
    translate(this.displayedX, this.displayedY);
    scale(this.displayedRadius * 2);
    rotate(this.rot);
    image(this.image, 0, 0, 1, 1);
    pop();
  }
  /*///for debugging
  strokeWeight(3);
  stroke(255);
  noFill();
  ellipse(this.displayedX, this.displayedY, this.displayedRadius*2, this.displayedRadius*2);
  noStroke();
  */
};

this.infoBar = function () { // shows HP and height when to planes on map (don't override)
fill(teamColors[this.team]);
var hpBarLength = 40 * this.hp / this.hpMax;
rect(this.displayedX - 20, this.displayedY - this.displayedRadius, hpBarLength, 2);
fill(teamColors[this.team], 50);
rect(this.displayedX + hpBarLength - 20, this.displayedY - this.displayedRadius, 40 - hpBarLength, 2);
};
};

Person = function (x, y) {
  this.isDead = false;
  airObjects.push(this);
  this.name = "Random Person " + Math.floor(random(0, 1000));
  this.rot = 0;
  this.x = x;
  this.y = y;
  this.radius = 0.001;
  this.color = color(255, 0, 0);
  this.vel = 0.0002; // max walking speed
  this.velX = 0; // stored speed in x-direction
  this.velY = 0; // stored speed in y-direction
  this.ht = 0; // required property
  this.showCirclesOfEnter = false;
  this.weapons = [];// Required property for weaponScroller to work
  ///this.image = getImage("creatures/OhNoes");
  this.image = loadImage("Images/questionmark.png");
  this.isGoingLeft = true;

  this.onMouseUp = this.onMouseDown = function () {};

  this.onKeyDown = function (theKey) {
    if (theKey === 38 || theKey === 87) {
      this.velY = -this.vel;
    } else if (theKey === 40 || theKey === 83) {
      this.velY = this.vel;
    } else if (theKey === 37 || theKey === 65) {
      this.velX = -this.vel;
      this.isGoingLeft = true;
    } else if (theKey === 39 || theKey === 68) {
      this.velX = this.vel;
      this.isGoingLeft = false;
    } else if (theKey === 13) { //enter key
      this.showCirclesOfEnter = true;
      var bestDist = 500;
      var bestIndex = null;
      for (var i = 0; i < infoBarObjects.length; i++) {
        var theDist = Math.sqrt(sq(infoBarObjects[i].x - this.x) + sq(infoBarObjects[i].y - this.y));
        if (theDist < infoBarObjects[i].radius && theDist < bestDist) {
          bestDist = theDist;
          bestIndex = i;
        }
      }
      if (bestIndex !== null) {
        me = infoBarObjects[bestIndex];
        me.driver = this;
        me.hp *= 10;
        me.hpMax = me.hp;
        this.velX = 0;
        this.velY = 0;
        this.isDead = true;// Do this to remove Player from airObjects, while keeping an instance of the player in this.driver
        cam.followOffsetDistance = 200;
      }
    }
  };

  this.onKeyUp = function (theKey) {
    if (theKey === 38 || theKey === 87) {
      this.velY = 0;
    } else if (theKey === 40 || theKey === 83) {
      this.velY = 0;
    } else if (theKey === 37 || theKey === 65) {
      this.velX = 0;
    } else if (theKey === 39 || theKey === 68) {
      this.velX = 0;
    } else if (theKey === 13) { //enter key
      this.showCirclesOfEnter = false;
    }

  };

  this.update = function () {
    cam.followOffsetDistance = 0;
    cam.followOffsetAngle = 0; ////change if person is AI
    this.x += this.velX;
    this.y += this.velY;


  };

  this.draw = function () {

    push();
    translate(X(this.x), Y(this.y));
    if (this.isGoingLeft) {
      scale(-1, 1);
    }
    var displayedSize = S(this.radius)*2;
    image(this.image, 0, 0, displayedSize, displayedSize);
    pop();


    if (this.showCirclesOfEnter) {
      stroke(255, 255, 255);
      noFill();
      strokeWeight(2);
      for (var i = 0; i < infoBarObjects.length; i++) {
        var iboi = infoBarObjects[i];
        ellipse(X(iboi.x), Y(iboi.y), S(iboi.radius * 2), S(iboi.radius * 2)); ///hmm could I switch to iboi.displayedX?
      }

      noStroke();
    }
  };

};

Explosion = function(source, howMuchFire) {// Source is an Airplane object
  explosionCount ++;
  if (X(source.x+source.radius) < 0 || X(source.x-source.radius) > width || Y(source.y+source.radius) < 0 || Y(source.y-source.radius) > height) {// If explosion if off-screen
    this.generateMoreFire = emptyFunc;// Empty function (fixes a bug)
    return;
  }
  this.name = "Explosion "+explosionCount;
  airObjects.push(this);

  // Properties
  this.isDead = false;
  this.lifeLeft = 120;// Explosion only lasts for 2 seconds
  this.ht = source.ht;
  this.jumpByX = source.radius / 2;
  this.jumpByY = source.radius / 2;

  // Temp variables
  var x = source.x;
  var y = source.y;
  var x1 = x - source.radius;
  var y1 = y - source.radius;
  var x2 = x + source.radius;
  var y2 = y + source.radius;
  var zSizeX = S(this.jumpByX, this.ht);
  var zSizeY =  S(this.jumpByY, this.ht);

  // Generate image snips which form debris
  this.snipXs = [];
  this.snipYs = [];
  this.snipVelXs = [];
  this.snipVelYs = [];
  this.snipImages = [];
  if (zSizeX >= 1) {// Program freezes if you attempt to get() with a width/height of < 1
    source.draw();
    for (var i = 0; i < 4; i ++) {
      for (var j = 0; j < 4; j ++) {
        this.snipXs.push(x1+this.jumpByX*(i+0.5));
        this.snipYs.push(y1+this.jumpByY*(j+0.5));
        this.snipImages.push(get(X(x1+this.jumpByX*i, this.ht), Y(y1+this.jumpByY*j, this.ht), zSizeX, zSizeY));
        this.snipVelXs.push(random(-0.001, 0.001));
        this.snipVelYs.push(random(-0.001, 0.001));
      }
    }
  }

  // Generate fire particles
  this.fireXs = [];
  this.fireYs = [];
  this.fireSize = 0;
  this.generateMoreFire = function() {
    for (var i = 0; i < 10; i++){//generates fire
      this.fireXs.push(random(x1, x2));
      this.fireYs.push(random(y1, y2));
    }
  };
  howMuchFire = howMuchFire || 1;
  for (var i = 0; i < howMuchFire; i ++) {// Generate extra fire with explosion
    this.generateMoreFire();
  }

  this.update = function() {
    // Move snipped image debris
    for (var i = 0; i < this.snipXs.length; i ++) {//pieces
      this.snipXs[i] += this.snipVelXs[i];//move the pieces
      this.snipYs[i] += this.snipVelYs[i];
    }

    this.fireSize += 0.00025;

    if (!--this.lifeLeft) {
      this.isDead = true;
    }
  };


  this.draw = function() {
    // Draw snipped image debris
    var theSize = max(2, S(this.jumpByX, this.ht));///merge jumpByX and jumpByY
    //if (theSize !== 0) {
    for (var i = 0; i < this.snipXs.length; i ++) {//pieces
      ////image(this.snipImages[i], X(this.snipXs[i], this.ht), Y(this.snipYs[i], this.ht), theSize, theSize);
    }
    ///}

    // Draw fire particles
    for (var i = 0; i < this.fireXs.length; i++) {//fire
      fill(255, this.fireSize*15000, 0, 255-this.fireSize*30000);
      ellipse(X(this.fireXs[i], this.ht), Y(this.fireYs[i], this.ht), S(this.fireSize, this.ht), S(this.fireSize, this.ht));
    }
  };

};

SimpleTemplate = function(x, y, rot) {
  // Always the same
  this.isDead = false;
  airObjects.push(this);
  infoBarObjects.push(this);
  this.x = x;
  this.y = y;
  this.team = null;
  this.infoBarColor = color(127);
  this.rot = (rot === undefined) ? 0 : rot; // rot is airplane's rotation in degrees; default is 0
  this.isVisible = false; // if the plane is on the screen

  // Override these properties
  //this.name = "Simple Object Template";
  //this.radius = 0.001;
  //this.hp = this.hpMax = 5;
  //this.ht = metersToHt(5);

  this.update = function() {
    this.displayedX = X(this.x);
    this.displayedY = Y(this.y);
    this.displayedRadius = S(this.radius);
    this.isVisible = this.displayedX > -this.displayedRadius && this.displayedX < width+this.displayedRadius && this.displayedY > -this.displayedRadius && this.displayedY < width+this.displayedRadius;
  };

  this.infoBar = function () { // shows HP and height when to planes on map (don't override)///height too???
  if (this.hp !== this.hpMax) {// If object has taken any damage, display neutral HP bar
    fill(this.infoBarColor);
    var hpBarLength = 40 * this.hp / this.hpMax;
    rect(this.displayedX - 20, this.displayedY - this.displayedRadius, hpBarLength, 2);
    fill(this.infoBarColor, 50);
    rect(this.displayedX + hpBarLength - 20, this.displayedY - this.displayedRadius, 40 - hpBarLength, 2);
  }
};
};

simple = {
  Tree1: function(x, y, rot) {
    SimpleTemplate.call(this, x, y, rot);
    this.name = "Tree 1";
    this.radius = 0.01;
    this.hp = this.hpMax = 5;
    this.ht = metersToHt(5);

    var generateColor = function() {
      return color(34+random(-10, 10), 139+random(-10, 10), 34+random(-10, 10));
    };
    this.sideColor1 = generateColor();
    this.sideColor2 = generateColor();
    this.sideColor3 = generateColor();
    this.sideColor4 = generateColor();

    this.draw = function() {

      var dx = this.displayedX;
      var dy = this.displayedY;
      var dr = this.displayedRadius;
      var tx = X(this.x, this.ht);
      var ty = Y(this.y, this.ht);
      fill(this.sideColor1);
      triangle(tx, ty, dx-dr, dy, dx, dy-dr);
      fill(this.sideColor2);
      triangle(tx, ty, dx+dr, dy, dx, dy-dr);
      fill(this.sideColor3);
      triangle(tx, ty, dx-dr, dy, dx, dy+dr);
      fill(this.sideColor4);
      triangle(tx, ty, dx+dr, dy, dx, dy+dr);

    };
  },

};

var TeamStats = function() {
  /* Keeps track of points and time for every team */
  this.minimized = true;
  this.ages = ["1910s", "WWI", "WWII", "~1960", "~1980s", "2000s", "Future", "Future 2", "Win"];
  this.onAgeIndex = Array(number_of_teams).fill(0);// You are index 0 starting at age 0 (1910s)

  this.requiredAll = [60, 120, 300, 3, 999, 1000, 99999999];
  this.teamRequiredPoints = [];// Required points for current age (for each team)
  for (var i = 0; i < number_of_teams ; i ++) {
    this.teamRequiredPoints.push(this.requiredAll[this.onAgeIndex[i]]);
  }
  this.points = Array(number_of_teams).fill(0);
  this.grandBonusPoints = Array(number_of_teams).fill(0);
  this.pauseGraphData = [];
  for (var i = 0; i < number_of_teams; i ++) {
    this.pauseGraphData.push([]);
  }

  this.y1 = height;// Points bar y1 position

  this.pointIncrease = 1 / 60;// 1 point every second
  this.teamTower = [];// List of towers for each team
  this.teamBases = [];// List of list of bases for each team
  this.teamIsAlive = [];
  for (var i = 0; i < number_of_teams; i ++) {
    this.teamBases.push([]);
    this.teamIsAlive.push(true);
  }

  this.reset = function() {
    this.onAgeIndex = Array(number_of_teams).fill(0);
    this.points = Array(number_of_teams).fill(0);
  };

  this.update = function() {

    /* Check if your team tower was destoryed */
    if (this.teamTower[0].isDead) {
      notification.send("Your Khan Tower was destoryed.", 4);
    }

    /* Check if player is dead */
    if (me.isDead) {
      notification.send("You died", 4);
      if (this.teamBases[0].length > 0) {// If you have a hangar built
        me = new Person(0, this.teamBases[0][0].x, this.teamBases[0][0].y);// Spawn player in a team hangar
      } else {
        me = new Person(0, this.teamTower[0].x, this.teamTower[0].y);// Spawn player near the team tower
      }
    }

    /* Removing bases from this.teamBases */
    for (var i = 0; i < number_of_teams; i ++) {
      // Check if bases have been destroyed, if so remove them from this.teamBases
      for (var j = this.teamBases[i].length-1; j >= 0; j --) {
        if (this.teamBases[i][j].isDead) {
          this.teamBases[i].splice(j, 1);
        }
      }
    }


    /* Update bars */
    var x1;
    var dynamicY = this.y1+18;
    for (var i = 0; i < number_of_teams; i ++) {

      // Add 1 point every frame
      this.points[i] += this.pointIncrease;
      if (this.points[i] > this.teamRequiredPoints[i]) {// Advance to the next age
        this.grandBonusPoints[i] += this.teamRequiredPoints[i];// Running total of points
        this.teamRequiredPoints[i] = this.requiredAll[this.onAgeIndex[i]++];// Fancy way of incrementing onAgeIndex while assigning teamRequiredPoints
        this.points[i] = 0;// Reset points to 0
        for (var j = 0; j < infoBarObjects.length; j ++) {// Check through all possible objects
          var iboj = infoBarObjects[j];
          if (i === iboj.team) {// If object's team is the advancing team
          if (iboj.upgradeInto !== undefined) {// If object can upgrade (e.g. support pillars might not always upgrade)
            if (iboj === me) {
              weaponScroller.meUpgradeOldWeaponsCleanup();// Cleanup old weapons (bugfix)
            }

            /* Upgrade the object (stats, images, and weapons) */

            // Fetch data and assign it to this
            var dk = iboj.upgradeInto;
            iboj = Object.assign(iboj, planeData[dk]);
            if (planeData[dk].upgradeInto === undefined) {
              iboj.upgradeInto = undefined;//bugfix
            }

            // Set image
            iboj.image = images["plane_"+dk+"__team"+iboj.team];
            if (planeData[dk].updateSpecific === undefined) {
              iboj.updateSpecific = emptyFunc;// Empty function
            }

            // Link weapons
            iboj.weapons = [];
            for (var i = 0; i < iboj.w.length; i ++) {
              iboj.weapons[i] = new weapon[iboj.w[i]](iboj);
            }
          }
        }
      }
      if (i === 0) {// If your team upgrades
        buildMenu.upgradeBuildOptions(this.onAgeIndex[0]);
        notification.send(teamNames[i]+" has advanced to "+this.ages[this.onAgeIndex[0]], 3);
      } else {
        notification.send(teamNames[i]+" has advanced to "+this.ages[this.onAgeIndex[i]], 4);
      }


    }
    /* Every 60 frames, Update pause menu's graph data */
    if (frameCount%60 === 27) {
      this.pauseGraphData[i].push(this.points[i]+this.grandBonusPoints[i]);
    }
  }

  /* Draw bars */
  if (this.minimized) {

    /* Open/close tab */
    if (mouseX > width-30 && mouseY > height-20) {
      if (mouseIsPressed) {
        this.minimized = false;
        this.y1 = height-13-3*number_of_teams;
      }
      fill(255);
    } else {
      fill(255, 150);
    }
    arc(width, height, 60, 40, 180, 270);
    fill(0);
    textFont(fonts.monoBold, 14);
    text("∧", width-13, height-9);

    /* Minimized data */
    fill(0);
    textAlign(RIGHT, BOTTOM);
    text(Math.floor(this.points[0]).toString()+"·"+this.teamRequiredPoints[0].toString(), width-35, height-3);// Display your points
    textAlign(CENTER, CENTER);

  } else {
    for (var i = 0; i < number_of_teams; i ++) {

      if (i === 0) {
        // Filled bar
        fill(teamColors[0], 150);// Your team color
        x1 = width*this.points[0]/this.teamRequiredPoints[0];
        rect(0, this.y1, x1, 18);

        // Unfilled transparent bar
        fill(255, 70);
        rect(x1, this.y1, width-x1, 18);

        // Text
        fill(0);
        textFont(fonts.timeBold, 19);
        if (mouseY > this.y1) {
          text(this.ages[this.onAgeIndex[0]]+" ➡ "+this.ages[this.onAgeIndex[0]+1]+" ("+Math.floor(100*this.points[0]/this.teamRequiredPoints[0])+"%)", 300, this.y1+9);// Display your  and percentage to next age
        } else {
          text(Math.floor(this.points[0]).toString()+" / "+this.teamRequiredPoints[0].toString(), 300, this.y1+9);// Display your points
        }

        // Age box indicators on right
        fill(255, 150);
        for (var j = 0; j < this.onAgeIndex[0]; j ++) {
          rect(width-25-25*j, this.y1+1, 23, 16);
        }
      } else {
        // Filled minibar
        fill(teamColors[i], 200);// Team color
        x1 = width*this.points[i]/this.teamRequiredPoints[i];
        rect(0, dynamicY, x1, 3);

        // Unfilled transparent minibar
        fill(255, 70);
        rect(x1, dynamicY, width-x1, 3);

        // Age box indicators on right
        fill(255, 150);
        for (var j = 0; j < this.onAgeIndex[i]; j ++) {
          rect(width-25-25*j, dynamicY, 23, 2);
        }

        // Update offset for next minibar
        dynamicY += 3;
      }
    }
    if (mouseX > width-30 && mouseY > this.y1-20 && mouseY < this.y1) {
      if (mouseIsPressed) {
        this.minimized = true;
        this.y1 = width;
      }
      fill(255);
    } else {
      fill(255, 150);

    }
    arc(width, this.y1, 60, 40, 180, 270);
    fill(0);
    textFont(fonts.monoBold, 14);
    text("∨", width-13, this.y1-8);
  }
};

};

var BuildMenu = function() {
  this.folded = true;

  this.isMouseInside = false;// weaponScroller relies on this variable
  this.isSelected = false;
  this.selectedIndex = 0;
  this.hoverIndex = -1;
  this.y2 = height;

  this.generateOptions = [
    ["base", "turret", "plane_f2a"],// Automatically introduced in 1910s
    ["plane_f2b"],// Introduced in WW1
    [],// Introduced in WW2
    [],// Introduced in t 1
    [],// Introduced in t 2
    [],// Introduced in 2010s
    [],// Introduced in near-future
    [],// Introduced in epoch age
  ];
  this.buildingsInfo = [];
  this.planesInfo = [];

  this.upgradeBuildOptions = function(ageIndex) {// When you advance to the next age (e.g. WWI -> WWII), call this function to unlock new build options and update existing ones
    // Check for upgrades in existing buildings and planes
    for (var i = this.buildingsInfo.length-1; i >= 0; i --) {
      if (this.buildingsInfo[i].ref.upgradeInto !== undefined) {
        var subName = this.buildingsInfo[i].subName;// e.g. "f2b" or "f3"
        var newOption = buyData[subName];
        newOption.subName = subName;
        newOption.isRectFootprint = (newOption.ref.radius === undefined);
        newOption.sizeFootprint = newOption.ref.radius || newOption.ref.size;
        this.buildingsInfo[i] = newOption;
      }
    }

    for (var i = this.planesInfo.length-1; i >= 0; i --) {
      if (this.planesInfo[i].ref.upgradeInto !== undefined) {
        var subName = this.planesInfo[i].subName;// e.g. "f2b" or "f3"
        var newOption = buyData[subName];
        newOption.subName = subName;
        newOption.isRectFootprint = (newOption.ref.radius === undefined);
        newOption.sizeFootprint = newOption.ref.radius || newOption.ref.size;
        this.planesInfo[i] = newOption;
      }
    }

    // Introduce new options
    for (var i = 0; i < this.generateOptions[ageIndex].length; i ++) {
      var subName = this.generateOptions[ageIndex][i];// e.g. "f2b" or "f3"
      var newOption = buyData[subName];
      newOption.subName = subName;
      newOption.isRectFootprint = (newOption.ref.radius === undefined);
      newOption.sizeFootprint = newOption.ref.radius || newOption.ref.size;
      if (newOption.ref.rotSpeedConvergeRate !== undefined) {// All planes have this property
        this.planesInfo.push(newOption);
      } else {
        this.buildingsInfo.push(newOption);
      }
    }
  };

  this.buildOptions = this.buildingsInfo;

  this.onMouseDown = function() {
    if (this.isSelected && mouseX > 100) {// If an icon is highlighted && mouse is not hovering hover build menu
      if (mouseButton === LEFT) {
        var boi = this.buildOptions[this.selectedIndex]; // boi stands for BuildOptions with the Index
        buy(0, boi.subName, RevX(mouseX), RevY(mouseY));
        if (!downKeys[16]) {// If SHIFT key is not being held down (for consecutive building)
          this.isSelected = false;
        }
      } else if (mouseButton === RIGHT) {
        this.isSelected = false;
      }
    }

    if (!this.folded) {// If build menu is open

      // Clicking on an icon to build it
      if (mouseX < 100 && this.hoverIndex !== -1 && mouseButton === LEFT) {
        if (this.selectedIndex === this.hoverIndex && this.isSelected) {// If you select an icon that is already selected
          this.selectedIndex = -1;// This solves a weird bug
          this.isSelected = false;
        } else {
          this.selectedIndex = this.hoverIndex;

          this.isSelected = true;
        }
      }
    }
  };

  this.update = function() {
    if (this.folded) {
      this.isMouseInside = false;

      // Draw open tab
      if (Math.sqrt(sq(mouseX+10)+sq(mouseY-height/2)) < 30) {// If mouse near open tab
        fill(255);
        if (mouseIsPressed) {
          this.folded = false;
        }
      } else {
        fill(255, 150);
      }
      ellipse(-10, height/2, 50, 50);
      fill(0);
      textFont(fonts.monoBold, 15);
      text(">", 5, height/2-2);

    } else {// Show bulid options

      // Calculate y2, the background side bar length
      this.y2 = teamStats.y1;

      // Side bar background
      fill(37, 37, 44, 200);
      rect(0, 0, 100, this.y2);

      /* Side bar icons */

      // Calculate which icon is highlighted
      this.hoverIndex = -1;
      if (mouseX <= 100) {
        this.isMouseInside = true;
        var willBeHoverIndex = Math.floor(mouseY / 100);
        if (willBeHoverIndex >= 0 && willBeHoverIndex < this.buildOptions.length) {// Index can't be lower than 0 or more than number of options
        this.hoverIndex = willBeHoverIndex;
      }
    } else {
      this.isMouseInside = false;
    }

    // Draw the icons
    for (var i = 0; i < this.buildOptions.length; i ++) {
      var boi = this.buildOptions[i];

      // Tinted-background
      if (this.isSelected && i === this.selectedIndex) {
        strokeWeight(2);
        stroke(teamColors[0]);
        fill(255, 100);
        rect(5, 2 + 100*i, 90, 96, 10);
        noStroke();
      } else if (i === this.hoverIndex) {
        fill(255, 100);
        rect(5, 2 + 100*i, 90, 96, 10);

      } else {
        fill(255, 40);
        rect(5, 2 + 100*i, 90, 96, 15);
      }

      // Image
      image(images[boi.subName+"__team0"], 50, 50 + i*100, 55, 55);

      // Stats
      fill(0);
      textFont(fonts.verdana, 12);
      text(boi.ref.name, 50, 10 + i*100);
      text("Cost: "+boi.cost, 50, 90+ i*100);
    }

    // Draw close tab
    if (mouseX > 100 && Math.sqrt(sq(mouseX-90)+sq(mouseY-height/2)) < 30) {// If mouse near open tab
      fill(255);
      if (mouseIsPressed) {
        this.folded = true;
      }
    } else {
      fill(255, 150);
    }
    beginShape();
    for (var r = -70; r <= 70; r+=10) {
      vertex(92 + cos(r)*25, height/2 + sin(r)*25);
    }
    endShape();
    fill(0);
    textFont(fonts.monoBold, 15);
    text("<", 107, height/2-2);
  }

  if (this.isSelected) {

    // Show footprint
    stroke(255, 0, 0);
    strokeWeight(2);
    fill(0, 100);
    var boi = this.buildOptions[this.selectedIndex];// The building to build
    var size = S(boi.sizeFootprint);
    if (boi.isRectFootprint) {
      rect(mouseX-size/2, mouseY-size/2, size, size);
    } else {
      ellipse(mouseX, mouseY, size, size);
    }
    noStroke();

    // Instructions on placing objects
    fill(0);
    textFont(fonts.monoBold, 14);
    text("Shift-left - Build consecutive\n\nRight - Cancel", width/2, 55);


  } else {// If no options are selected
    if (!this.folded) {// If you can see the options
      if (isMeInsideBase) {
        this.buildOptions = this.planesInfo;
      } else {
        this.buildOptions = this.buildingsInfo;
      }
    }

  }
};
};

var Tutorial = function() {
  this.isVisible = true;
  this.isOn = false;
  this.color = color(255, 204, 102);
  this.trans = 200;// 0 to 255

  this.instructions = [
    "Year 1910 - Dawn of Aviation\n\nThat's right. If you want to advance forward in technology, you better learn the basics.\n\nYour number one priority is to protect your Khan Tower from enemy planes at all costs.\n\nThe Khan Tower generates 1 TP (Technology Point) per second. If your team earns enough TPs, your planes will upgrade.\n\nPress \"K\" to continue.\n",
    "This is your character.\nMove him around with the WASD keys.",
    "Zoom in and out with the mouse scroll.\nAlternatively the I and O keys work too.",
    "This is your Khan Tower.\n\nHover over this building to reveal its Hit Points (HP).",
    "...",
    ""];
    this.triggers = [
      function(){return downKeys[75];/*K key*/},
      function(){return me.velX!==me.velY;},
      function(){return cam.gotoHt!==cam.ht;},
      function(){return pointer.hoverObject!==undefined&&pointer.hoverObject.hp===1000;},
      function(){return downKeys[75];},
      function(){return 0;},

    ];
    this.doThisBefore = [//hmm
      0,
      1,
      2,
      function(){cam.gotoHt=0.0003;},
      function(){
        for (var i = 0; i < 8; i++) {
          new Airplane(0, 0+0.001*Number(i%2===0), -1+0.001*Math.floor(i/2), "f2a")

        }

      },
      0,

    ];
    this.positions = [[], [width/2-150, height/2-150, 300, 140, "bottom"],
    [width/2-200, 10, 400, 200],
    [10, 10, width/2, height-20, "right", function(){var tempHt=cam.ht;cam.ht=0.0003;var ycor=Y(teamStats.teamTower[0].y);cam.ht=tempHt;return ycor;}],
    [],
    []];
    this.onIndex = 0;
    this.nextBoxTimeout = this.nextBoxReset = 60;
    this.isObjectiveComplete = false;
    this.kPressedOnce = false;// For "continuing"

    this.fixImages = function() {
      this.image = images.closeIcon;
      this.imageHover = images.closeIconHover;
      this.imageCheck = images.checkMarkIcon;
    };

    this.nextBox = function() {
      var beforeFunc = this.doThisBefore[this.onIndex];
      if (typeof beforeFunc === "function") {
        beforeFunc();
      }
      this.isVisible = true;
      var posi = this.positions[this.onIndex];
      this.x = posi[0]||60;
      this.y = posi[1]||60;
      this.w = posi[2]||(width-120);
      this.h = posi[3]||(height-120);
      var arrowWhere = posi[5];
      if (typeof arrowWhere === "function") {
        arrowWhere = arrowWhere();
      }
      this.isArrow = true;
      switch (posi[4]) {
        case "top":
        var xwhere = arrowWhere||(this.x+this.w/2);
        this.arrowX1 = xwhere;
        this.arrowY1 = this.y-10;
        this.arrowX2 = xwhere-10;
        this.arrowY2 = this.y;
        this.arrowX3 = xwhere+10;
        this.arrowY3 = this.y;
        break;
        case "bottom":
        var xwhere = arrowWhere||(this.x+this.w/2);
        this.arrowX1 = xwhere;
        this.arrowY1 = this.y+10+this.h;
        this.arrowX2 = xwhere-10;
        this.arrowY2 = this.y+this.h;
        this.arrowX3 = xwhere+10;
        this.arrowY3 = this.y+this.h;
        break;
        case "left":
        var ywhere = arrowWhere||(this.y+this.h/2);
        this.arrowX1 = this.x-10;
        this.arrowY1 = ywhere;
        this.arrowX2 = this.x;
        this.arrowY2 = ywhere-10;
        this.arrowX3 = this.x;
        this.arrowY3 = ywhere+10;
        break;
        case "right":
        var ywhere = arrowWhere||(this.y+this.h/2);
        this.arrowX1 = this.x+10+this.w;
        this.arrowY1 = ywhere;
        this.arrowX2 = this.x+this.w;
        this.arrowY2 = ywhere-10;
        this.arrowX3 = this.x+this.w;
        this.arrowY3 = ywhere+10;
        break;
        default:
        this.isArrow = false;
      }
      this.iconXMid = this.x+this.w-15;
      this.iconYMid = this.y+15;
      this.iconX1 = this.iconXMid-10;
      this.iconY1 = this.iconYMid-10;
      this.iconX2 = this.iconXMid+10;
      this.iconY2 = this.iconYMid+10;
    };
    this.nextBox();

    this.onKeyDown = function(theKey) {
      if (this.isOn) {
        if (theKey.toString() === "t") {
          this.isVisible = !this.isVisible;
        } else if (theKey.toString() === "k") {
          this.kPressedOnce = true;
        }
      }
    };

    this.update = function() {
      if (this.isOn) {
        if (this.isVisible) {
          fill(this.color, this.trans);
          rect(this.x, this.y, this.w, this.h, 5);
          if (this.isArrow) {
            triangle(this.arrowX1, this.arrowY1, this.arrowX2, this.arrowY2, this.arrowX3, this.arrowY3);
          }
          if (this.isObjectiveComplete) {
            // Green check mark
            image(this.imageCheck, this.x+this.w/2, this.y+this.h/2);
          } else {
            // Instructions
            textFont(fonts.verdana, 11);
            fill(0, this.trans);
            text(this.instructions[this.onIndex], this.x+10, this.y+10, this.w-10, this.h-1);
          }
          stroke(0, this.trans);

          // Close icon
          if (mouseX > this.iconX1 && mouseY < this.iconY2 && mouseX < this.iconX2 && mouseY > this.iconY1) {
            image(this.imageHover, this.iconXMid, this.iconYMid);
            if (mouseIsPressed) {
              this.isVisible = false;
            }
          } else {
            image(this.image, this.iconXMid, this.iconYMid);
          }
          noStroke();

          // Check trigger
          if (this.isObjectiveComplete) {
            if (!--this.nextBoxTimeout) {
              this.nextBoxTimeout = this.nextBoxReset;
              this.onIndex ++;
              this.nextBox();
              this.isObjectiveComplete = false;
            }
          } else {
            if (this.triggers[this.onIndex]()) {
              this.isObjectiveComplete = true;
            }
          }


        } else {
          textFont(fonts.monoBold, 14);
          fill(0);
          text("Press T to show tutorial objective", buildMenu.folded?140:240, teamStats.minimized?height-9:teamStats.y1-9);

        }
        this.kPressedOnce = false;
      }

    };

  };

  var Pointer = function() {

    this.update = function() {
      var revMouseX = RevX(mouseX);
      var revMouseY = RevY(mouseY);
      var bestDist = 999;
      var bestIndex = null;
      var addOnToRadius = RevS(10);// 10 extra pixels wide
      for (var i = 0; i < infoBarObjects.length; i ++) {
        var iboi = infoBarObjects[i];
        var distance = Math.sqrt(sq(iboi.x-revMouseX)+sq(iboi.y-revMouseY));
        if (distance < (iboi.radius+addOnToRadius) && distance < bestDist) {
          bestDist = distance;
          bestIndex = i;
        }
      }
      if (bestIndex !== null) {// If mouse pointer is within radius of an object
        // Display object's stats
        var bestObject = infoBarObjects[bestIndex];
        var displayedX = X(bestObject.x);
        var displayedY = Y(bestObject.y);
        var displayedSize = S(bestObject.radius)*2;
        fill(255);
        textFont(fonts.verdana, 12);
        text(bestObject.name, displayedX, displayedY-displayedSize/2-15);
        text(bestObject.hp, displayedX, displayedY-displayedSize/2-5);

        // Show ring around object
        stroke(255, 200 + 55*sin(frameCount));
        strokeWeight(1);
        noFill();
        ellipse(displayedX, displayedY, displayedSize, displayedSize);
        noStroke();

        // Make it global
        this.hoverObject = bestObject;
      } else {
        this.hoverObject = undefined;
      }

    };
  };

  var PauseMenu = function() {
    this.isGamePaused = false;
    this.firstTime = true;
    this.isGenerateGraph = true;

    this.resumeGame = function() {
      this.isGenerateGraph = true;
      this.isGamePaused = false;
      scene = 2;
    };

    this.update = function() {
      if (this.firstTime) {
        this.image = images.pauseMenuIcon;
        this.imageHover = images.pauseMenuIconHover;
      }
      if (this.isGamePaused) {
        image(this.screenshot, width/2, height/2);
        fill(0, 200);
        rect(0, 0, width, height);
        textFont(fonts.impact, 70);
        fill(255);
        text("Paused", width/2, 50);
        textFont(fonts.verdana, 30);
        text("hmm", width/2, 400);

        /* Point graph */
        if (this.isGenerateGraph) {
          this.isGenerateGraph = false;
          this.graphXs = [];
          this.graphYs = [];
          var maxRow = teamStats.pauseGraphData.map(function(row){ return Math.max.apply(Math, row); });
          var yMaximum = Math.max.apply(null, maxRow);
          var timeDelta = (width-200)/teamStats.pauseGraphData[0].length;
          for (var i = 0; i < teamStats.pauseGraphData.length; i ++) {
            var teamGraphData = teamStats.pauseGraphData[i];
            var timeValue = 100;
            this.graphXs.push([]);
            this.graphYs.push([]);
            for (var j = 0; j < teamGraphData.length; j ++) {
              var datPoint = teamGraphData[j];
              timeValue += timeDelta;
              this.graphXs[i].push(timeValue);
              this.graphYs[i].push(height-200-(300*teamGraphData[j]/yMaximum));
            }
          }
        } else {
          noFill();
          for (var i = 0; i < this.graphXs.length; i ++) {
            stroke(teamColors[i]);
            strokeWeight(3);
            beginShape();
            for (var j = 0; j < this.graphXs[i].length; j ++) {
              vertex(this.graphXs[i][j], this.graphYs[i][j]);
            }
            endShape();
          }
        }

      } else {
        var x1 = (buildMenu.folded) ? 10 : 110;
        if (mouseX < x1+30 && mouseY < 40 && mouseX > x1 && mouseY > 10) {
          if (mouseIsPressed) {
            this.isGamePaused = true;
            filter(BLUR, 2);// Blur screenshot
            this.screenshot = get(0, 0, width, height);
            scene = 3;// Change scene to freeze game
          }
          image(this.imageHover, x1+15, 30);
        } else {
          image(this.image, x1+15, 30);
        }

      }
    };
  };

  var ObjectFactory = function() {// Builds forests and spawns AI (planes, bases, turrets)
    this.disabled = true;

    this.update = function() {

      if (this.disabled) {return 0;}

      /* Create trees */
      if (frameCount % 30 === 0) {// Every half-second...
        if (infoBarObjects.length < 100) {// Create another tree if there are less than 100 objects on the map
          new simple.Tree1(random(-1, 1), random(-1, 1));
        }
      }

      /* Spawning AI */
      for (var i = 1; i < number_of_teams; i ++) {
        if (teamStats.teamIsAlive[i]) {
          if (frameCount % 360 === 0) {// Every 6 seconds...

            // Check if headquarters has been destroyed, if so destroy EVERYTHING on the team
            var tower = teamStats.teamTower[i];
            if (tower.isDead) {
              for (var j = 0; j < infoBarObjects.length; j ++) {
                if (infoBarObjects[j].team === i) {
                  infoBarObjects[j].isDead = true;
                }
              }
              notification.send("Team "+teamNames[i]+" is defeated.", 3);
              teamStats.teamIsAlive[i] = false;
              break;
            }

            // 50% chance of creating a turret near teams' headquarters
            if (random(0, 1) < 0.5) {

              if (!tower.isDead) {// If headquarters is not already destroyed...
                var randomAngle = random(0, 360);
                buy(i, "turret", tower.x+cos(randomAngle)*0.2, tower.y+sin(randomAngle)*0.2);
              }
            }

            // Create an airplane in their random base
            var myBases = teamStats.teamBases[i];
            if (myBases.length > 0) {// Can't add a plane without a base :wesmart:
            var theBase = myBases[Math.floor(random(0, myBases.length-0.00001))];// Choose a random team's base
            buy(i, "plane_f2b", theBase.x, theBase.y, random(0, 360));
          }
        }


        if (frameCount % 3601 === 0) {// Every 60 seconds...
          // Create a new base in a random location
          buy(i, "base", teamStats.teamTower[i].x+random(-1, 1), teamStats.teamTower[i].y+random(-1, 1));
        }
      }
    }
  };



  /** Data **/

  elevationData = {
    0: 0,
    1: 0.00005,
    2: 0.00050,
    3: 0.00120,
    4: 0.00200,
    changeRate: 0.00001,
  };
  planeData = {
    "f2a": {
      name: "Fokker Dr.1",
      radius: 0.0072,
      hp: 3,
      velMin: 0.0002,
      velNormal: 0.0005,
      velMax: 0.0009,
      velConvergeRate: 0.03,
      rotSpeedMax: 1,
      rotSpeedConvergeRate: 0.1,
      elevationMax: 4,// 0 = Ground, 1 = Low, 2 = Mid, 3 = High, 4 = Space
      w: ["ShooterManual", "Laserer", "ShooterManual", "ShooterManual", "ShooterManual", "ShooterManual", "ShooterManual", "Shooter2Manual"],//[weapon.ShooterManual, weapon.Empty],
    },
    "f2b": {
      name: "Sopwith Camel",
      radius: 0.00853,
      hp: 5,
      velMin: 0.0002,
      velNormal: 0.0005,
      velMax: 0.000841925,
      velConvergeRate: 0.03,
      rotSpeedMax: 1,
      rotSpeedConvergeRate: 0.1,
      elevationMax: 2,// 0 = Ground, 1 = Low, 2 = Mid, 3 = High, 4 = Space
      w: ["ShooterManual", "ShooterAuto"],//[weapon.ShooterManual, weapon.Empty],
      upgradeInto: "f3"
    },
    "f3": {
      name: "Supermarine Spitfire",
      radius: 0.01123,
      hp: 10,
      velMin: 0.0001,
      velNormal: 0.0005,
      velMax: 0.001,
      htChangeRate: metersToHt(0.16), // double from last age
      velConvergeRate: 0.03,
      rotSpeedMax: 1.5, // 50% ^
      rotSpeedConvergeRate: 0.05,
      elevationMax: 3,
      w: ["ShooterManual", "ShooterAutoDouble"],//[weapon.ShooterManual, weapon.Empty],
    }
  };
  baseData = {
    name: "Base name"
  };
  turretData = baseData;
  buyData = {// For BuildMenu
    "plane_f2a": {
      ref: planeData.f2a,
      cost: 8,
      description: "Cool plane"
    },
    "base": {
      ref: baseData,
      cost: 1,
      description: "the base...",
      tempObjectReference: Base
    },
    "plane_f2b": {
      ref: planeData.f2a,
      cost: 8,
      description: "Cool plane"
    },
    "turret": {
      ref: turretData,
      cost: 2,
      description: "wee",
      tempObjectReference: Turret
    }
  };


};


/** Create instances **/
notification = new Notification();
imageLoader = new ImageLoader();
weaponScroller = new WeaponScroller();
buildMenu = new BuildMenu();
teamStats = new TeamStats();
pointer = new Pointer();
tutorial = new Tutorial();
pauseMenu = new PauseMenu();
factory = new ObjectFactory();
new MenuButton(1, "Tutorial", 0.5, 0.333, 0.666, 0.1, function(){createInstances("tutorial");notification.send("Tutorial started");scene++;});
new MenuButton(1, "Start Game", 0.5, 0.5, 0.666, 0.1, function(){createInstances("game");notification.send("Game started with "+number_of_teams+" teams").send("Good luck!");scene++;});
new MenuButton(1, "Stuffs", 0.5, 0.666, 0.666, 0.1, function(){notification.send("yay colors",Math.floor(random(0,4.999)));});
new MenuButton(3, "Resume", 0.5, .808, .625, 0.1, function(){pauseMenu.resumeGame();notification.send("Game Resumed");});
new MenuButton(3, "Restart", 0.333, .925, .292, 0.1, function(){notification.send("Not yet implemented");});
new MenuButton(3, "Menu", 0.666, .925, .292, 0.1, function(){notification.send("Not yet implemented");scene=1;});



}


/** Build-in functions **/
function mouseScroll(event) {
  var delta = event.deltaY;

  if (weaponScroller.isMouseInside) {
    weaponScroller.onMouseScroll(-delta);
  } else {
    if (delta < 0) {
      cam.gotoHt += (me.ht-cam.gotoHt)*0.2;
    } else {
      cam.gotoHt -= (me.ht-cam.gotoHt)*0.2;
    }
  }

};

function keyPressed() {
  downKeys[keyCode] = true;

  if (scene === 2) {
    me.onKeyDown(keyCode);
    tutorial.onKeyDown(key);
  }

};

function keyReleased() {
  downKeys[keyCode] = false;

  if (scene === 2) {
    me.onKeyUp(keyCode);
  }
};

function mousePressed() {
  if (scene === 1) {// Menu scene
    if (mouseIsPressed && mouseX > 5 && mouseX < 45 && mouseY > height-45 && mouseY < height-5) {
      document.getElementById("content").style.display = "block";
    }
  } else if (scene === 2) {// Main game scene
    weaponScroller.onMouseDown(mouseButton);
    buildMenu.onMouseDown();
  }
  for (var i = 0; i < guiStuffs[scene].length; i ++) {
    guiStuffs[scene][i].onMouseDown();
  }

};

function mouseReleased() {
  if (scene === 2) {// Main game scene
    weaponScroller.onMouseUp(mouseButton);
  }
  for (var i = 0; i < guiStuffs[scene].length; i ++) {
    guiStuffs[scene][i].onMouseUp();
  }
};

function windowResized () {
  resizeCanvas(min(MAXCANVASWIDTH, windowWidth), min(MAXCANVASHEIGHT, windowHeight));
  cam.hw = windowWidth/2;
  cam.hh = windowHeight/2;

  if (teamStats) {
    teamStats.y1 = height;
  }
}

function draw() {







  switch (scene) {
    case 0: // Load images
    imageLoader.update();
    background(0);
    break;

    case 1: // Menu
    background(217, 217, 217);

    /* Follow me on GitHub */
    fill(255);
    stroke(0);
    strokeWeight(2);
    rect(5, height-45, 40, 40);
    fill(0);
    textFont(fonts.airalBold, 20);
    textAlign(LEFT, LEFT);
    text("GH", 10, height-17);
    textAlign(CENTER, CENTER);
    noStroke();



    break;

    case 2: // Game
    /// For debugging purposes:
    //teamStats.points[0] = 50;
    if (downKeys[80]) {teamStats.points[0] += 1;}// If you press the P key, your points go up really fast

    isMeInsideBase = false;

    cameraUpdate();

    factory.update();

    background(148, 161, 149);

    fill(50, 171, 78);
    for (var i = 0; i < 25; i++) {
      if (i % 2 === 0) {
        image(images.grassGrid, X(Math.floor(i / 5)), Y(i % 5), S(1), S(1));
      }
    }

    for (var i = airObjects.length - 1; i >= 0; i--) {
      if (airObjects[i].isDead) {
        airObjects.splice(i, 1);
      } else {
        airObjects[i].update();
      }
    }
    if (frameCount % 60 === 0) { // sort every second
      airObjects.sort(function (a, b) { // sort by height so higher objects are drawn on top
        return a.ht - b.ht;
      });
    }
    for (var i = 0; i < airObjects.length; i++) {
      airObjects[i].draw();
      if (airObjects[i].ht > cam.ht) {
        break;
      }
    }
    for (var i = infoBarObjects.length - 1; i >= 0; i--) {
      if (infoBarObjects[i].isDead) {
        infoBarObjects.splice(i, 1);
      } else if (infoBarObjects[i].isVisible) {
        infoBarObjects[i].infoBar();
      }

    }

    cameraOverlay();

    buildMenu.update();

    weaponScroller.update();

    teamStats.update();
    tutorial.update();
    pointer.update();
    pauseMenu.update();

    break;

    case 3:// Main game paused

    pauseMenu.update();

    break;

    default:
    println("Script error: Scene " + scene + " does not exist.");
  }

  for (var i = 0; i < guiStuffs[scene].length; i ++) {
    guiStuffs[scene][i].update();
  }

  notification.update();









  // FPS /// debugging
  // Draw FPS (rounded to 2 decimal places) at the bottom left of the screen
  let fps = frameRate();
  fill(255);
  stroke(0);
  text("FPS: " + fps.toFixed(2), 10, height - 10);
  noStroke();
}
