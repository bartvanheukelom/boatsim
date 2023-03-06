import path from "path";
import {app, BrowserWindow, nativeTheme} from "electron";
import windowStateKeeper from "electron-window-state";
import {launch} from "@typisch/core/async";
import {pimpConsoleLog} from "@typisch/earthapp/main/logging";
import {installReactDevTools, setUpDevTools} from "@typisch/earthapp/main/devTools";
import {handleIpcMainLogs} from "@typisch/electron/utils";
import {flock} from "fs-ext"
import {promisify} from "util";
import * as fs from "fs";

const fsp = fs.promises;

const flockp = promisify<number, 'sh' | 'ex' | 'shnb' | 'exnb' | 'un'>(flock)

pimpConsoleLog()

let exit_!: (code: number) => void;
const termination = new Promise<number>((resolve, _) => {
    exit_ = resolve
});
export const exit = exit_;

function termReceived(signal: NodeJS.Signals) {
    console.log(`Received signal ${signal}`)
    exit(128)
}
process.on("SIGTERM", termReceived)
process.on("SIGINT", termReceived)

process.on('unhandledRejection', async (r: any) => {
    console.error(`Unhandled rejection: ${r?.stack || r}`)
    exit(2)
})

launch(appMain);

async function appMain() {

    // Handle creating/removing shortcuts on Windows when installing/uninstalling.
    // if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    //     app.quit();
    // }

    installReactDevTools();
    nativeTheme.themeSource = "dark";

    const createWindow = (): void => {

        (async () => {
            try {

                console.log("Begin app window init")

                const winState = windowStateKeeper({
                    file: "window-state-2.json",
                    defaultWidth: 1600,
                    defaultHeight: 900,
                })

                console.log("Creating BrowserWindow")
                // Create the browser window.
                const mainWindow = new BrowserWindow({

                    width: winState.width,
                    height: winState.height,
                    x: winState.x,
                    y: winState.y,

                    backgroundColor: "#556666",
                    webPreferences: {
                        nodeIntegration: true,
                        // fixes "process not defined"
                        contextIsolation: false,
                    }
                });
                console.log("removeMenu")
                // if (!showMenuBar) {
                //     mainWindow.removeMenu()
                // }

                winState.manage(mainWindow)

                const indexPath = path.join(__dirname, '../../../../renderer/index.html')
                console.log(`Going to loadFile ${indexPath}`)
                await mainWindow.loadFile(indexPath);
                console.log(`Index loaded`)

                setUpDevTools(mainWindow, true);

                console.log(`App window init done`)

            } catch (e) {
                console.log(`${e.stack || e}`)
                process.exit(3)
            }

        })()

        handleIpcMainLogs();
    };

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    if (app.isReady()) createWindow();
    else app.on('ready', createWindow);

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', async () => {
        if (process.platform !== 'darwin') {
            await electronQuit()
        }
        // TODO else how to do cleanup at Cmd + Q?
    });

    app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    async function electronQuit() {
        await quit()
        app.quit();
    }


}

async function quit() {
    console.log("quit()");
}