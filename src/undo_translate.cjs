/* Release */
const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  let content = fs.readFileSync(path.join(dir, f), 'utf-8');

  // Fix generics disaster that I caused:
  // e.g. `{t("....")}` across newlines.
  // We can just find all `{t(" ... ")}` and replace them with ` ... ` UNLESS they are like `>{t("...")}<` or `title={t("...")}` 
  // Wait, no. The best is to replace EVERY `{t("...")}` that I injected, EXCEPT the ones already there.
  // How do I know which were already there? I don't!
  // BUT I can just replace ALL `{t("...")}` everywhere inside elements with just the text!
  
  // Wait, I can make a reliable reversal:
  // 1. Revert title={t("...")} to title="..."
  content = content.replace(/title={t\("([^"]+)"\)}/g, 'title="$1"');

  // 2. Revert placeholder={t("...")} to placeholder="..."
  content = content.replace(/placeholder={t\("([^"]+)"\)}/g, 'placeholder="$1"');

  // 3. Revert >{t("...")}< to >...<
  content = content.replace(/>\{t\("([^"]+)"\)\}</g, '>$1<');

  // 4. Revert the multi-line disaster `{t("... \n ... ")}` to `... \n ... `
  // I only broke it because of Multi-line! So any {t(" ... ")} that contains a newline or `<` or `>` can be safely unwrapped.
  content = content.replace(/\{t\("([\s\S]*?)"\)\}/g, (match, p1) => {
     if (p1.includes('\n') || p1.includes('<') || p1.includes('>')) {
         return p1.replace(/\\"/g, '"');
     }
     // For single line texts, if they are still remaining (e.g. they were `{t("...")}` inside code block), unwrapping them will turn `{t("foo")}` to `foo`.
     // Let's just unwrap ALL of them!
     // Wait, if I unwrap all of them, `<span>{t("foo")}</span>` becomes `<span>foo</span>`.
     // Is `<span>foo</span>` valid JSX? YES!
     return p1.replace(/\\"/g, '"');
  });

  fs.writeFileSync(path.join(dir, f), content, 'utf-8');
});
console.log("Restored!");
