var userAgent = navigator.userAgent.toLowerCase();
if (userAgent.indexOf(' electron/') > -1) {
    var path = window.require('path').join(process.cwd(), 'butler', 'electron', 'node_modules');
    window.require('module').globalPaths.push(path);
}
