const fs = require('fs');
const filePath = 'index.html';
let html = fs.readFileSync(filePath, 'utf8');

function removeSection(startStr, endStr) {
  const start = html.indexOf(startStr);
  if (start === -1) {
    console.warn("Could not find start: " + startStr.substring(0, 50));
    return;
  }
  const end = html.indexOf(endStr, start) + endStr.length;
  if (end === -1) {
      console.warn("Could not find end for: " + startStr.substring(0, 50));
      return;
  }
  html = html.slice(0, start) + html.slice(end);
}

// 1. Remove Technology
removeSection(
    '    <!-- ─────────────────────────────────────────────────────────\r\n       TECHNOLOGY SEQUENCE',
    '      </div>\r\n    </section>\r\n'
);

// 2. Remove Story
removeSection(
    '    <!-- ─────────────────────────────────────────────────────────\r\n       BRAND STORY SEQUENCE',
    '      </div>\r\n    </section>\r\n'
);

// 3. Rebuild Finale (just footer, no sticky/video)
const finaleStartStr = '    <!-- ─────────────────────────────────────────────────────────\r\n       FINALE SEQUENCE & FOOTER';
const finaleEndStr = '      </div>\r\n    </section>\r\n';

const fStart = html.indexOf(finaleStartStr);
const fEnd = html.indexOf(finaleEndStr, fStart) + finaleEndStr.length;

if (fStart !== -1 && fEnd !== -1) {
    // Extract the fin-footer part
    const footerStartStr = '<div class="fin-footer" aria-hidden="true">';
    const footerStart = html.indexOf(footerStartStr, fStart);
    const footerEndStr = '        </div>\r\n\r\n      </div>\r\n    </section>';
    
    // Let's just do a manual string replacement for the footer block to simplify
    const newFooter = `    <!-- ─────────────────────────────────────────────────────────
       FOOTER
       ───────────────────────────────────────────────────────── -->
    <footer class="fin-footer" style="position: relative; height: auto; opacity: 1; visibility: visible; transform: none; padding: 4rem 2rem;">
      <div class="fin-cta-block">
        <h2 class="t-display fin-cta-title">YOUR ENGINE<br>NEVER STOPS.</h2>
        <h2 class="t-display fin-cta-title" style="margin-bottom: var(--sp-8);">NEITHER<br><span class="red">SHOULD YOU.</span></h2>
        <h3 class="t-display fin-cta-brand">MILEAGE MASTER</h3>
        <div class="fin-links">
          <a href="#products" class="footer-link"><span class="f-text">EXPLORE PRODUCTS</span><span class="f-arrow">→</span></a>
          <a href="#finder" class="footer-link btn-primary-footer"><span class="f-text" style="color: white;">FIND YOUR OIL</span><span class="f-arrow" style="color: white;">→</span></a>
          <a href="#contact" class="footer-link"><span class="f-text">CONTACT US</span><span class="f-arrow">→</span></a>
        </div>
      </div>
      <div class="fin-minimal-footer">
        <div class="fm-top">
          <img src="assets/images/logo.jpg" alt="Mileage Master" class="fm-logo" />
          <nav class="fm-nav">
            <a href="#engine" class="t-tech">ENGINE</a>
            <a href="#products" class="t-tech">PRODUCTS</a>
            <a href="#technology" class="t-tech">TECHNOLOGY</a>
            <a href="#story" class="t-tech">ABOUT</a>
          </nav>
          <div class="fm-social">
            <a href="#" class="t-tech">[ INSTAGRAM ]</a>
            <a href="#" class="t-tech">[ YOUTUBE ]</a>
            <a href="#" class="t-tech">[ LINKEDIN ]</a>
          </div>
        </div>
        <div class="fm-bottom">
          <div class="fm-contact t-tech">CONTACT: INFO@MILEAGEMASTER.COM</div>
          <div class="fm-legal t-micro">
            <a href="#">PRIVACY POLICY</a>
            <a href="#">TERMS OF SERVICE</a>
            <span>© 2024 MILEAGE MASTER. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </div>
    </footer>\r\n`;

    html = html.slice(0, fStart) + newFooter + html.slice(fEnd);
} else {
    console.warn("Could not find finale section");
}


fs.writeFileSync(filePath, html, 'utf8');
console.log("Sections removed and footer rebuilt successfully.");
