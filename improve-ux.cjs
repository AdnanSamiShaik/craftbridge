const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMarketplace.tsx', 'utf-8');

// Update Nav
code = code.replace(
  'bg-surface/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-outline-variant/20',
  'bg-surface/80 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-outline-variant/30'
);

// Update Nav buttons
code = code.replace(
  'className="flex flex-col items-center justify-center text-primary p-2 w-16"',
  'className="flex flex-col items-center justify-center text-primary p-2 w-16 hover:scale-105 transition-transform duration-200"'
);

// Update Floating AI button
code = code.replace(
  'className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform border-4 border-surface"',
  'className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-tr from-primary to-[#7b4dff] text-white rounded-full shadow-[0_8px_20px_rgba(123,77,255,0.3)] flex items-center justify-center active:scale-95 hover:scale-105 hover:shadow-[0_12px_24px_rgba(123,77,255,0.4)] transition-all duration-300 border-4 border-surface"'
);
code = code.replace(
  '<span className="material-symbols-outlined text-[28px]">smart_toy</span>',
  '<span className="material-symbols-outlined text-[28px] animate-pulse">auto_awesome</span>'
);

// Enhance AI Modal
code = code.replace(
  '<div className="bg-surface w-full max-w-md sm:rounded-3xl rounded-t-3xl p-gutter-mobile pb-safe shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300">',
  '<div className="bg-surface w-full max-w-md sm:rounded-3xl rounded-t-3xl p-gutter-mobile pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-bottom-8 duration-300 border border-outline-variant/10">'
);

// Better inputs
code = code.replace(
  /className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant\/50 focus:border-primary focus:ring-1 outline-none font-body-lg min-h-\[120px\] resize-none"/g,
  'className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 focus:border-[#7b4dff] focus:ring-2 focus:ring-[#7b4dff]/20 outline-none font-body-lg min-h-[140px] resize-none shadow-inner transition-all"'
);

// Better buttons
code = code.replace(
  /className="h-14 bg-primary text-on-primary rounded-xl font-title-md font-bold shadow-md flex items-center justify-center gap-2"/g,
  'className="h-14 bg-gradient-to-r from-primary to-[#7b4dff] text-white rounded-2xl font-title-md font-bold shadow-[0_4px_14px_rgba(123,77,255,0.3)] hover:shadow-[0_6px_20px_rgba(123,77,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"'
);

// Product Cards UX improvements
code = code.replace(
  'className="w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col cursor-pointer border border-outline-variant/30 hover:shadow-md transition-shadow"',
  'className="w-full bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col cursor-pointer border border-outline-variant/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"'
);
code = code.replace(
  'className="w-full h-full object-cover"',
  'className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"'
);

fs.writeFileSync('src/components/CustomerMarketplace.tsx', code);
