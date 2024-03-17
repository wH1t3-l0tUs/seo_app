const { remote, Key } = require('webdriverio');
const { ADB } = require('appium-adb');
require('dotenv').config();

const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    // 'appium:deviceName': 'dm1qxxx',
    // 'appium:appPackage': 'com.android.chrome',
    // 'appium:appActivity': 'com.google.android.apps.chrome.Main',
    browserName: 'chrome',
    'appium:chromeOptions': {
        args: ['--disable-fre'],
    },
};

const wdOpts = {
    hostname: process.env.APPIUM_HOST || 'localhost',
    port: 4723,
    logLevel: 'info',
    capabilities,
};

const MAX_TRY_TIME = 25;
const searchString = process.env.SEARCH_STRING;
const phoneNumber = process.env.PHONE_NUMBER;
const mainLoopTime = process.env.TIMES;

console.log('search', phoneNumber);

async function scrollDown(driver, size) {
    // await driver
    //     .action('pointer')
    //     .move(size.width / 2, size.height - 600)
    //     .down()
    //     .pause(200)
    //     .move(size.width / 2, size.height - 1800)
    //     .pause(200)
    //     .up()
    //     .perform();

    // await driver.scroll({ top: 1000, left: 0, behavior: 'smooth' });
    await driver.execute(`window.scrollBy({
        top: 1000,
        left: 0,
        behavior: "smooth",
      })`);
}

function convertKeyword(keyword) {
    return keyword.replace(' ', '+');
}

async function mainFunction(driver) {
    const size = await driver.getWindowSize();

    driver.url(
        `https://www.google.com/search?q=${convertKeyword(searchString)}`
    );

    let count = 0;

    let foundElement;

    loop_scroll: while (count < MAX_TRY_TIME) {
        const call_buttons = await driver.$$(`a[role='button']>div>div>div`);

        for (let el of call_buttons) {
            console.log('=================', await el.getText());
            const text = await el.getText();

            if (text && text.includes(`Gọi ${phoneNumber}`)) {
                foundElement = el;
                break loop_scroll;
            }
        }

        await scrollDown(driver, size);

        console.log('=================', foundElement);

        count++;
        await driver.pause(1000);
    }

    if (foundElement) {
        if (!(await foundElement.isDisplayed())) {
            await foundElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            });
        }
        await foundElement.click();
        return;
    }

    // if (count == -1) {
    //     return;
    // } else if (count < MAX_TRY_TIME) {
    //     const call_button = await driver.$(
    //         '//android.widget.Button[@text="Gọi 0378 747 777 Taxi hồng lĩnh hà tĩnh"]'
    //     );
    //     await call_button.click();
    //     return;
    // }
}

async function main() {
    const adb = await ADB.createADB();

    await adb.shell('am set-debug-app --persistent com.android.chrome');

    for (let i = 0; i < mainLoopTime; i++) {
        const driver = await remote(wdOpts);
        await mainFunction(driver);
        driver.pause(3000);
        driver.deleteSession();
    }
}

main().catch(console.error);
