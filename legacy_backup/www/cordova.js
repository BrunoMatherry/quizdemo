// cordova.js stub para testar no browser
// REMOVER antes de fazer build para Android (ou ignorar — o build substitui)
window.cordova = { platformId: 'browser', version: '15.0.0' };
window.admob = undefined; // AdMob não disponível no browser
document.dispatchEvent(new Event('deviceready'));
