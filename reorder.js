const fs = require('fs');

const filePath = 'index.html';
let html = fs.readFileSync(filePath, 'utf8');

// 1. Extract Laboratory section
const labStartStr = '    <!-- ─────────────────────────────────────────────────────────\r\n       PRODUCT LABORATORY SEQUENCE\r\n       ───────────────────────────────────────────────────────── -->\r\n    <section id="laboratory" aria-label="Product Laboratory">';
const labEndStr = '      </div>\r\n    </section>\r\n';

const labStart = html.indexOf(labStartStr);
const labEnd = html.indexOf(labEndStr, labStart) + labEndStr.length;

if (labStart === -1 || labEnd === -1) {
  console.error("Could not find laboratory section");
  process.exit(1);
}

const labSection = html.slice(labStart, labEnd);

// Remove laboratory section from original location
html = html.slice(0, labStart) + html.slice(labEnd);

// 2. Remove Inside Engine section
const engineStartStr = '    <!-- ─────────────────────────────────────────────────────────\r\n       INSIDE THE ENGINE — VIDEO SCROLL SEQUENCE\r\n       ───────────────────────────────────────────────────────── -->\r\n    <section id="inside-engine" aria-label="Inside the Engine">';
const engineEndStr = '      </div>\r\n    </section>\r\n';

const engineStart = html.indexOf(engineStartStr);
const engineEnd = html.indexOf(engineEndStr, engineStart) + engineEndStr.length;

if (engineStart !== -1 && engineEnd !== -1) {
  html = html.slice(0, engineStart) + html.slice(engineEnd);
} else {
    console.error("Could not find inside engine section");
}


// 3. Remove Performance section
const perfStartStr = '    <!-- ─────────────────────────────────────────────────────────\r\n       ENGINE PERFORMANCE SEQUENCE\r\n       ───────────────────────────────────────────────────────── -->\r\n    <section id="performance" aria-label="Engine Performance">';
const perfEndStr = '      </div>\r\n    </section>\r\n';

const perfStart = html.indexOf(perfStartStr);
const perfEnd = html.indexOf(perfEndStr, perfStart) + perfEndStr.length;

if (perfStart !== -1 && perfEnd !== -1) {
  html = html.slice(0, perfStart) + html.slice(perfEnd);
} else {
    console.error("Could not find performance section");
}


// 4. Insert Laboratory section after Hero section
const heroEndStr = '      </div><!-- /.hero__sticky -->\r\n    </section><!-- /#hero -->\r\n';
const heroEndIdx = html.indexOf(heroEndStr) + heroEndStr.length;

if (heroEndIdx !== -1) {
    html = html.slice(0, heroEndIdx) + '\r\n' + labSection + html.slice(heroEndIdx);
} else {
    console.error("Could not find hero end");
}

fs.writeFileSync(filePath, html, 'utf8');
console.log("Sections reordered and removed successfully.");
