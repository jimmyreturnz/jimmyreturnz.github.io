// Builds the site's Intro as an EffectCraft project (timings are the site's, at the slowed 0.5x speed: about 10 s).
// Run: effectcraft-cli script build-intro.jsx --save-as intro.ecproj   (or File > Run Script in the app)
// Every piece is its own layer with keyframes, so you can drag, retime and restyle them. The site code is site/src/scripts/intro.ts.
var W = 1920, H = 1080, FPS = 30, DUR = 10;
var PINK = [1, 0.48, 0.69], SKY = [0.44, 0.76, 1], LAV = [0.72, 0.61, 1], INK = [0.12, 0.118, 0.2];
var comp = app.project.items.addComp("Intro", W, H, 1, DUR, FPS);
var tf = function (l, n) { return l.property("Transform").property(n); };
function solid(name, col, t0, t1) { var s = comp.layers.addSolid(col, name, W, H, 1); s.inPoint = t0; s.outPoint = t1; return s; }
function fade(l, t0, t1, a, b) { var o = tf(l, "Opacity"); o.setValueAtTime(t0, a); o.setValueAtTime(t1, b); }
function shape(name, kind, size, fill, stroke, sw) {
  var l = comp.layers.addShape(); l.name = name;
  var g = l.property("Contents").addProperty("ADBE Vector Group");
  var s = g.property("Contents").addProperty(kind === "rect" ? "ADBE Vector Shape - Rect" : "ADBE Vector Shape - Ellipse");
  s.property("Size").setValue(size);
  if (fill) g.property("Contents").addProperty("ADBE Vector Graphic - Fill").property("Color").setValue(fill);
  if (stroke) { var st = g.property("Contents").addProperty("ADBE Vector Graphic - Stroke"); st.property("Color").setValue(stroke); st.property("Stroke Width").setValue(sw || 6); }
  tf(l, "Position").setValue([W / 2, H / 2]);
  return l;
}
function text(str, pos, size, col, t0, t1) {
  var l = comp.layers.addText(str);
  try { var d = l.property("Source Text").value; d.fontSize = size; d.fillColor = col; d.applyFill = true; l.property("Source Text").setValue(d); } catch (e) {}
  tf(l, "Position").setValue(pos); if (t0 !== undefined) { l.inPoint = t0; l.outPoint = t1; } return l;
}

// 0 · background + power button (hold 0 - 1.4 s: the ring fills, the button swells)
var bg = solid("Background", INK, 0, 2.9);
var ring = shape("Power ring", "ellipse", [300, 300], null, PINK, 14); ring.inPoint = 0; ring.outPoint = 1.5;
tf(ring, "Scale").setValuesAtTimes([0, 1.4, 1.5], [[100, 100], [112, 112], [150, 150]]); fade(ring, 1.4, 1.5, 100, 0);
var face = shape("Power face", "ellipse", [220, 220], [0.18, 0.17, 0.3], PINK, 6); face.inPoint = 0; face.outPoint = 1.5;
tf(face, "Scale").setValuesAtTimes([0, 1.4], [[100, 100], [112, 112]]); fade(face, 1.4, 1.5, 100, 0);
var glyph = text("⏻", [W / 2 - 40, H / 2 + 40], 110, [1, 1, 1], 0, 1.5);
var hint = text("HOLD TO POWER ON", [W / 2 - 150, H / 2 + 250], 26, [1, 0.82, 0.89], 0, 1.4);

// 1 · explosion of five ripples from the centre
for (var i = 0; i < 5; i++) {
  var r = shape("Ripple " + (i + 1), "ellipse", [120, 120], null, i % 3 === 1 ? LAV : (i % 3 === 2 ? SKY : PINK), 12);
  var t = 1.4 + i * 0.16; r.inPoint = t; r.outPoint = t + 2.2;
  tf(r, "Scale").setValuesAtTimes([t, t + 2], [[16, 16], [1800, 1800]]); fade(r, t, t + 2, 90, 0);
}

// 2 · boot: BIOS lines, heart logo, loading bar, login chip
var boot = solid("Boot screen", [0.043, 0.039, 0.078], 2.8, 5.0);
var bios = ["x3NiGMaZ BIOS v1.0", "CPU ........ OK", "MEMORY ..... 64K OK", "HEART ...... DETECTED", "BOOTING vectorheart_OS"];
for (var b = 0; b < bios.length; b++) { var tl = text(bios[b], [160, 700 + b * 46], 30, [1, 0.82, 0.89], 2.9 + b * 0.24, 5.0); fade(tl, 2.9 + b * 0.24, 2.9 + b * 0.24 + 0.01, 0, 100); }
var logo = text("♥", [W / 2 - 90, 480], 220, PINK, 3.5, 4.1);
tf(logo, "Scale").setValuesAtTimes([3.5, 3.7], [[60, 60], [100, 100]]); fade(logo, 3.5, 3.55, 0, 100); fade(logo, 4.0, 4.1, 100, 0);
var bar = shape("Loading bar", "rect", [520, 16], PINK, null); tf(bar, "Position").setValue([W / 2, 640]); bar.inPoint = 3.0; bar.outPoint = 4.1;
tf(bar, "Scale").setValuesAtTimes([3.0, 4.1], [[0, 100], [100, 100]]);
var chip = shape("Login chip", "rect", [520, 90], [1, 0.78, 0.89], [1, 0.4, 0.67], 6); chip.inPoint = 4.1; chip.outPoint = 4.85;
tf(chip, "Scale").setValuesAtTimes([4.1, 4.4], [[80, 80], [100, 100]]); fade(chip, 4.1, 4.2, 0, 100); fade(chip, 4.7, 4.85, 100, 0);
text("jimmyreturnz", [W / 2 - 110, H / 2 + 12], 40, [0.07, 0.07, 0.07], 4.1, 4.85);

// 3 · pastel desktop: stripes, two windows
var desk = solid("Desk", [0.73, 0.87, 1], 4.9, 8.2); fade(desk, 4.9, 5.1, 0, 100); fade(desk, 7.5, 8.2, 100, 0);
var stripes = comp.layers.addShape(); stripes.name = "Desk stripes"; stripes.inPoint = 4.9; stripes.outPoint = 8.2; fade(stripes, 4.9, 5.1, 0, 100); fade(stripes, 7.5, 8.2, 100, 0);
for (var k = -30; k < 30; k++) {
  var g = stripes.property("Contents").addProperty("ADBE Vector Group"); g.name = "stripe " + k;
  g.property("Contents").addProperty("ADBE Vector Shape - Rect").property("Size").setValue([4000, 34]);
  g.property("Contents").addProperty("ADBE Vector Graphic - Fill").property("Color").setValue([0.93, 0.67, 1]);
  g.property("Transform").property("Position").setValue([0, k * 68]);
}
tf(stripes, "Rotation").setValue(45); tf(stripes, "Position").setValue([W / 2, H / 2]);
var wins = [["profile.exe", "jimmyreturnz", 400, 300], ["player_card.exe", "Player Card", 1400, 420]];
for (var w = 0; w < 2; w++) {
  var win = shape(wins[w][0], "rect", [560, 200], [1, 0.78, 0.89], [1, 0.4, 0.67], 6); tf(win, "Position").setValue([wins[w][2], wins[w][3]]);
  var wt0 = 5.1 + w * 0.24; win.inPoint = wt0; win.outPoint = 7.6;
  tf(win, "Scale").setValuesAtTimes([wt0, wt0 + 0.4], [[50, 50], [100, 100]]); fade(win, wt0, wt0 + 0.2, 0, 100); fade(win, 7.5, 7.6, 100, 0);
  text(wins[w][0] + "     " + wins[w][1], [wins[w][2] - 250, wins[w][3] - 50], 28, [0.07, 0.07, 0.07], wt0, 7.6);
}

// 4 · arrow swarm from the bottom-left to the top-right (your draft)
var cols = [INK, PINK, SKY, LAV];
for (var a = 0; a < 30; a++) {
  var ar = text(">", [0, 0], a % 9 === 0 ? 120 : 52 + (a * 7) % 36, cols[a % 4], 5.4, 7.6);
  var s0 = 5.4 + ((a * 37) % 16) / 10, d = 1.8 + ((a * 13) % 8) / 10, x0 = -40 + ((a * 53) % 380), y0 = 700 + ((a * 29) % 380);
  tf(ar, "Rotation").setValue(-35);
  tf(ar, "Position").setValuesAtTimes([s0, s0 + d], [[x0, y0], [x0 + 2100, y0 - 1500]]);
  ar.inPoint = s0; ar.outPoint = s0 + d;
}

// 5 · the wave drops into the floor and the Lobby arrives
var wave = shape("Wave (replace with a shape path)", "rect", [W, 6], PINK, null); wave.inPoint = 6.9; wave.outPoint = 8.7;
tf(wave, "Position").setValuesAtTimes([6.9, 7.5, 8.2], [[W / 2, 540], [W / 2, 560], [W / 2, 1010]]); fade(wave, 8.2, 8.7, 100, 0);
var lobby = solid("Lobby (placeholder)", [1, 0.94, 0.97], 7.9, 10); fade(lobby, 7.9, 9.3, 0, 100);
text("Lobby", [W / 2 - 110, H / 2], 120, INK, 8.2, 10);
for (var f = 0; f < 48; f++) {
  var fb = shape("Floor bar " + f, "rect", [20, 120], PINK, null);
  tf(fb, "Position").setValue([30 + f * 40, 1060]); fb.inPoint = 8.2; fb.outPoint = 10;
  var sc = tf(fb, "Scale"); for (var q = 0; q < 8; q++) sc.setValueAtTime(8.2 + q * 0.2, [100, 20 + ((f * 31 + q * 47) % 80)]);
}
writeLn("Intro comp: " + comp.numLayers + " layers, " + DUR + " s");
