// ==UserScript==
// @name         CRA Keep Alive
// @namespace    CRA
// @version      0.2.1
// @description  try to take over the world!
// @author       Invertex
// @updateURL    https://github.com/Invertex/CRAKeepActive/raw/main/CRAKeepActive/cra_keep_active.user.js
// @downloadURL  https://github.com/Invertex/CRAKeepActive/raw/main/CRAKeepActive/cra_keep_active.user.js
// @match        https://apps8.ams-sga.cra-arc.gc.ca/gol-ged/mima/ngbeta/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gc.ca
// @match        https://gc.ca/*
// @match        https://*.gc.ca/*
// @match        https://*.canada.ca/*
// @match        https://apps1.ams-sga.cra-arc.gc.ca/*
// @match        https://turbotax.intuit.ca/product/services/tdis/index.jsp?*
// @require      https://raw.githubusercontent.com/Invertex/Invertex-Userscript-Tools/4dee87b7062752f39ba5ec8a780011682b0ffde4/userscript_tools.js
// @noframes
// @run-at       document-end
// @grant        GM_addStyle
// @grant        window.close
// @grant        unsafeWindow
// ==/UserScript==

GM_addStyle(`charlie { display: none !important; }`); //Get rid of stupid AI chatbot

let lastUrl = location.href;
let craklFrame;

function setupURLChangeListener()
{
    setInterval(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            processPage(currentUrl);
        }
    }, 300);
}

function keepAlive(button)
{
    const rect = button.getBoundingClientRect();
    const e = new Event('click', { bubbles: true, cancelable: true, screenX: rect.x, screenY: rect.y });
    button.dispatchEvent(e);
}

function keepAliveTrigger(docBody)
{
    const dismiss = docBody.querySelector('div#modal-footer > button.popup-modal-dismiss');
    if(dismiss) {
        setTimeout(() => { keepAlive(dismiss); }, 5000);
    }
    else {
        const continueBtn = docBody.querySelector('div.mat-mdc-dialog-surface div.quartz-dialog .mat-mdc-dialog-content button.quartz-primary-button');
        if(continueBtn) {
            const label = continueBtn.querySelector('.mdc-button__label > span');
            if(label?.innerText?.includes("Continue session"))
            {
                setTimeout(() => { keepAlive(continueBtn); }, 5000);
            }

        }
    }
    unsafeWindow?.awsc?.warningTimer?.extendSession();
    setTimeout(() => { keepAliveTrigger(docBody); }, 40000);
}

function doKeepAliveRefresh(mainFrame)
{
    setTimeout(() => {
        if(mainFrame == null) { mainFrame = craklFrame; }
        mainFrame.contentWindow.location.reload(true);
        doKeepAliveRefresh(mainFrame); }, 50000);
}

async function createKeepAliveFrame(url)
{
    let sinfield = await awaitElem(document, 'body [controlname="sin"] input', argsChildAndSub);

    if(sinfield.hasAttribute('crakl') === false)
    {
        sinfield.setAttribute('crakl', '');

        sinfield.addEventListener("paste", (event) => {
            event.preventDefault();
            let paste = (event.clipboardData || window.clipboardData).getData("text/plain");
            paste = paste.replaceAll(/\s/g,'');
            sinfield.value = paste;
            const triggerInput = new Event('input', { bubbles: true, cancelable: true });
            sinfield.dispatchEvent(triggerInput);
        });
    }

    if(craklFrame == null)
    {
        let existingCraklFrame = document.getElementById("keepAliveFrame");
        if(existingCraklFrame){ craklFrame = existingCraklFrame; }
        else
        {
            console.log("Make keep-alive frame");
            craklFrame = document.createElement("iframe");
            craklFrame.id = 'keepAliveFrame';
            craklFrame.name = 'keepAliveFrame';
            craklFrame.style.width = '0%';
            craklFrame.style.height = '0px';
            document.body.appendChild(craklFrame);
            craklFrame.onload = function()
            {
                var iframeDoc = craklFrame.contentDocument || craklFrame.contentWindow.document;
                awaitElem(iframeDoc, 'body', argsChildAndSub).then((mainBod)=>
                {
                    keepAliveTrigger(mainBod);
                });
            };

            craklFrame.src = url;
            doKeepAliveRefresh(craklFrame);
        }
     }
}

async function processPage(url)
{
    if(url.includes('turbotax.intuit.ca/product/services/tdis/index.jsp') && url.includes('cra.js'))
    {
        await sleep(5.0);
        window.close();
        return;
    }
    else if(url.includes('/gol-ged/awsc/amss/enrol/2fa-otp'))
    {
        const doNotAsk = await awaitElem(document, 'body #doAcceptCookie', argsChildAndSub);
        if(doNotAsk)
        {
            doNotAsk.click();
        }
    }
    else if(url.includes('#/rep/rac/welcome'))
    {
        setTimeout(() => { createKeepAliveFrame(url); }, 600);
    }
    else if(url.includes('gol-ged/awsc/cms/postlogin/welcome?'))
    {
        const iGetIt = await awaitElem(document, 'body #submitBtn', argsChildAndSub);
        await sleep(0.2);
        iGetIt?.click();
    }
    else if(url.includes('gol-ged/awsc/amss/2fa/selectmethod'))
    {
        const telly = await awaitElem(document, 'body #phoneID', argsChildAndSub);
        telly?.click();
        await sleep(0.1);
        const submit = await awaitElem(document, 'body #submitButton', argsChildAndSub);
        submit?.click();
    }
    else if(url.includes('gol-ged/awsc/amss/2fa/selectphonemethod'))
    {
        const smsMe = await awaitElem(document, 'body #smsButton', argsChildAndSub);
        await sleep(0.2);
        smsMe?.click();
    }
}

(function() {
    setTimeout(() => {
        awaitElem(document, 'body', argsChildAndSub).then((mainBod)=>{
            keepAliveTrigger(mainBod);
        });
    }, 10000);
    if(unsafeWindow.top === unsafeWindow.self)
    {
        console.log("starting cra keep alive");
        processPage(window.location.href);
        setupURLChangeListener();
    }
    else { console.log("starting cra keep alive subframe"); }
})();
