// ==UserScript==
// @name         CRA Keep Alive
// @namespace    CRA
// @version      0.2.7
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
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        window.close
// @grant        unsafeWindow
// ==/UserScript==

let lastUrl = location.href;
let craklFrame;

GM_addStyle(`
/* Get rid of stupid AI chatbot */
charlie { display: none !important; }
chatbot { display: none !important; }
/* Options */
#craklOpts {
 display: block;
 position: fixed;
 top: 0px;
 right: 0px;
 width: 120px;
 height: 40px;
 font-size: auto;
}
#craklOpts > button { border-radius: 4px; height: 40px; width: 120px; }
#craklOpts > button.pressed { background-color: LightBlue; }
#craklOpts > button:hover { background-color: DarkGray !important; }
#craklOpts > button > label { font-size: 14px;}`);

//<--> Save/Load User Cutom Prefs <-->//
var opt_autoSMS;


//** UTILITY FUNCTIONS **//
async function getToggleObj(name, defaultVal)
{
    const enable = await getUserPref(name, defaultVal);
    return {enabled: enable, elem: null, button: null, label: null, name: name, onChanged: new EventTarget()};
}

//** LOGIC **//
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
    const continueBtn = docBody.querySelector('div.cdk-overlay-container div.cdk-overlay-pane div.mat-mdc-dialog-surface div.quartz-dialog .mat-mdc-dialog-content button.quartz-primary-button');
    if(continueBtn) {
        const label = continueBtn.querySelector('.mdc-button__label > span');
        if(label?.innerText?.includes("Continue session"))
        {
            setTimeout(() => { keepAlive(continueBtn); }, 5000);
        }
    }
    else
    {
        const dismiss = docBody.querySelector('div#modal-footer > button.popup-modal-dismiss');
        if(dismiss) {
            setTimeout(() => { keepAlive(dismiss); }, 5000);
        }
    }
    unsafeWindow?.awsc?.warningTimer?.extendSession();
    setTimeout(() => { keepAliveTrigger(docBody); }, 40000);
}

function doKeepAliveRefresh(mainFrame)
{
    setTimeout(() => {
        if(mainFrame == null) { mainFrame = craklFrame; }
        mainFrame.contentWindow.location.reload();
        doKeepAliveRefresh(mainFrame); }, 50000);
}

async function createKeepAliveFrame(url)
{
    let sinfield = await awaitElem(document, 'body [controlname="sin"]', argsChildAndSub);

    if(sinfield.hasAttribute('crakl') === false)
    {
        sinfield.setAttribute('crakl', '');
        let sininput = sinfield.querySelector('[formcontrolname="sin"] input');

        sininput.addEventListener("paste", (event) => {
            event.preventDefault();
            let paste = (event.clipboardData || window.clipboardData).getData("text/plain");
            paste = paste.replaceAll(/\s/g,'');
            sininput.value = paste;
            const triggerInput = new Event('input', { bubbles: true, cancelable: true });
            sininput.dispatchEvent(triggerInput);
        });

        let subSinBtn = sinfield.querySelector('[type="submit"] > button');
        sininput.addEventListener("keypress", (event) => {
            if((event.code === 'Enter' || event.code === 'NumpadEnter' ) && !sininput.classList.contains('quartz-invalid'))
            {
                subSinBtn.click();
            }
        });
    }

    if(craklFrame == null)
    {
        let existingCraklFrame = document.getElementById("keepAliveFrame");
        if(existingCraklFrame){ craklFrame = existingCraklFrame; }
        else
        {
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
           // doKeepAliveRefresh(craklFrame);
        }
     }
}

async function setupLoginPage()
{
    if(opt_autoSMS == null)
    {
        opt_autoSMS = await getToggleObj('crakl_autoSMS', true);
        if(opt_autoSMS.enabled == undefined) { opt_autoSMS.enabled = true; }
    }

    let optionsContainer = document.getElementById('craklOpts');
    if(optionsContainer == null)
    {
        optionsContainer = document.createElement('div');
        optionsContainer.id = 'craklOpts';
        const opt_autoSMSToggleButton = document.createElement('button');
        opt_autoSMSToggleButton.id = 'craklOpt-AutoSMS';

        const toggleLabel = document.createElement('label');
        toggleLabel.innerText = "Auto SMS: ON";
        opt_autoSMSToggleButton.appendChild(toggleLabel);
        optionsContainer.appendChild(opt_autoSMSToggleButton);


        opt_autoSMS.label = toggleLabel;
        opt_autoSMS.button = opt_autoSMSToggleButton;

        opt_autoSMS.onChanged.addEventListener(opt_autoSMS.name,(e) =>
                                               {
            opt_autoSMS.enabled = e.detail.toggle;
            opt_autoSMS.button.classList.toggle('pressed', opt_autoSMS.enabled);
            if(opt_autoSMS.enabled != undefined)
            {
                setUserPref(opt_autoSMS.name, opt_autoSMS.enabled);
            }
            opt_autoSMS.label.innerText = opt_autoSMS.enabled ? "Auto SMS: ON" : "Auto SMS: OFF";
        });
        opt_autoSMS.button.addEventListener('click', (e) =>
                                            {
            opt_autoSMS.onChanged.dispatchEvent(new CustomEvent(opt_autoSMS.name, {detail: {'toggle': opt_autoSMS.enabled ? false : true}}));
        }, false);

        opt_autoSMS.onChanged.dispatchEvent(new CustomEvent(opt_autoSMS.name, { detail: {'toggle': opt_autoSMS.enabled}}));
        document.body.appendChild(optionsContainer);
    }
}

async function processPage(url)
{
    if(url.includes('turbotax.intuit.ca/product/services/tdis/index.jsp') && url.includes('cra.js'))
    {
        await sleep(2.5);
        window.close();
        return;
    }
    else if(url.includes('/gol-ged/awsc/amss/enrol/2fa-otp'))
    {
        const otpForm = await awaitElem(document, 'body #TwoFactorAuthenticationOTPForm', argsChildAndSub);
        
        if(otpForm)
        {
            const doNotAsk = await awaitElem(otpForm, '#doAcceptCookie', argsChildAndSub);
            doNotAsk.click();
            const otpField = await awaitElem(otpForm, '.inputContainer input#otp', argsChildAndSub);
            otpField.focus();
        }
    }
    else if(url.endsWith('e-services/cra-login-services.html'))
    {
       await setupLoginPage();
    }
    else if(url.includes('#/rep/rac/welcome'))
    {
        setTimeout(() => { createKeepAliveFrame(url); }, 600);
    }
    else if(url.includes('gol-ged/awsc/cms/postlogin/welcome?'))
    {
        const iGetIt = await awaitElem(document, 'body #submitBtn', argsChildAndSub);
        await sleep(0.1);
        iGetIt?.click();
    }
    else if(url.includes('gol-ged/awsc/amss/2fa/selectmethod'))
    {
        await setupLoginPage();
        if(opt_autoSMS.enabled === true)
        {
            const telly = await awaitElem(document, 'body #phoneID', argsChildAndSub);
            telly?.click();
            await sleep(0.1);
            const submit = await awaitElem(document, 'body #submitButton', argsChildAndSub);
            submit?.click();
        }
    }
    else if(url.includes('gol-ged/awsc/amss/2fa/selectphonemethod'))
    {
        const smsMe = await awaitElem(document, 'body #smsButton', argsChildAndSub);
        await sleep(0.1);
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
