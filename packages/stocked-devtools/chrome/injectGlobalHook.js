/// <reference types="chrome" />

const extensionId = chrome.runtime.id;

const bridgeScript = `window.__STOCKED_DEVTOOLS_HOOK = {
    isLoaded: false,
    messageQueue: [],
    onLoad: function() {
        this.isLoaded = true;

        for(const message of this.messageQueue) {
            window.postMessage(message);
        }

        this.messageQueue = [];
    },
    raiseEvent: function (e, data) {
        if(data.data && Array.isArray(data.data.paths)) {
            data.data.paths = data.data.paths.map(function(value) {
                return typeof value === 'symbol' ? '__ROOT_PATH' : value;
            });
        }
        const message = {
            event: e,
            data,
            extensionId: "${extensionId}"
        };

        if(this.isLoaded) {
            window.postMessage(message);
        } else {
            this.messageQueue.push(message);
        }
    }
};
`;

function injectScript(code) {
    const script = document.createElement('script');
    script.textContent = code;

    document.documentElement.appendChild(script);
    script.parentNode.removeChild(script);
}

window.addEventListener('message', function ({ source, data }) {
    if (source !== window || !data) {
        return;
    }

    if (data.extensionId !== extensionId) {
        return;
    }

    chrome.runtime.sendMessage(extensionId, data);
});

injectScript(bridgeScript);

chrome.runtime.sendMessage(extensionId, { type: 'internal', event: 'load' });
