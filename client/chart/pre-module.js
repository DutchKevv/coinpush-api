var bootCanvas = document.createElement('canvas');

bootCanvas.style.position = 'absolute';
bootCanvas.style.top = 0;
bootCanvas.style.left = 0;
document.body.appendChild(bootCanvas);

Module = Module || {};
Module.canvas = bootCanvas;
// Module.filePackagePrefixURL = '';
Module.noInitialRun = false;
Module.noExitRuntime = false;
// Module.locateFile = function(fileName) {
//     return './chart/' + fileName;
// }